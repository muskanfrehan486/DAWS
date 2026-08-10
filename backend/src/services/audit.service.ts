import { prisma } from "../prisma";
import { errors } from "../lib/errors";
import { AuditAction, Prisma } from "../generated/prisma/client";
import { buildCsv } from "../utils/csv";

type CreateAuditLogInput = {
  actorId?: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  oldValue?: Prisma.InputJsonValue;
  newValue?: Prisma.InputJsonValue;
  ipAddress?: string;
  userAgent?: string;
  tx?: Prisma.TransactionClient;
};

type AuditHistoryEntry = {
  id: string;
  date: Date;
  time: Date;
  user: {
    id: string;
    firstName: string;
    lastName: string;
  };
  role: string;
  action: string;
  comments: string | null;
};

type DocumentAuditEntry = AuditHistoryEntry & {
  documentId: string;
  documentTitle: string;
  documentStatus: string;
};

class AuditService {
  private documentAccessFilter(userId: string): Prisma.DocumentWhereInput {
    return {
      OR: [
        { preparerId: userId },
        {
          approvalChain: {
            steps: {
              some: {
                assignedUserId: userId,
              },
            },
          },
        },
      ],
    };
  }

  private mapActionToHistoryEntry(
    action: {
      id: string;
      createdAt: Date;
      approvalType: string;
      action: string;
      comment: string | null;
      actor: { id: string; firstName: string; lastName: string };
    }
  ): AuditHistoryEntry {
    return {
      id: action.id,
      date: action.createdAt,
      time: action.createdAt,
      user: action.actor,
      role: action.approvalType,
      action: action.action,
      comments: action.comment,
    };
  }

  private async assertDocumentAccess(documentId: string, userId: string) {
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        ...this.documentAccessFilter(userId),
      },
      select: { id: true },
    });

    if (!document) {
      const exists = await prisma.document.findUnique({
        where: { id: documentId },
        select: { id: true },
      });

      if (!exists) {
        throw errors.notFound("Document not found.");
      }

      throw errors.forbidden("Access denied.");
    }
  }

  async createAuditLog(input: CreateAuditLogInput) {
    const client = input.tx ?? prisma;

    return client.auditLog.create({
      data: {
        actorId: input.actorId ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        oldValue: input.oldValue ?? undefined,
        newValue: input.newValue ?? undefined,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
      },
    });
  }

  async getDocumentAuditHistory(documentId: string, userId: string) {
    await this.assertDocumentAccess(documentId, userId);

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

    return actions.map((action) => this.mapActionToHistoryEntry(action));
  }

  private formatUserName(user: {
    firstName: string;
    lastName: string;
  }): string {
    return `${user.firstName} ${user.lastName}`.trim();
  }

  private formatTimestamp(date: Date): string {
    return date.toISOString();
  }

  async exportAllDocumentsAuditCsv(userId: string): Promise<string> {
    const history = await this.getAllDocumentsAuditHistory(userId);

    const headers = [
      "Document ID",
      "Document Title",
      "Document Status",
      "Date",
      "User",
      "Role",
      "Action",
      "Comments",
    ];

    const rows = history.map((entry) => [
      entry.documentId,
      entry.documentTitle,
      entry.documentStatus,
      this.formatTimestamp(entry.date),
      this.formatUserName(entry.user),
      entry.role,
      entry.action,
      entry.comments ?? "",
    ]);

    return buildCsv(headers, rows);
  }

  async exportDocumentAuditCsv(documentId: string, userId: string): Promise<string> {
    const history = await this.getDocumentAuditHistory(documentId, userId);

    const headers = ["Date", "User", "Role", "Action", "Comments"];

    const rows = history.map((entry) => [
      this.formatTimestamp(entry.date),
      this.formatUserName(entry.user),
      entry.role,
      entry.action,
      entry.comments ?? "",
    ]);

    return buildCsv(headers, rows);
  }

  async getAllDocumentsAuditHistory(userId: string, limit?: number) {
    const actions = await prisma.approvalAction.findMany({
      where: {
        workflowRun: {
          document: this.documentAccessFilter(userId),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      ...(limit !== undefined && { take: limit }),
      include: {
        actor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        workflowRun: {
          include: {
            document: {
              select: {
                id: true,
                title: true,
                status: true,
              },
            },
          },
        },
      },
    });

    return actions.map((action): DocumentAuditEntry => ({
      documentId: action.workflowRun.document.id,
      documentTitle: action.workflowRun.document.title,
      documentStatus: action.workflowRun.document.status,
      ...this.mapActionToHistoryEntry(action),
    }));
  }
}

export const auditService = new AuditService();
