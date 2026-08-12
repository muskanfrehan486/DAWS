import { prisma } from "../prisma";
import { errors } from "../lib/errors";
import { CreateCommentInput } from "../schemas/comments.schema";


class CommentsService {
  async getComments(documentId: string) {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw errors.notFound("Document not found");
    }

    return prisma.documentComment.findMany({
      where: {
        documentId,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async createComment(
    documentId: string,
    userId: string,
    input: CreateCommentInput
  ) {
    const document = await prisma.document.findUnique({
      where: {
        id: documentId,
      },
      include: {
        currentWorkflowRun: true,
        approvalChain: {
          include: {
            steps: true,
          },
        },
      },
    });

    if (!document) {
      throw errors.notFound("Document not found");
    }

    if (document.status === "DELETED") {
      throw errors.badRequest("Cannot comment on a deleted document.");
    }

    return prisma.documentComment.create({
      data: {
        documentId,
        authorId: userId,
        comment: input.comment,
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }
}

export const commentsService = new CommentsService();