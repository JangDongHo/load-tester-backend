import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { TestRunStatus } from '../enum/test-run-status.enum';

@Entity({ name: 'test_runs' })
export class TestRun {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'scenario_name', type: 'text' })
  scenarioName!: string;

  @Column({ name: 'target_url', type: 'text' })
  targetUrl!: string;

  @Column({ name: 'virtual_users', type: 'integer' })
  virtualUsers!: number;

  @Column({ name: 'duration_sec', type: 'integer' })
  durationSec!: number;

  @Column({ name: 'ramp_up_sec', type: 'integer' })
  rampUpSec!: number;

  @Column({ type: 'text' })
  status!: TestRunStatus;

  @Column({ name: 'requested_at', type: 'text' })
  requestedAt!: string;

  @Column({ name: 'started_at', type: 'text', nullable: true })
  startedAt!: string | null;

  @Column({ name: 'finished_at', type: 'text', nullable: true })
  finishedAt!: string | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage!: string | null;

  start(startedAt: string): void {
    if (this.status !== TestRunStatus.PENDING) {
      throw new Error('대기 중인 테스트 실행만 시작할 수 있습니다.');
    }

    this.status = TestRunStatus.RUNNING;
    this.startedAt = startedAt;
  }

  complete(finishedAt: string): void {
    if (this.status !== TestRunStatus.RUNNING) {
      throw new Error('실행 중인 테스트 실행만 완료할 수 있습니다.');
    }

    this.status = TestRunStatus.SUCCESS;
    this.finishedAt = finishedAt;
  }
}
