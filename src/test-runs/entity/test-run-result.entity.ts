import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TestRun } from './test-run.entity';

@Entity({ name: 'test_run_results' })
export class TestRunResult {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'test_run_id', type: 'integer', unique: true })
  testRunId!: number;

  @ManyToOne(() => TestRun, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'test_run_id' })
  testRun!: TestRun;

  @Column({ name: 'total_requests', type: 'integer' })
  totalRequests!: number;

  @Column({ name: 'success_count', type: 'integer' })
  successCount!: number;

  @Column({ name: 'failure_count', type: 'integer' })
  failureCount!: number;

  @Column({ name: 'average_latency_ms', type: 'real' })
  averageLatencyMs!: number;

  @Column({ name: 'p95_latency_ms', type: 'real' })
  p95LatencyMs!: number;

  @Column({ name: 'max_latency_ms', type: 'real' })
  maxLatencyMs!: number;

  @Column({ name: 'failure_summary_json', type: 'text' })
  failureSummaryJson!: string;
}
