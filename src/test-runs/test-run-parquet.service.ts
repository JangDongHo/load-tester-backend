import { Injectable } from '@nestjs/common';
import duckdb from '@duckdb/node-api';
import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { TestRun } from './entity/test-run.entity';
import {
  FailureSummaryItem,
  TestRunRequestLog,
  TestRunResultInput,
} from './type/test-runs.types';

interface AggregationRow {
  total_requests: bigint;
  success_count: bigint;
  failure_count: bigint;
  average_latency_ms: number;
  p95_latency_ms: number;
  max_latency_ms: number;
}

interface FailureSummaryRow {
  reason: string;
  count: bigint;
}

@Injectable()
export class TestRunParquetService {
  async writeRequestLogsAndAggregate(
    testRun: TestRun,
    requestLogs: TestRunRequestLog[],
  ): Promise<TestRunResultInput> {
    const parquetPath = this.getParquetPath(testRun.id);
    await mkdir(dirname(parquetPath), { recursive: true });

    const instance = await duckdb.DuckDBInstance.create(':memory:');
    const connection = await instance.connect();

    try {
      await connection.run(`
        CREATE TABLE request_logs (
          test_run_id INTEGER,
          request_index INTEGER,
          virtual_user_id INTEGER,
          started_at VARCHAR,
          finished_at VARCHAR,
          latency_ms DOUBLE,
          status_code INTEGER,
          success BOOLEAN,
          error_message VARCHAR
        )
      `);

      const insertStatement = await connection.prepare(`
        INSERT INTO request_logs
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      try {
        for (const requestLog of requestLogs) {
          insertStatement.bind([
            requestLog.testRunId,
            requestLog.requestIndex,
            requestLog.virtualUserId,
            requestLog.startedAt,
            requestLog.finishedAt,
            requestLog.latencyMs,
            requestLog.statusCode,
            requestLog.success,
            requestLog.errorMessage,
          ]);
          await insertStatement.run();
          insertStatement.clearBindings();
        }
      } finally {
        insertStatement.destroySync();
      }

      await connection.run(`
        COPY request_logs
        TO ${this.toSqlString(parquetPath)}
        (FORMAT parquet)
      `);

      const aggregationResult = await connection.run(`
        SELECT
          count(*) AS total_requests,
          count(*) FILTER (WHERE success) AS success_count,
          count(*) FILTER (WHERE NOT success) AS failure_count,
          avg(latency_ms) AS average_latency_ms,
          quantile_cont(latency_ms, 0.95) AS p95_latency_ms,
          max(latency_ms) AS max_latency_ms
        FROM read_parquet(${this.toSqlString(parquetPath)})
      `);
      const [aggregationRow] =
        (await aggregationResult.getRowObjectsJS()) as unknown as AggregationRow[];

      const failureSummaryResult = await connection.run(`
        SELECT
          coalesce(error_message, 'UNKNOWN') AS reason,
          count(*) AS count
        FROM read_parquet(${this.toSqlString(parquetPath)})
        WHERE NOT success
        GROUP BY reason
        ORDER BY count DESC, reason ASC
      `);
      const failureSummaryRows =
        (await failureSummaryResult.getRowObjectsJS()) as unknown as FailureSummaryRow[];

      return {
        testRunId: testRun.id,
        totalRequests: Number(aggregationRow.total_requests),
        successCount: Number(aggregationRow.success_count),
        failureCount: Number(aggregationRow.failure_count),
        averageLatencyMs: aggregationRow.average_latency_ms,
        p95LatencyMs: aggregationRow.p95_latency_ms,
        maxLatencyMs: aggregationRow.max_latency_ms,
        failureSummary: failureSummaryRows.map(
          (row): FailureSummaryItem => ({
            reason: row.reason,
            count: Number(row.count),
          }),
        ),
      };
    } finally {
      connection.closeSync();
    }
  }

  getParquetPath(testRunId: number): string {
    const parquetRoot =
      process.env.TEST_RUN_PARQUET_DIR ?? join(process.cwd(), 'data/test-runs');
    return join(parquetRoot, String(testRunId), 'requests.parquet');
  }

  private toSqlString(value: string): string {
    return `'${value.replaceAll("'", "''")}'`;
  }
}
