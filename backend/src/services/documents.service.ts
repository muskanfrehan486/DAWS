import { randomUUID } from "crypto";
import { prisma } from "../prisma";
import { errors } from "../lib/errors";
import { storageService } from "../lib/supabase.storage";
import { CreateDocumentInput } from "../schemas/documents.schema";

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
        // Create Document
        const createdDocument = await tx.document.create({
          data: {
            id: documentId,
            title,  
            description: description || null,
            preparerId: userId,
            currentVersionNumber: versionNumber,
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

        return {
          ...createdDocument,
          version,
          approvalChainId: chain.id,
        };
      });

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
      await tx.document.update({
        where: {
          id: documentId,
        },
        data: {
          currentVersionNumber: versionNumber,
        },
      });

      return tx.documentVersion.create({
        data: {
          documentId,
          versionNumber,
          storagePath,
          uploadedById: userId,
        },
      });
    });

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
          approvalChain: {
            steps: {
              some: {
                assignedUserId: userId,
              },
            },
          },
        },
        {
          workflowRuns: {
            some: {
              actions: {
                some: {
                  actorId: userId,
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

      versions: {
        where: {
          isDeleted: false,
        },
        orderBy: {
          versionNumber: "desc",
        },
        take: 1,
      },

      approvalChain: {
        include: {
          steps: {
            orderBy: {
              stepOrder: "asc",
            },
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

    orderBy: {
      updatedAt: "desc",
    },
  });

  return {
    documents,
  };
}
}

export const documentsService = new DocumentsService();