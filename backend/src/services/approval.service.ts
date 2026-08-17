import { PDFDocument } from "pdf-lib";
import { prisma } from "../prisma";
import { errors } from "../lib/errors";
import { storageService } from "../lib/supabase.storage";
import { auditService } from "./audit.service";
import { notificationsService } from "./notifications.service";
import {
  ApproveDocumentInput,
  RejectDocumentInput,
  RequestRevisionInput,
  SkipWorkflowStepInput,
} from "../schemas/approval.schema";
import {
  ApprovalChainStep,
  ApprovalType,
  Document,
  DocumentVersion,
  NotificationType,
  Prisma,
  WorkflowRun,
} from "../generated/prisma/client";

type ValidatedStepContext = {
  document: Document & { preparerId: string; title: string };
  run: WorkflowRun;
  currentStep: ApprovalChainStep;
  version: DocumentVersion;
  steps: ApprovalChainStep[];
};

class ApprovalService {
  private async createDocumentThreadComment(
    tx: Prisma.TransactionClient,
    documentId: string,
    authorId: string,
    comment: string,
  ) {
    await tx.documentComment.create({
      data: {
        documentId,
        authorId,
        comment: comment.trim(),
      },
    });
  }

  private decodeSignatureImage(signatureImage: string): Buffer {
    const base64 = signatureImage.replace(/^data:image\/\w+;base64,/, "");
    return Buffer.from(base64, "base64");
  }

