import { randomUUID } from "crypto";
import { prisma } from "../prisma";
import { errors } from "../lib/errors";
import { storageService } from "../lib/supabase.storage";
import { ApprovalType } from "../generated/prisma/client";
import { notificationsService } from "./notifications.service";
import { auditService } from "./audit.service";
import {
  CreateDocumentInput,
  UpdateDocumentInput,
} from "../schemas/documents.schema";
import {
  canUserViewDocument,
  documentHasUserActed,
  prismaDocumentAccessFilter,
} from "../lib/documentAccess";

class DocumentsService {
  async createDocument(
    input: CreateDocumentInput,
    file: Express.Multer.File,
    userId: string
  ) {
    const { title, description, approvalChain } = input;
    const documentId = randomUUID();
    const versionNumber = 1;
    const storagePath = `documents/${documentId}/v${versionNumber}.pdf`;

    // Upload PDF first
    await storageService.uploadDocument(storagePath, file);

    try {
      // Make sure every assigned user exists
      const users = await prisma.user.findMany({
        where: {
          id: {
            in: approvalChain.map((step) => step.userId),
          },
        },
        select: {
          id: true,
        },
      });

      if (users.length !== approvalChain.length) {
        throw errors.badRequest(
          "One or more users in the approval chain do not exist."
        );
      }

      const document = await prisma.$transaction(async (tx) => {
        // Create Document and mark it as submitted for review
        const createdDocument = await tx.document.create({
          data: {
            id: documentId,
            title,
            description: description || null,
            preparerId: userId,
            currentVersionNumber: versionNumber,
            status: "PENDING_REVIEW",
          },
        });

        // Create Version 1
        const version = await tx.documentVersion.create({
          data: {
            documentId,
            versionNumber,
            storagePath,
            uploadedById: userId,
          },
        });

        // Create Approval Chain
        const chain = await tx.approvalChain.create({
          data: {
            documentId,
            createdById: userId,
          },
        });

        // Create Chain Steps
        await tx.approvalChainStep.createMany({
          data: approvalChain.map((step, index) => ({
            chainId: chain.id,
            assignedUserId: step.userId,
            approvalType: step.approvalType,
            stepOrder: index + 1,
          })),
        });

        // Start workflow run for the submitted document
        const workflowRun = await tx.workflowRun.create({
          data: {
            documentId,
            documentVersionId: version.id,
            chainId: chain.id,
            status: "IN_PROGRESS",
            currentStepOrder: 1,
          },
        });

        await tx.document.update({
          where: { id: documentId },
          data: {
            currentWorkflowRunId: workflowRun.id,
          },
        });

        await auditService.createAuditLog({
          actorId: userId,
          action: "DOCUMENT_SUBMITTED",
          entityType: "Document",
          entityId: documentId,
          newValue: {
            status: "PENDING_REVIEW",
            versionNumber,
            workflowRunId: workflowRun.id,
          },
          tx,
        });

        return {
          ...createdDocument,
          version,
          approvalChainId: chain.id,
          workflowRunId: workflowRun.id,
        };
      });

      const firstStep = approvalChain[0];
      if (firstStep) {
        const isReview = firstStep.approvalType === ApprovalType.REVIEWER;
        await notificationsService.createNotification({
          recipientId: firstStep.userId,
          type: "APPROVAL_NEEDED",
          title: isReview ? "Review Required" : "Approval Required",
          message: `Document "${title}" requires your ${isReview ? "review" : "approval"}.`,
          documentId,
          workflowRunId: document.workflowRunId,
        });
      }

      return {
        message: "Document created successfully.",
        document,
      };
    } catch (error) {
      // Roll back uploaded PDF if database transaction fails
      await storageService.deleteDocument(storagePath);
      throw error;
    }
  }

