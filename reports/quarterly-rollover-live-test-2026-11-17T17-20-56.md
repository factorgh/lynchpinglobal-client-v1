# Quarterly Rollover Live Test Report

**Date:** 2026-11-17T17:20:56.107Z  
**Tester:** Automated script (`scripts/rollover-live-test.mjs`)  
**Request:** Damon Osei — run a test rollover on a test mandate; compare figures before/after  
**Verdict:** ✅ PASS — actual rollover executed and figures matched  

## What was tested

| Item | Value |
|------|-------|
| Method | **Actual live rollover** via `POST /api/v1/investments/rollover/execute-single` (not code-review only) |
| API host | http://localhost:3000 |
| Test client | QA Isolation Test (`qa.isolation.nov17.2026@lynchpin.test`) |
| Source mandate | `6afc8c4bc7dee714e5be1595` |
| New mandate | `6afc8cf27ed8ec6a51d4da87` |
| Source → target | Q4 → Q1 |
| Formula under test | `newPrincipal = principal + activeAddOnCapital + totalAccruedReturn` |

## BEFORE (source mandate, after `recalculateInvestment`)

| Field | Value |
|-------|-------|
| Transaction ID | `3fed8f3f-f18c-479d-8bf5-d932c30ad433` |
| Quarter | Q4 |
| Period | 2026-10-01 → 2026-12-31 |
| Principal | GHS 10,000.00 |
| Active add-on capital | GHS 5,000.00 |
| Principal accrued (gross) | GHS 417.60 |
| Add-on accrued (gross) | GHS 147.90 |
| Service fee | GHS 113.10 |
| Operational charge | GHS 50.00 |
| Performance yield | GHS 25.00 |
| **Net accrued (`totalAccruedReturn`)** | **GHS 427.40** |
| **Closing balance (carry-forward)** | **GHS 15,427.40** |
| Archived / active | false / true |

Add-ons on source:
- `6afc8c49c7dee714e5be1594` status=active amount=GHS 5,000.00 start=2026-10-15 accrued=GHS 147.90

## AFTER (new mandate)

| Field | Value |
|-------|-------|
| Transaction ID | `d1677d0b-3efb-46d4-b4ad-fe1ac46b8499` |
| Quarter | Q1 |
| Period | 2027-01-01 → 2027-03-31 |
| **New principal** | **GHS 15,427.40** |
| Active add-ons | GHS 0.00 (expected 0 — capital compounded into principal) |
| Net accrued (new period) | GHS 0.00 |
| Closing balance (new) | GHS 15,427.40 |
| `previousTransactionId` | `6afc8c4bc7dee714e5be1595` |
| Archived / active | false / true |

## AFTER (source mandate state)

| Field | Value |
|-------|-------|
| Archived | true |
| Active | false |
| Closing (unchanged snapshot fields) | principal GHS 10,000.00, net accrued GHS 427.40 |

## Math check

```
closing = principal + activeAddOns + totalAccruedReturn
        = 10000 + 5000 + 427.4
        = 15427.4

new.principal = 15427.4
delta         = 0
```

## Verification checklist

- ✅ **Source archived & inactive** — archived=true active=false
- ✅ **New principal = source closing balance** — expected GHS 15,427.40 got GHS 15,427.40 (Δ 0)
- ✅ **previousTransactionId links source → new** — 6afc8c4bc7dee714e5be1595
- ✅ **Active add-on capital folded into principal (no addOns on new)** — new addOns count=0
- ✅ **Target quarter set** — Q1
- ✅ **New mandate active / not archived** — active=true archived=false

## Code path confirmed

1. `recalculateInvestment(source)` refreshes accruals before quote/carry-forward  
2. Source set `archived=true`, `active=false`  
3. New investment created with `principal = closingBalance(source)` (unless overridden)  
4. `previousTransactionId` set to source  
5. `recalculateInvestment(new)` runs for the new quarter period  
6. Duplicate rollover to same target quarter is rejected by API  

## Notes for Damon

- This was an **actual posted rollover** on a **dedicated test mandate** under QA Isolation Test — not Anita’s live Q4 mandate, and not code-review only.
- Calendar today is still mid-Q4 (2026-11-17); quarter-end cron archive was **not** required because the admin **manual execute-single** path is what operators use from `/rollover` and matches the carry-forward math the cron path uses after archive.
- Source remains in DB as archived history; new Q1 mandate is active. Both are labeled for cleanup if needed.

## API response (truncated)

```json
{
  "_id": "6afc8cf27ed8ec6a51d4da87",
  "principal": 15427.4,
  "quarter": "Q1",
  "transactionId": "d1677d0b-3efb-46d4-b4ad-fe1ac46b8499",
  "startDate": "2027-01-01T00:00:00.000Z",
  "quarterEndDate": "2027-03-31T23:59:59.999Z"
}
```
