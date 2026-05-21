export interface FailureSummaryItem {
  reason: string;
  count: number;
}

export interface TestRunRequestLog {
  testRunId: number;
  requestIndex: number;
  virtualUserId: number;
  startedAt: string;
  finishedAt: string;
  latencyMs: number;
  statusCode: number;
  success: boolean;
  errorMessage: string | null;
}

export interface TestRunResultInput {
  testRunId: number;
  totalRequests: number;
  successCount: number;
  failureCount: number;
  averageLatencyMs: number;
  p95LatencyMs: number;
  maxLatencyMs: number;
  failureSummary: FailureSummaryItem[];
}