  async uploadVersion(
    documentId: string,
    file: Express.Multer.File,
    userId: string
  ) {

    const document = await prisma.document.findUnique({
      where: {
        id: documentId,
      },
      select: {
        id: true,
        preparerId: true,
        status: true,
        currentVersionNumber: true,
      },
    });

    if (!document) {
      throw errors.notFound("Document not found");
    }

    const oldVersion = await prisma.documentVersion.findFirst({
      where: {
        documentId,
        versionNumber: document.currentVersionNumber,
      },
    });


    if (document.preparerId !== userId) {
      throw errors.forbidden(
        "Only the document preparer can upload new versions."
      );
    }

    const versionNumber = document.currentVersionNumber + 1;

    const storagePath = `documents/${documentId}/v${versionNumber}.pdf`;

    await storageService.uploadDocument(storagePath, file);

    try {
      const version = await prisma.$transaction(async (tx) => {
        const version = await prisma.$transaction(async (tx) => {
          await tx.document.update({
            where: { id: documentId },
            data: { currentVersionNumber: versionNumber },
          });

          if (oldVersion) {
            await tx.documentVersion.update({
              where: { id: oldVersion.id },
              data: { isDeleted: true },
            });
          }

          return tx.documentVersion.create({
            data: {
              documentId,
              versionNumber,
              storagePath,
              uploadedById: userId,
            },
          });
        });
      });
      if (oldVersion) {
  await storageService.deleteDocument(oldVersion.storagePath);
}

      return {
        message: "Document version uploaded successfully.",
        version,
      };
    } catch (error) {
      await storageService.deleteDocument(storagePath);
      throw error;
    }
  }
  async getDocuments(userId: string) {
    const documents = await prisma.document.findMany({
      where: prismaDocumentAccessFilter(userId),

      include: {
        preparer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        currentWorkflowRun: {
          select: {
            id: true,
            status: true,
            currentStepOrder: true,
            chain: {
              select: {
                steps: {
                  orderBy: {
                    stepOrder: "asc",
                  },
                  select: {
                    id: true,
                    stepOrder: true,
                    approvalType: true,
                    assignedUserId: true,
                    assignedUser: {
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

      orderBy: {
        updatedAt: "desc",
      },
    });

    const filteredDocuments = documents.filter((document) =>
      canUserViewDocument({
        preparerId: document.preparerId,
        userId,
        currentWorkflowRun: document.currentWorkflowRun,
        workflowRunHistory: document.workflowRuns,
        hasUserActed: documentHasUserActed(document.workflowRuns),
      })
    );

    const documentsResult = filteredDocuments.map(
      ({ currentWorkflowRun, workflowRuns: _workflowRuns, ...rest }) => {
      const run = currentWorkflowRun;
      const totalSteps = run?.chain.steps.length ?? 0;
      const isActiveRun =
        rest.status !== "REVISION_REQUESTED" && run?.status === "IN_PROGRESS";

      const currentStep = isActiveRun
        ? run.chain.steps.find(
            (step) => step.stepOrder === run.currentStepOrder
          )
        : null;

      let workflow: { currentStepOrder: number; totalSteps: number } | null =
        null;

      if (isActiveRun && run) {
        workflow = {
          currentStepOrder: run.currentStepOrder,
          totalSteps,
        };
      } else if (rest.status === "REVISION_REQUESTED" && run) {
        workflow = {
          currentStepOrder: 0,
          totalSteps,
        };
      } else if (
        (rest.status === "APPROVED" || rest.status === "REJECTED") &&
        run
      ) {
        workflow = {
          currentStepOrder:
            rest.status === "APPROVED" ? totalSteps : run.currentStepOrder,
          totalSteps,
        };
      } else if (rest.status === "DELETED" && run) {
        workflow = {
          currentStepOrder: 0,
          totalSteps,
        };
      }

      return {
        ...rest,
        currentStep: currentStep
          ? {
              id: currentStep.id,
              stepOrder: currentStep.stepOrder,
              approvalType: currentStep.approvalType,
              assignedUser: currentStep.assignedUser,
            }
          : null,
        workflow,
      };
    }
    );

    return {
      documents: documentsResult,
    };
  }

  async getPendingApprovalCount(userId: string) {
    const documents = await prisma.document.findMany({
      where: {
        status: "PENDING_REVIEW",
        preparerId: { not: userId },
        currentWorkflowRun: {
          status: "IN_PROGRESS",
          chain: {
            steps: {
              some: {
                assignedUserId: userId,
              },
            },
          },
        },
      },
      select: {
        id: true,
        currentWorkflowRun: {
          select: {
            currentStepOrder: true,
            chain: {
              select: {
                steps: {
                  where: { assignedUserId: userId },
                  select: { stepOrder: true },
                },
              },
            },
          },
        },
      },
    });

    const count = documents.filter((document) => {
      const run = document.currentWorkflowRun;
      if (!run) return false;
      return run.chain.steps.some(
        (step) => step.stepOrder === run.currentStepOrder
      );
    }).length;

    return { count };
  }

  async getDocumentById(documentId: string, userId: string) {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        preparer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        versions: {
          where: { isDeleted: false },
          orderBy: { versionNumber: "desc" },
          take: 1,
        },
        approvalChain: {
          include: {
            steps: {
              orderBy: { stepOrder: "asc" },
              include: {
                assignedUser: {
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
        currentWorkflowRun: {
          include: {
            documentVersion: true,
            chain: {
              include: {
                steps: {
                  orderBy: { stepOrder: "asc" },
                  include: {
                    assignedUser: {
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
      throw errors.notFound("Document not found");
    }

    const currentRun = document.currentWorkflowRun;

    if (
      !canUserViewDocument({
        preparerId: document.preparerId,
        userId,
        approvalChain: document.approvalChain,
        currentWorkflowRun: currentRun,
        workflowRunHistory: document.workflowRuns,
        hasUserActed: documentHasUserActed(document.workflowRuns),
      })
    ) {
      throw errors.forbidden("Access denied");
    }

    const { workflowRuns: _workflowRuns, ...documentResult } = document;

    const currentStep =
      document.status !== "REVISION_REQUESTED" &&
      currentRun?.status === "IN_PROGRESS"
        ? currentRun.chain.steps.find(
            (step) => step.stepOrder === currentRun.currentStepOrder
          )
        : null;

    return {
      ...documentResult,
      currentStep: currentStep
        ? {
            id: currentStep.id,
            stepOrder: currentStep.stepOrder,
            approvalType: currentStep.approvalType,
            assignedUser: currentStep.assignedUser,
          }
        : null,
    };
  }

  async getDocumentFile(documentId: string, userId: string) {
    const document = await this.getDocumentById(documentId, userId);

    if (document.status === "DELETED") {
      throw errors.notFound("Document file is no longer available.");
    }

    const version =
      document.currentWorkflowRun?.status === "IN_PROGRESS"
        ? document.currentWorkflowRun.documentVersion
        : document.versions[0];

    if (!version) {
      throw errors.notFound("Document file not found");
    }

    const buffer = await storageService.downloadDocument(version.storagePath);

    return {
      buffer,
      fileName: `document-${documentId.slice(0, 8)}-v${version.versionNumber}.pdf`,
    };
  }

  async updateDocument(
  documentId: string,
  input: UpdateDocumentInput,
  file: Express.Multer.File | undefined,
  userId: string
) {
  const { title, description, approvalChain } = input;

  const document = await prisma.document.findUnique({
    where: { id: documentId },
    select: {
      id: true,
      title: true,
      preparerId: true,
      status: true,
      currentVersionNumber: true,
      currentWorkflowRunId: true,
    },
  });

  if (!document) throw errors.notFound("Document not found");
  if (document.preparerId !== userId) {
    throw errors.forbidden("Only the document preparer can update the document.");
  }
  if (document.status === "DELETED") {
    throw errors.badRequest("Deleted documents cannot be updated.");
  }
  if (document.status !== "REVISION_REQUESTED") {
    throw errors.badRequest(
      "Document can only be resubmitted when a revision has been requested."
    );
  }
  if (!file) {
    throw errors.badRequest("A revised PDF is required to resubmit the document.");
  }

  const currentVersion = await prisma.documentVersion.findFirst({
    where: { documentId, versionNumber: document.currentVersionNumber },
  });

  if (!currentVersion) {
    throw errors.internal("Current document version not found.");
  }

  const oldVersion = currentVersion;
  const versionNumber = currentVersion.versionNumber + 1;
  const storagePath = `documents/${documentId}/v${versionNumber}.pdf`;

  await storageService.uploadDocument(storagePath, file);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const updateData: Record<string, unknown> = {
        status: "PENDING_REVIEW",
        revisionRequestedByActionId: null,
        currentVersionNumber: versionNumber,
      };

      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description || null;

      await tx.document.update({ where: { id: documentId }, data: updateData });

      const chain = await tx.approvalChain.findUnique({
        where: { documentId },
        include: {
          steps: {
            orderBy: { stepOrder: "asc" },
          },
        },
      });
      if (!chain) throw errors.internal("Approval chain missing");

      if (approvalChain) {
        await tx.approvalChainStep.deleteMany({ where: { chainId: chain.id } });
        await tx.approvalChainStep.createMany({
          data: approvalChain.map((step, index) => ({
            chainId: chain.id,
            assignedUserId: step.userId,
            approvalType: step.approvalType,
            stepOrder: index + 1,
          })),
        });
      }

      if (document.currentWorkflowRunId) {
        await tx.workflowRun.update({
          where: { id: document.currentWorkflowRunId },
          data: { status: "SUPERSEDED", endedAt: new Date() },
        });
      }

      const version = await tx.documentVersion.create({
        data: {
          documentId,
          versionNumber,
          storagePath,
          uploadedById: userId,
        },
      });

      await tx.documentVersion.update({
        where: { id: oldVersion.id },
        data: { isDeleted: true },
      });

      const workflowRun = await tx.workflowRun.create({
        data: {
          documentId,
          documentVersionId: version.id,
          chainId: chain.id,
          status: "IN_PROGRESS",
          currentStepOrder: 1,
        },
      });

      await tx.document.update({
        where: { id: documentId },
        data: {
          currentWorkflowRunId: workflowRun.id,
        },
      });

      await auditService.createAuditLog({
        actorId: userId,
        action: "DOCUMENT_VERSION_UPLOADED",
        entityType: "Document",
        entityId: documentId,
        oldValue: { versionNumber: oldVersion.versionNumber },
        newValue: { versionNumber },
        tx,
      });

      await auditService.createAuditLog({
        actorId: userId,
        action: "DOCUMENT_SUBMITTED",
        entityType: "Document",
        entityId: documentId,
        oldValue: { status: "REVISION_REQUESTED" },
        newValue: {
          status: "PENDING_REVIEW",
          versionNumber,
          workflowRunId: workflowRun.id,
        },
        tx,
      });

      const chainSteps = approvalChain
        ? approvalChain.map((step, index) => ({
            assignedUserId: step.userId,
            approvalType: step.approvalType,
            stepOrder: index + 1,
          }))
        : chain.steps;

      return {
        version,
        workflowRunId: workflowRun.id,
        documentTitle: (title ?? document.title) as string,
        firstStep: chainSteps[0] ?? null,
      };
    });

    if (result.firstStep) {
      const isReview = result.firstStep.approvalType === ApprovalType.REVIEWER;
      await notificationsService.createNotification({
        recipientId: result.firstStep.assignedUserId,
        type: "APPROVAL_NEEDED",
        title: isReview ? "Review Required" : "Approval Required",
        message: `Revised document "${result.documentTitle}" requires your ${isReview ? "review" : "approval"}.`,
        documentId,
        workflowRunId: result.workflowRunId,
      });
    }

    await storageService.deleteDocument(oldVersion.storagePath);

    return {
      message: "Document resubmitted successfully.",
      version: result.version,
      workflowRunId: result.workflowRunId,
    };
  } catch (error) {
    await storageService.deleteDocument(storagePath);
    throw error;
  }
}

  async deleteDocument(documentId: string, userId: string) {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        versions: {
          select: { storagePath: true },
        },
        approvalChain: {
          include: {
            steps: {
              select: { assignedUserId: true },
            },
          },
        },
        currentWorkflowRun: {
          select: { id: true, status: true },
        },
        workflowRuns: {
          include: {
            actions: {
              select: { signedPdfStoragePath: true },
            },
          },
        },
      },
    });

    if (!document) {
      throw errors.notFound("Document not found");
    }

    if (document.preparerId !== userId) {
      throw errors.forbidden("Only the document preparer can delete this document.");
    }

    if (document.status === "DELETED") {
      throw errors.badRequest("Document has already been deleted.");
    }

    const storagePaths = new Set<string>();
    for (const version of document.versions) {
      storagePaths.add(version.storagePath);
    }

    for (const run of document.workflowRuns) {
      for (const action of run.actions) {
        if (action.signedPdfStoragePath) {
          storagePaths.add(action.signedPdfStoragePath);
        }
      }
    }

    const recipientIds = new Set(
      document.approvalChain?.steps.map((step) => step.assignedUserId) ?? []
    );

    await prisma.$transaction(async (tx) => {
      if (
        document.currentWorkflowRunId &&
        document.currentWorkflowRun?.status === "IN_PROGRESS"
      ) {
        await tx.workflowRun.update({
          where: { id: document.currentWorkflowRunId },
          data: {
            status: "SUPERSEDED",
            endedAt: new Date(),
          },
        });
      }

      await tx.documentVersion.updateMany({
        where: { documentId },
        data: { isDeleted: true },
      });

      await tx.document.update({
        where: { id: documentId },
        data: {
          status: "DELETED",
          deletedAt: new Date(),
        },
      });

      await auditService.createAuditLog({
        actorId: userId,
        action: "DOCUMENT_DELETED",
        entityType: "Document",
        entityId: documentId,
        oldValue: { status: document.status },
        newValue: { status: "DELETED" },
        tx,
      });

      for (const recipientId of recipientIds) {
        if (recipientId === userId) {
          continue;
        }

        await notificationsService.createNotification({
          recipientId,
          type: "DOCUMENT_DELETED",
          title: "Document Deleted",
          message: `The preparer deleted "${document.title}".`,
          documentId,
          tx,
        });
      }
    });

    for (const path of storagePaths) {
      await storageService.deleteDocument(path);
    }

    return { message: "Document deleted successfully." };
  }
}

export const documentsService = new DocumentsService();