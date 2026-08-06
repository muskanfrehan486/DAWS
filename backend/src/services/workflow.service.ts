import { prisma } from "../prisma";
import { errors } from "../lib/errors";

class WorkflowService {
  async getWorkflow(documentId: string) {
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
      },
    });

    if (!document) {
      throw errors.notFound("Document not found.");
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
          : document.currentWorkflowRun &&
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