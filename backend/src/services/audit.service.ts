import { prisma } from "../prisma";
import { errors } from "../lib/errors";
import { AuditAction, Prisma } from "../generated/prisma/client";
import { buildCsv } from "../utils/csv";
import { prismaDocumentAccessFilter } from "../lib/documentAccess";

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

const DOCUMENT_LIFECYCLE_AUDIT_ACTIONS: AuditAction[] = [
  "DOCUMENT_SUBMITTED",
  "DOCUMENT_CREATED",
  "DOCUMENT_DELETED",
];

class AuditService {
  private documentAccessFilter(userId: string): Prisma.DocumentWhereInput {
    return prismaDocumentAccessFilter(userId);
  }

  private mapActionToHistoryEntry(action: {
    id: string;
    createdAt: Date;
    approvalType: string;
    action: string;
    comment: string | null;
    actor: { id: string; firstName: string; lastName: string };
  }): AuditHistoryEntry {
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

  private mapDocumentUploadAction(
    action: AuditAction,
    oldValue: Prisma.JsonValue | null,
    newValue: Prisma.JsonValue | null
  ): string {
    const oldStatus =
      oldValue &&
      typeof oldValue === "object" &&
      !Array.isArray(oldValue) &&
      "status" in oldValue
        ? String((oldValue as { status?: unknown }).status)
        : null;

    if (action === "DOCUMENT_SUBMITTED" && oldStatus === "REVISION_REQUESTED") {
      return "DOCUMENT_RESUBMITTED";
    }

    if (
      action === "DOCUMENT_SUBMITTED" ||
      action === "DOCUMENT_CREATED"
    ) {
      return "DOCUMENT_UPLOADED";
    }

    if (action === "DOCUMENT_DELETED") {
      return "DOCUMENT_DELETED";
    }

    return action;
  }

  private buildUploadComment(
    newValue: Prisma.JsonValue | null
  ): string | null {
    if (
      newValue &&
      typeof newValue === "object" &&
      !Array.isArray(newValue) &&
      "versionNumber" in newValue
    ) {
      return `Version ${String((newValue as { versionNumber?: unknown }).versionNumber)}`;
    }

    return null;
  }

  private mapAuditLogToHistoryEntry(log: {
    id: string;
    createdAt: Date;
    action: AuditAction;
    oldValue: Prisma.JsonValue | null;
    newValue: Prisma.JsonValue | null;
    actor: { id: string; firstName: string; lastName: string } | null;
  }): AuditHistoryEntry {
    if (!log.actor) {
      throw errors.internal("Document upload audit log is missing actor.");
    }

    return {
      id: log.id,
      date: log.createdAt,
      time: log.createdAt,
      user: log.actor,
      role: "Preparer",
      action: this.mapDocumentUploadAction(
        log.action,
        log.oldValue,
        log.newValue
      ),
      comments: this.buildUploadComment(log.newValue),
    };
  }

  private sortHistoryEntries(entries: AuditHistoryEntry[]): AuditHistoryEntry[] {
    return [...entries].sort(
      (a, b) => b.date.getTime() - a.date.getTime()
    );
  }

  private async getAccessibleDocumentIds(userId: string): Promise<string[]> {
    const documents = await prisma.document.findMany({
      where: this.documentAccessFilter(userId),
      select: { id: true },
    });

    return documents.map((document) => document.id);
  }

  private async fetchDocumentUploadLogs(
    documentIds: string[]
  ) {
    if (documentIds.length === 0) {
      return [];
    }

    return prisma.auditLog.findMany({
      where: {
        entityType: "Document",
        entityId: { in: documentIds },
        action: { in: DOCUMENT_LIFECYCLE_AUDIT_ACTIONS },
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

    const [actions, uploadLogs] = await Promise.all([
      prisma.approvalAction.findMany({
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
      }),
      this.fetchDocumentUploadLogs([documentId]),
    ]);

    const history = [
      ...actions.map((action) => this.mapActionToHistoryEntry(action)),
      ...uploadLogs.map((log) => this.mapAuditLogToHistoryEntry(log)),
    ];

    return this.sortHistoryEntries(history);
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
    const accessibleDocumentIds = await this.getAccessibleDocumentIds(userId);

    const [actions, uploadLogs, documents] = await Promise.all([
      prisma.approvalAction.findMany({
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
      }),
      this.fetchDocumentUploadLogs(accessibleDocumentIds),
      prisma.document.findMany({
        where: {
          id: { in: accessibleDocumentIds },
        },
        select: {
          id: true,
          title: true,
          status: true,
        },
      }),
    ]);

    const documentMap = new Map(
      documents.map((document) => [document.id, document])
    );

    const approvalEntries = actions.map(
      (action): DocumentAuditEntry => ({
        documentId: action.workflowRun.document.id,
        documentTitle: action.workflowRun.document.title,
        documentStatus: action.workflowRun.document.status,
        ...this.mapActionToHistoryEntry(action),
      })
    );

    const uploadEntries = uploadLogs.flatMap((log) => {
      const document = documentMap.get(log.entityId);
      if (!document) {
        return [];
      }

      return [
        {
          documentId: document.id,
          documentTitle: document.title,
          documentStatus: document.status,
          ...this.mapAuditLogToHistoryEntry(log),
        },
      ];
    });

    const merged = this.sortDocumentAuditEntries([
      ...approvalEntries,
      ...uploadEntries,
    ]);

    if (limit !== undefined) {
      return merged.slice(0, limit);
    }

    return merged;
  }

  private sortDocumentAuditEntries(
    entries: DocumentAuditEntry[]
  ): DocumentAuditEntry[] {
    return [...entries].sort(
      (a, b) => b.date.getTime() - a.date.getTime()
    );
  }
}

export const auditService = new AuditService();
