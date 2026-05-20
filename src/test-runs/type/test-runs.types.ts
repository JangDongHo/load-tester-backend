export const TEST_RUN_STATUSES = [
  'PENDING',
  'RUNNING',
  'SUCCESS',
  'FAILED',
] as const;

export type TestRunStatus = (typeof TEST_RUN_STATUSES)[number];

export interface FailureSummaryItem {
  reason: string;
  count: number;
}
