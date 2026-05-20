## 🔷 1. 과제 개요

본 과제는 사용자가 부하 테스트 실행을 요청하면 서버가 이를 비동기적으로 처리하고, 실행 상태 및 결과를 조회할 수 있는 백엔드 시스템을 구현하는 것이다.

핵심 목표는 실행 요청 접수, 비동기 처리, 상태 관리, 결과 조회를 안정적으로 설계하는 데 있다.

---

## 🔷 2. 구현 범위

**필수**

- 부하 테스트 실행 요청 API
- 실행 목록 조회 API
- 실행 상세 조회 API
- 실행 결과 조회 API
- 비동기 작업 처리 구조
- 실행 상태 관리

**선택**

- 실패 시 재시도 1회
- 실행 취소 API
- 실행 로그 조회 API
- 테스트 시나리오 저장/선택 기능

---

## 🔷 3. 기능 요구사항

### 1. 실행 요청

- 사용자는 부하 테스트 실행을 요청할 수 있어야 한다.
- 요청이 들어오면 서버는 즉시 작업을 저장하고, 응답으로 실행 ID를 반환한다.
- 실제 테스트 수행은 별도의 비동기 워커가 처리한다.

### 2. 상태 관리

- 실행은 다음 상태를 가진다.
  - `PENDING`
  - `RUNNING`
  - `SUCCESS`
  - `FAILED`
- 상태는 작업 진행에 따라 순차적으로 변경되어야 하며, 실패 시 원인 메시지를 저장할 수 있어야 한다.

### 3. 결과 조회

- 사용자는 실행 완료 후 결과를 조회할 수 있어야 한다.
- 결과에는 최소한 총 요청 수, 성공/실패 수, 평균 응답 시간, p95 응답 시간, 최대 응답 시간이 포함되어야 한다.

---

## 🔷 4. API 명세

### 1. 실행 요청 생성

`POST /test-runs`

#### Request Body

```json
{
  "scenarioName": "login-stress-test",
  "targetUrl": "https://example.com/api/login",
  "virtualUsers": 50,
  "durationSec": 60,
  "rampUpSec": 10
}
```

#### Response

```json
{
  "testRunId": 1,
  "status": "PENDING",
  "requestedAt": "2026-05-20T14:00:00Z"
}
```

### 2. 실행 목록 조회

`GET /test-runs`

#### Response

```json
[
  {
    "testRunId": 1,
    "scenarioName": "login-stress-test",
    "status": "RUNNING",
    "requestedAt": "2026-05-20T14:00:00Z"
  }
]
```

### 3. 실행 상세 조회

`GET /test-runs/{testRunId}`

#### Response

```json
{
  "testRunId": 1,
  "scenarioName": "login-stress-test",
  "status": "SUCCESS",
  "targetUrl": "https://example.com/api/login",
  "virtualUsers": 50,
  "durationSec": 60,
  "requestedAt": "2026-05-20T14:00:00Z",
  "startedAt": "2026-05-20T14:00:10Z",
  "finishedAt": "2026-05-20T14:01:10Z"
}
```

### 4. 결과 조회

`GET /test-runs/{testRunId}/result`

#### Response

```json
{
  "testRunId": 1,
  "status": "SUCCESS",
  "totalRequests": 1200,
  "successCount": 1180,
  "failureCount": 20,
  "averageLatencyMs": 125.3,
  "p95LatencyMs": 210.7,
  "maxLatencyMs": 480.2,
  "failureSummary": [
    {
      "reason": "Timeout",
      "count": 12
    },
    {
      "reason": "5xx",
      "count": 8
    }
  ]
}
```

---

## 🔷 5. 데이터 모델

#### TestRun

- `id`
- `scenario_name`
- `target_url`
- `virtual_users`
- `duration_sec`
- `ramp_up_sec`
- `status`
- `requested_at`
- `started_at`
- `finished_at`
- `error_message`

#### TestRunResult

- `id`
- `test_run_id`
- `total_requests`
- `success_count`
- `failure_count`
- `average_latency_ms`
- `p95_latency_ms`
- `max_latency_ms`
- `failure_summary_json`

---

## 🔷 6. 비동기 처리 설계

- 실행 요청 API는 작업을 즉시 저장한 뒤 `PENDING` 상태로 응답한다.
- 이후 워커가 해당 작업을 가져가 `RUNNING`으로 전환하고 테스트를 수행한 다음, 결과를 저장한다.
- 작업 실패 시 `FAILED`로 변경하고 실패 사유를 기록한다.

---

## 🔷 7. 예외 처리

- 실행 파라미터가 잘못된 경우 `400 Bad Request`.
- 존재하지 않는 실행 ID 조회 시 `404 Not Found`.
- 이미 완료된 작업에 대해 재실행 금지 또는 별도 정책 적용.
- 비동기 워커 실패 시 상태를 `FAILED`로 갱신.

---

## 🔷 8. 구현 시 가정

- 인증/인가 기능은 제외한다.
- 실제 외부 부하 생성 도구 연동 대신, 시뮬레이션 로직으로 대체해도 된다.
- 분산 환경보다는 단일 서버/단일 워커 기준으로 구현한다.
- 테스트 도구의 핵심은 “실행 흐름과 결과 관리”에 두고, 고도화된 성능 최적화는 제외한다.
