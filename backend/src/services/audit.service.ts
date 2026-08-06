import { prisma } from "../prisma";
import { errors } from "../lib/errors";

class AuditService {
  async getDocumentAuditHistory(documentId: string) {
    const document = await prisma.document.findUnique({
      where: {
        id: documentId,
      },
      select: {
        id: true,
      },
    });

    if (!document) {
      throw errors.notFound("Document not found.");
    }

    const actions = await prisma.approvalAction.findMany({
      where: {
        workflowRun: {
          documentId,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        actor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return actions.map((action) => ({
      date: action.createdAt,
      time: action.createdAt,
      user: action.actor,
      role: action.approvalType,
      action: action.action,
      comments: action.comment,
    }));
  }
}

export const auditService = new AuditService();