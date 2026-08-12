import { Prisma, WorkflowRunStatus } from "../generated/prisma/client";

type ChainWithSteps =
  | {
      steps: { assignedUserId: string; stepOrder: number }[];
    }
  | null
  | undefined;

type WorkflowRunWithChain =
  | {
      status: WorkflowRunStatus;
      currentStepOrder: number;
      chain: ChainWithSteps;
    }
  | null
  | undefined;

type WorkflowRunProgress = {
  currentStepOrder: number;
  actions?: { id: string }[];
};

export function prismaDocumentAccessFilter(
  userId: string
): Prisma.DocumentWhereInput {
  return {
    OR: [
      { preparerId: userId },
      {
        approvalChain: {
          steps: {
            some: { assignedUserId: userId },
          },
        },
      },
    ],
  };
}

export function isUserInApprovalChain(
  chain: ChainWithSteps,
  userId: string
): boolean {
  return chain?.steps.some((step) => step.assignedUserId === userId) ?? false;
}

export function hasWorkflowReachedUser(params: {
  userId: string;
  approvalChain?: ChainWithSteps;
  currentWorkflowRun?: WorkflowRunWithChain | null;
  workflowRunHistory?: WorkflowRunProgress[];
  hasUserActed?: boolean;
}): boolean {
  const {
    userId,
    approvalChain,
    currentWorkflowRun,
    workflowRunHistory,
    hasUserActed,
  } = params;

  if (hasUserActed) {
    return true;
  }

  const chain = approvalChain ?? currentWorkflowRun?.chain;
  const userStep = chain?.steps.find((step) => step.assignedUserId === userId);
  if (!userStep) {
    return false;
  }

  const runs =
    workflowRunHistory ??
    (currentWorkflowRun ? [{ currentStepOrder: currentWorkflowRun.currentStepOrder }] : []);

  if (runs.length === 0) {
    return false;
  }

  const maxReachedStep = runs.reduce(
    (max, run) => Math.max(max, run.currentStepOrder),
    0
  );

  return userStep.stepOrder <= maxReachedStep;
}

export function canUserViewDocument(params: {
  preparerId: string;
  userId: string;
  approvalChain?: ChainWithSteps;
  currentWorkflowRun?: WorkflowRunWithChain | null;
  workflowRunHistory?: WorkflowRunProgress[];
  hasUserActed?: boolean;
}): boolean {
  if (params.preparerId === params.userId) {
    return true;
  }

  const chain = params.approvalChain ?? params.currentWorkflowRun?.chain;
  if (!isUserInApprovalChain(chain, params.userId)) {
    return false;
  }

  return hasWorkflowReachedUser({
    userId: params.userId,
    approvalChain: params.approvalChain,
    currentWorkflowRun: params.currentWorkflowRun,
    workflowRunHistory: params.workflowRunHistory,
    hasUserActed: params.hasUserActed,
  });
}

export function documentHasUserActed(
  workflowRuns: WorkflowRunProgress[] | undefined
): boolean {
  return (
    workflowRuns?.some((run) => (run.actions?.length ?? 0) > 0) ?? false
  );
}