  private async loadAndValidateCurrentStep(
    documentId: string,
    actorId: string
  ): Promise<ValidatedStepContext> {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        currentWorkflowRun: {
          include: {
            documentVersion: true,
            chain: {
              include: {
                steps: {
                  orderBy: { stepOrder: "asc" },
                },
              },
            },
          },
        },
      },
    });

    if (!document) {
      throw errors.notFound("Document not found.");
    }

    if (actorId === document.preparerId) {
      throw errors.forbidden(
        "The document preparer cannot approve, reject, or request revision."
      );
    }
    
    if (document.status !== "PENDING_REVIEW") {
      throw errors.badRequest(
        "Document is not pending review and cannot be acted on."
      );
    }

    const run = document.currentWorkflowRun;

    if (!run || run.status !== "IN_PROGRESS") {
      throw errors.badRequest("No active workflow run for this document.");
    }

    const steps = run.chain.steps;
    const currentStep = steps.find(
      (step) => step.stepOrder === run.currentStepOrder
    );

    if (!currentStep) {
      throw errors.internal("Current workflow step not found.");
    }

    if (currentStep.assignedUserId !== actorId) {
      throw errors.forbidden(
        "Only the assigned user for the current step can perform this action."
      );
    }

    const existingAction = await prisma.approvalAction.findFirst({
      where: {
        workflowRunId: run.id,
        chainStepId: currentStep.id,
      },
    });

    if (existingAction) {
      throw errors.badRequest("This workflow step has already been acted on.");
    }

    return {
      document: {
        id: document.id,
        preparerId: document.preparerId,
        title: document.title,
      } as ValidatedStepContext["document"],
      run,
      currentStep,
      version: run.documentVersion,
      steps,
    };
  }

  /** Lighter validation for revision — skips loading the full approval chain. */
  private async loadAndValidateCurrentStepLite(
    documentId: string,
    actorId: string,
  ): Promise<ValidatedStepContext> {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      select: {
        id: true,
        preparerId: true,
        title: true,
        status: true,
        currentWorkflowRun: {
          select: {
            id: true,
            documentId: true,
            documentVersionId: true,
            status: true,
            currentStepOrder: true,
            chainId: true,
            startedAt: true,
            endedAt: true,
            documentVersion: true,
          },
        },
      },
    });

    if (!document) {
      throw errors.notFound("Document not found.");
    }

    if (actorId === document.preparerId) {
      throw errors.forbidden(
        "The document preparer cannot approve, reject, or request revision.",
      );
    }

    if (document.status !== "PENDING_REVIEW") {
      throw errors.badRequest(
        "Document is not pending review and cannot be acted on.",
      );
    }

    const run = document.currentWorkflowRun;

    if (!run || run.status !== "IN_PROGRESS") {
      throw errors.badRequest("No active workflow run for this document.");
    }

    const [currentStep, existingAction] = await Promise.all([
      prisma.approvalChainStep.findUnique({
        where: {
          chainId_stepOrder: {
            chainId: run.chainId,
            stepOrder: run.currentStepOrder,
          },
        },
      }),
      prisma.approvalAction.findFirst({
        where: {
          workflowRunId: run.id,
          chainStep: {
            chainId: run.chainId,
            stepOrder: run.currentStepOrder,
          },
        },
      }),
    ]);

    if (!currentStep) {
      throw errors.internal("Current workflow step not found.");
    }

    if (currentStep.assignedUserId !== actorId) {
      throw errors.forbidden(
        "Only the assigned user for the current step can perform this action.",
      );
    }

    if (existingAction) {
      throw errors.badRequest("This workflow step has already been acted on.");
    }

    const { documentVersion, ...runData } = run;

    return {
      document: {
        id: document.id,
        preparerId: document.preparerId,
        title: document.title,
      } as ValidatedStepContext["document"],
      run: runData as WorkflowRun,
      currentStep,
      version: documentVersion,
      steps: [currentStep],
    };
  }

  private dispatchNotifications(
    jobs: {
      recipientId: string;
      type: NotificationType;
      title: string;
      message: string;
      documentId: string;
      workflowRunId: string;
    }[],
  ) {
    void this.notifyMany(jobs).catch((error) => {
      console.error("Failed to dispatch notifications:", error);
    });
  }

  private async embedSignatureInPdf(
    pdfBuffer: Buffer,
    signatureBuffer: Buffer,
    input: ApproveDocumentInput
  ): Promise<Buffer> {
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pages = pdfDoc.getPages();

    if (input.signaturePage < 1 || input.signaturePage > pages.length) {
      throw errors.badRequest("Invalid signature page number.");
    }

    const page = pages[input.signaturePage - 1];
    const { height: pageHeight } = page.getSize();

    let image;
    try {
      image = await pdfDoc.embedPng(signatureBuffer);
    } catch {
      image = await pdfDoc.embedJpg(signatureBuffer);
    }

    // Frontend coordinates are top-left origin; pdf-lib uses bottom-left origin.
    const pdfY = pageHeight - input.signatureY - input.signatureHeight;

    page.drawImage(image, {
      x: input.signatureX,
      y: pdfY,
      width: input.signatureWidth,
      height: input.signatureHeight,
    });

    const signedPdfBytes = await pdfDoc.save();
    return Buffer.from(signedPdfBytes);
  }

  private buildUplineRecipientIds(
    preparerId: string,
    steps: ApprovalChainStep[],
    currentStepOrder: number,
  ) {
    const recipientIds = new Set<string>([preparerId]);

    for (const step of steps) {
      if (step.stepOrder <= currentStepOrder) {
        recipientIds.add(step.assignedUserId);
      }
    }

    return recipientIds;
  }

  private async notifyMany(
    jobs: {
      recipientId: string;
      type: NotificationType;
      title: string;
      message: string;
      documentId: string;
      workflowRunId: string;
    }[],
  ) {
    for (const job of jobs) {
      await notificationsService.createNotification(job);
    }
  }

  private buildActionResponse(
    message: string,
    documentStatus: string,
    workflowStatus: string,
    currentStepOrder: number,
    action: { id: string; action: string; createdAt: Date }
  ) {
    return {
      message,
      documentStatus,
      workflowStatus,
      currentStepOrder,
      action,
    };
  }

  async approve(
    documentId: string,
    actorId: string,
    input: ApproveDocumentInput,
    ipAddress?: string
  ) {
    const { document, run, currentStep, steps } =
      await this.loadAndValidateCurrentStep(documentId, actorId);

    const version = await prisma.documentVersion.findUnique({
      where: { id: run.documentVersionId },
    });

    if (!version) {
      throw errors.internal("Workflow document version not found.");
    }

    const storagePath = version.storagePath;
    const pdfBuffer = await storageService.downloadDocument(storagePath);
    const signatureBuffer = this.decodeSignatureImage(input.signatureImage);
    const signedPdfBuffer = await this.embedSignatureInPdf(
      pdfBuffer,
      signatureBuffer,
      input
    );
    await storageService.overwriteDocument(storagePath, signedPdfBuffer);

    const isFinalStep =
      currentStep.approvalType === ApprovalType.FINAL_APPROVER;
    const nextStep = steps.find(
      (step) => step.stepOrder === run.currentStepOrder + 1
    );

    const actor = await prisma.user.findUnique({
      where: { id: actorId },
      select: { firstName: true, lastName: true },
    });
    const actorName = actor
      ? `${actor.firstName} ${actor.lastName}`.trim()
      : undefined;

    const uplineRecipientIds = this.buildUplineRecipientIds(
      document.preparerId,
      steps,
      run.currentStepOrder,
    );
    uplineRecipientIds.delete(actorId);

    const notificationJobs: {
      recipientId: string;
      type: NotificationType;
      title: string;
      message: string;
      documentId: string;
      workflowRunId: string;
    }[] = [];

    const progressMessage = isFinalStep
      ? `Document "${document.title}" has been fully approved.`
      : `"${document.title}" was approved by ${actorName ?? "an approver"}. The document is advancing to the next step.`;

    for (const recipientId of uplineRecipientIds) {
      notificationJobs.push({
        recipientId,
        type: "APPROVED",
        title: isFinalStep ? "Document Approved" : "Approval Progress",
        message: progressMessage,
        documentId,
        workflowRunId: run.id,
      });
    }

    if (!isFinalStep && nextStep) {
      notificationJobs.push({
        recipientId: nextStep.assignedUserId,
        type: "APPROVAL_NEEDED",
        title: "Approval Needed",
        message: `Document "${document.title}" requires your review and approval.`,
        documentId,
        workflowRunId: run.id,
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const action = await tx.approvalAction.create({
        data: {
          workflowRunId: run.id,
          chainStepId: currentStep.id,
          documentVersionId: version.id,
          actorId,
          approvalType: currentStep.approvalType,
          action: "APPROVE",
          signaturePage: input.signaturePage,
          signatureX: input.signatureX,
          signatureY: input.signatureY,
          signatureWidth: input.signatureWidth,
          signatureHeight: input.signatureHeight,
          signedPdfStoragePath: storagePath,
          ipAddress: ipAddress ?? null,
        },
      });

      if (isFinalStep) {
        await tx.workflowRun.update({
          where: { id: run.id },
          data: {
            status: "APPROVED",
            endedAt: new Date(),
          },
        });

        await tx.document.update({
          where: { id: documentId },
          data: {
            status: "APPROVED",
            approvedAt: new Date(),
          },
        });

        await auditService.createAuditLog({
          actorId,
          action: "WORKFLOW_COMPLETED",
          entityType: "Document",
          entityId: documentId,
          oldValue: { status: "PENDING_REVIEW" },
          newValue: { status: "APPROVED" },
          ipAddress,
          tx,
        });
      } else {
        await tx.workflowRun.update({
          where: { id: run.id },
          data: {
            currentStepOrder: run.currentStepOrder + 1,
          },
        });

        await auditService.createAuditLog({
          actorId,
          action: "WORKFLOW_APPROVED",
          entityType: "Document",
          entityId: documentId,
          newValue: {
            stepOrder: run.currentStepOrder,
            nextStepOrder: run.currentStepOrder + 1,
          },
          ipAddress,
          tx,
        });
      }

      return action;
    });

    await this.dispatchNotifications(notificationJobs);

    return this.buildActionResponse(
      isFinalStep
        ? "Document approved and workflow completed."
        : "Document approved. Workflow advanced to the next step.",
      isFinalStep ? "APPROVED" : "PENDING_REVIEW",
      isFinalStep ? "APPROVED" : "IN_PROGRESS",
      isFinalStep ? run.currentStepOrder : run.currentStepOrder + 1,
      {
        id: result.id,
        action: result.action,
        createdAt: result.createdAt,
      }
    );
  }

  async reject(
    documentId: string,
    actorId: string,
    input: RejectDocumentInput,
    ipAddress?: string
  ) {
    const { document, run, currentStep, version, steps } =
      await this.loadAndValidateCurrentStep(documentId, actorId);

    const uplineRecipientIds = this.buildUplineRecipientIds(
      document.preparerId,
      steps,
      run.currentStepOrder,
    );

    const notificationJobs: {
      recipientId: string;
      type: NotificationType;
      title: string;
      message: string;
      documentId: string;
      workflowRunId: string;
    }[] = [];

    const result = await prisma.$transaction(async (tx) => {
      const action = await tx.approvalAction.create({
        data: {
          workflowRunId: run.id,
          chainStepId: currentStep.id,
          documentVersionId: version.id,
          actorId,
          approvalType: currentStep.approvalType,
          action: "REJECT",
          comment: input.comment ?? null,
          ipAddress: ipAddress ?? null,
        },
      });

      await tx.workflowRun.update({
        where: { id: run.id },
        data: {
          status: "REJECTED",
          endedAt: new Date(),
        },
      });

      await tx.document.update({
        where: { id: documentId },
        data: {
          status: "REJECTED",
          rejectedAt: new Date(),
        },
      });

      if (input.comment?.trim()) {
        await this.createDocumentThreadComment(
          tx,
          documentId,
          actorId,
          `Document rejected: ${input.comment.trim()}`,
        );
      }

      for (const recipientId of uplineRecipientIds) {
        notificationJobs.push({
          recipientId,
          type: "REJECTED",
          title: "Document Rejected",
          message: `Document "${document.title}" has been rejected.`,
          documentId,
          workflowRunId: run.id,
        });
      }

      await auditService.createAuditLog({
        actorId,
        action: "WORKFLOW_REJECTED",
        entityType: "Document",
        entityId: documentId,
        oldValue: { status: "PENDING_REVIEW" },
        newValue: { status: "REJECTED" },
        ipAddress,
        tx,
      });

      return action;
    });

    await this.dispatchNotifications(notificationJobs);

    return this.buildActionResponse(
      "Document rejected. Workflow has ended.",
      "REJECTED",
      "REJECTED",
      run.currentStepOrder,
      {
        id: result.id,
        action: result.action,
        createdAt: result.createdAt,
      }
    );
  }

  async requestRevision(
    documentId: string,
    actorId: string,
    input: RequestRevisionInput,
    ipAddress?: string
  ) {
    const { document, run, currentStep, version } =
      await this.loadAndValidateCurrentStepLite(documentId, actorId);

    const result = await prisma.$transaction(async (tx) => {
      const action = await tx.approvalAction.create({
        data: {
          workflowRunId: run.id,
          chainStepId: currentStep.id,
          documentVersionId: version.id,
          actorId,
          approvalType: currentStep.approvalType,
          action: "REQUEST_REVISION",
          comment: input.comment,
          ipAddress: ipAddress ?? null,
        },
      });

      await tx.document.update({
        where: { id: documentId },
        data: {
          status: "REVISION_REQUESTED",
          revisionRequestedByActionId: action.id,
        },
      });

      await tx.workflowRun.update({
        where: { id: run.id },
        data: {
          status: "SUPERSEDED",
          endedAt: new Date(),
        },
      });

      await this.createDocumentThreadComment(
        tx,
        documentId,
        actorId,
        `Revision requested: ${input.comment.trim()}`,
      );

      await notificationsService.createNotification({
        recipientId: document.preparerId,
        type: "REVISION_REQUESTED",
        title: "Revision Requested",
        message: `Revision requested for "${document.title}": ${input.comment}`,
        documentId,
        workflowRunId: run.id,
        tx,
      });

      await auditService.createAuditLog({
        actorId,
        action: "WORKFLOW_REVISION_REQUESTED",
        entityType: "Document",
        entityId: documentId,
        oldValue: { status: "PENDING_REVIEW" },
        newValue: { status: "REVISION_REQUESTED", comment: input.comment },
        ipAddress,
        tx,
      });

      return action;
    });

    return this.buildActionResponse(
      "Revision requested. The preparer has been notified.",
      "REVISION_REQUESTED",
      "IN_PROGRESS",
      run.currentStepOrder,
      {
        id: result.id,
        action: result.action,
        createdAt: result.createdAt,
      }
    );
  }

  async skipWorkflowStep(
    documentId: string,
    preparerId: string,
    input: SkipWorkflowStepInput,
    ipAddress?: string,
  ) {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      select: {
        id: true,
        title: true,
        preparerId: true,
        status: true,
        currentWorkflowRun: {
          select: {
            id: true,
            status: true,
            currentStepOrder: true,
            documentVersionId: true,
            chain: {
              select: {
                steps: {
                  orderBy: { stepOrder: "asc" },
                },
              },
            },
          },
        },
      },
    });

    if (!document) {
      throw errors.notFound("Document not found.");
    }

    if (document.preparerId !== preparerId) {
      throw errors.forbidden("Only the document preparer can skip a workflow step.");
    }

    if (document.status !== "PENDING_REVIEW") {
      throw errors.badRequest(
        "Workflow steps can only be skipped while the document is pending review.",
      );
    }

    const run = document.currentWorkflowRun;

    if (!run || run.status !== "IN_PROGRESS") {
      throw errors.badRequest("No active workflow run for this document.");
    }

    const steps = run.chain.steps;
    const currentStep = steps.find(
      (step) => step.stepOrder === run.currentStepOrder,
    );

    if (!currentStep) {
      throw errors.internal("Current workflow step not found.");
    }

    const nextStep = steps.find(
      (step) => step.stepOrder === run.currentStepOrder + 1,
    );

    if (!nextStep) {
      throw errors.badRequest("Cannot skip the final approval step.");
    }

    const existingAction = await prisma.approvalAction.findFirst({
      where: {
        workflowRunId: run.id,
        chainStepId: currentStep.id,
      },
    });

    if (existingAction) {
      throw errors.badRequest("The current workflow step has already been acted on.");
    }

    const skippedUser = await prisma.user.findUnique({
      where: { id: currentStep.assignedUserId },
      select: { firstName: true, lastName: true },
    });
    const skippedUserName = skippedUser
      ? `${skippedUser.firstName} ${skippedUser.lastName}`.trim()
      : "the assigned reviewer";

    const threadComment = `Preparer skipped ${skippedUserName} (Step ${currentStep.stepOrder}): ${input.reason.trim()}`;

    const result = await prisma.$transaction(
      async (tx) => {
        const action = await tx.approvalAction.create({
          data: {
            workflowRunId: run.id,
            chainStepId: currentStep.id,
            documentVersionId: run.documentVersionId,
            actorId: preparerId,
            approvalType: currentStep.approvalType,
            action: "SKIP",
            comment: input.reason.trim(),
            ipAddress: ipAddress ?? null,
          },
        });

        await tx.workflowRun.update({
          where: { id: run.id },
          data: { currentStepOrder: run.currentStepOrder + 1 },
        });

        return action;
      },
      { timeout: 15_000 },
    );

    await Promise.all([
      this.createDocumentThreadComment(
        prisma,
        documentId,
        preparerId,
        threadComment,
      ),
      auditService.createAuditLog({
        actorId: preparerId,
        action: "WORKFLOW_STEP_SKIPPED",
        entityType: "Document",
        entityId: documentId,
        oldValue: {
          stepOrder: currentStep.stepOrder,
          assignedUserId: currentStep.assignedUserId,
        },
        newValue: {
          stepOrder: nextStep.stepOrder,
          assignedUserId: nextStep.assignedUserId,
          reason: input.reason.trim(),
        },
        ipAddress,
      }),
    ]);

    this.dispatchNotifications([
      {
        recipientId: currentStep.assignedUserId,
        type: "APPROVAL_NEEDED",
        title: "Workflow Step Skipped",
        message: `You were skipped on "${document.title}". Reason: ${input.reason.trim()}`,
        documentId,
        workflowRunId: run.id,
      },
      {
        recipientId: nextStep.assignedUserId,
        type: "APPROVAL_NEEDED",
        title: "Approval Needed",
        message: `Document "${document.title}" requires your review and approval.`,
        documentId,
        workflowRunId: run.id,
      },
    ]);

    return this.buildActionResponse(
      `Skipped ${skippedUserName}. Workflow advanced to the next step.`,
      "PENDING_REVIEW",
      "IN_PROGRESS",
      run.currentStepOrder + 1,
      {
        id: result.id,
        action: result.action,
        createdAt: result.createdAt,
      },
    );
  }
}

export const approvalService = new ApprovalService();
