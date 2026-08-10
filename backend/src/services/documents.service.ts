import { randomUUID } from "crypto";
import { prisma } from "../prisma";
import { errors } from "../lib/errors";
import { storageService } from "../lib/supabase.storage";
import { ApprovalType } from "../generated/prisma/client";
import { notificationsService } from "./notifications.service";
import {
  CreateDocumentInput,
  UpdateDocumentInput,
} from "../schemas/documents.schema";

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
      where: {
        OR: [
          {
            preparerId: userId,
          },
          {
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
        ],
      },

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
      },

      orderBy: {
        updatedAt: "desc",
      },
    });

    const filteredDocuments = documents.filter((document) => {
      if (document.preparerId === userId) {
        return true;
      }

      const currentRun = document.currentWorkflowRun;
      if (!currentRun || currentRun.status !== "IN_PROGRESS") {
        return false;
      }

      const currentStep = currentRun.chain.steps.find(
        (step) => step.stepOrder === currentRun.currentStepOrder
      );

      return currentStep?.assignedUserId === userId;
    });

    const documentsResult = filteredDocuments.map(({ currentWorkflowRun, ...rest }) => {
      const currentStep = currentWorkflowRun
        ? currentWorkflowRun.chain.steps.find(
            (step) => step.stepOrder === currentWorkflowRun.currentStepOrder
          )
        : null;

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
        workflow: currentWorkflowRun
          ? {
              currentStepOrder: currentWorkflowRun.currentStepOrder,
              totalSteps: currentWorkflowRun.chain.steps.length,
            }
          : null,
      };
    });

    return {
      documents: documentsResult,
    };
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
      },
    });

    if (!document) {
      throw errors.notFound("Document not found");
    }

    const currentRun = document.currentWorkflowRun;
    const isPreparer = document.preparerId === userId;

    if (!isPreparer) {
      if (!currentRun || currentRun.status !== "IN_PROGRESS") {
        throw errors.forbidden("Access denied");
      }

      const currentStep = currentRun.chain.steps.find(
        (step) => step.stepOrder === currentRun.currentStepOrder
      );

      if (currentStep?.assignedUserId !== userId) {
        throw errors.forbidden("Access denied");
      }
    }

    const currentStep = currentRun
      ? currentRun.chain.steps.find(
          (step) => step.stepOrder === currentRun.currentStepOrder
        )
      : null;

    return {
      ...document,
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
    const version =
      document.currentWorkflowRun?.documentVersion ?? document.versions[0];

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
    select: { id: true, preparerId: true, currentVersionNumber: true, currentWorkflowRunId: true },
  });

  if (!document) throw errors.notFound("Document not found");
  if (document.preparerId !== userId) throw errors.forbidden("Only the document preparer can update the document.");

  const currentVersion = await prisma.documentVersion.findFirst({
    where: { documentId, versionNumber: document.currentVersionNumber },
  });

  if (!currentVersion) {
    throw errors.internal("Current document version not found.");
  }

  const oldVersion = file ? currentVersion : null;
  const versionNumber = file ? currentVersion.versionNumber + 1 : currentVersion.versionNumber;
  const storagePath = file ? `documents/${documentId}/v${versionNumber}.pdf` : undefined;

  if (file) {
    await storageService.uploadDocument(storagePath!, file);
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const updateData: any = {
        status: "PENDING_REVIEW",
      };

      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description || null;
      if (file) updateData.currentVersionNumber = versionNumber;

      await tx.document.update({ where: { id: documentId }, data: updateData });

      const chain = await tx.approvalChain.findUnique({ where: { documentId } });
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
          data: { status: "SUPERSEDED" },
        });
      }

      const version = file
        ? await tx.documentVersion.create({
            data: {
              documentId,
              versionNumber,
              storagePath: storagePath!,
              uploadedById: userId,
            },
          })
        : currentVersion;

      if (file && oldVersion) {
        await tx.documentVersion.update({
          where: { id: oldVersion.id },
          data: { isDeleted: true },
        });
      }

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

      return {
        version,
        workflowRunId: workflowRun.id,
      };
    });

    if (oldVersion && file) {
      await storageService.deleteDocument(oldVersion.storagePath);
    }

    return {
      message: "Document updated successfully.",
      version: result.version,
      workflowRunId: result.workflowRunId,
    };
  } catch (error) {
    if (file) {
      await storageService.deleteDocument(storagePath!);
    }
    throw error;
  }
}
}

export const documentsService = new DocumentsService();