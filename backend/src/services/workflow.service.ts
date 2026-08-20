import { prisma } from "../prisma";
import { errors } from "../lib/errors";
import { canUserViewDocument, documentHasUserActed } from "../lib/documentAccess";

class WorkflowService {
  async getWorkflow(documentId: string, userId: string) {
    const document = await prisma.document.findUnique({
      where: {
        id: documentId,
      },
      include: {
        currentWorkflowRun: {
          include: {
            actions: {
              include: {
                actor: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
        approvalChain: {
          include: {
            steps: {
              include: {
                assignedUser: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
              orderBy: {
                stepOrder: "asc",
              },
            },
          },
        },
        workflowRuns: {
          select: {
            currentStepOrder: true,
            actions: {
              where: { actorId: userId },
              select: { id: true },
              take: 1,
            },
          },
        },
      },
    });

    if (!document) {
      throw errors.notFound("Document not found.");
    }

    if (
      !canUserViewDocument({
        preparerId: document.preparerId,
        userId,
        approvalChain: document.approvalChain,
        currentWorkflowRun: document.currentWorkflowRun
          ? {
              status: document.currentWorkflowRun.status,
              currentStepOrder: document.currentWorkflowRun.currentStepOrder,
              chain: document.approvalChain,
            }
          : null,
        workflowRunHistory: document.workflowRuns,
        hasUserActed: documentHasUserActed(document.workflowRuns),
      })
    ) {
      throw errors.forbidden("Access denied.");
    }

    if (
      document.status === "REVISION_REQUESTED" ||
      document.status === "DELETED"
    ) {
      const workflow = document.approvalChain?.steps.map((step) => ({
        stepOrder: step.stepOrder,
        approvalType: step.approvalType,
        assignedUser: step.assignedUser,
        status: "WAITING",
        actedAt: null,
        comment: null,
      }));

      return {
        documentId: document.id,
        documentStatus: document.status,
        workflowStatus: null,
        currentStepOrder: null,
        workflow,
      };
    }

    const actions = document.currentWorkflowRun?.actions ?? [];

    const workflow = document.approvalChain?.steps.map((step) => {
      const action = actions.find((a) => a.chainStepId === step.id);

      return {
        stepOrder: step.stepOrder,
        approvalType: step.approvalType,
        assignedUser: step.assignedUser,

        status: action
          ? action.action
          : document.currentWorkflowRun?.status === "IN_PROGRESS" &&
              step.stepOrder === document.currentWorkflowRun.currentStepOrder
            ? "PENDING"
            : "WAITING",

        actedAt: action?.createdAt ?? null,

        comment: action?.comment ?? null,
      };
    });

    return {
      documentId: document.id,
      documentStatus: document.status,
      workflowStatus: document.currentWorkflowRun?.status ?? null,
      currentStepOrder:
        document.currentWorkflowRun?.currentStepOrder ?? null,
      workflow,
    };
  }
}

export const workflowService = new WorkflowService();