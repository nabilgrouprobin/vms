# Laytime calculation specification (LTC) — VMS vs industry sheets

This document ties the sample **Laytime2000 / charterer laytime** layouts you shared to how VMS computes laytime, what was already implemented, and what we align in code.

## 1. What the reference sheets show

### 1.1 Laytime & demurrage summary (claim-style)

- Header: counterparty, claim, vessel/voyage, CP date, B/L date, cargo qty, discharge rate.
- **Port activity**: NOR, all fast, laytime commenced, start/end cargo, demurrage start, laytime completed — keyed off **dated events**.
- **Laytime used**: wall interval from commence to completion **minus** listed deductions (weekends, shifting, etc.).
- **Once on demurrage, always on demurrage (OODDA)**: after laytime is exhausted, periods that **did not** count toward laytime (e.g. weekends) **do** count toward **demurrage** time.
- **Allowed laytime**: `qty / discharge_rate` converted to days/hours/minutes.
- **Demurrage**: `(demurrage time in days, decimal) × rate per day`.

### 1.2 Port statement / chronology (Laytime2000)

- Table: **Day, Date, Start, End, Frac, Remark, To Count, Total Time, On Dem**.
- **To count** = time that counts in that row × fraction (e.g. 0.60 while discharging with five hatches, 0 for “NTC” non-time counting).
- **Total time** = running sum of **To count** (laytime used).
- **On Dem** = running sum of the portion of **To count** that accrues **after** allowed laytime is exhausted (OODDA changes which slices count at full rate).

### 1.3 Summary page

- **Laytime allowed** vs **laytime used**, **time lost** (used − allowed), demurrage/despatch rates, **net demurrage**.

## 2. VMS model (SOF-driven)

| Concept | VMS implementation |
|--------|---------------------|
| Events | `sof_events` ordered by `event_time`; each segment ends at the **closing** event (BIMCO-style). |
| Used vs hold | `counts_as_laytime` from event type category (`NORMAL` vs `HOLD_DELAY`); optional `laytime_impact_hours` override. |
| Charter qty / rate | Import contract `discharge_rate_mt_per_day` + vessel call approx weight (mother) or trip cargo (lighter) → **allowed hours** = `(qty/rate)*24`. |
| Excluded weekdays | Import contract `excluded_days` → hours stripped from **counting** segments unless OODDA applies. |
| Contract “contact” window | `excluded_time_period` / `excluded_days` → `ContractWeekWindow` for **daily contract hrs** column (reference only). |
| Money | `demurrage_hours / 24 * rate_per_day` (and dispatch mirror). |

## 3. Gaps addressed in this iteration

1. **OODDA on calendar stripping** — After cumulative **credited laytime** reaches **allowed**, hours on contractually excluded weekdays still **count** toward used time (and demurrage), matching Laytime2000 once the vessel is on demurrage.
2. **Persisted “used” vs events** — Statement `laytime_used_hours` and balance/dispatch now follow **event-based credited hours** (sum of segment “working” time after calendar), not the sum of **contract overlap hours** on the calendar grid (which was a different metric).
3. **Excluded hours** — Persisted `laytime_excluded_hours` follows the sum of segment **excluded** credits (holds + calendar strip), consistent with the timesheet.
4. **Daily demurrage column** — Accrual is driven by cumulative **working** hours crossing **allowed**, not cumulative contract overlap hours.
5. **Chronology export** — API returns **Laytime2000-style** rows (split by local calendar day) with `frac`, `toCountHours`, `totalUsedHours`, `onDemurrageHours` for UI/reporting.

## 4. Out of scope / later

- **Time-varying Frac** (e.g. 0.60 until alongside, then 1.0) — not modeled as a timeline rule yet; use **hold** segments and/or **explicit `laytimeImpactHours`** per event to approximate step changes.
- **Reversible vs non-reversible** laytime — single SOF scope per statement today; split load/discharge pools would need data model work.
- **Government holiday calendar** — not automated; can be modeled with hold events or future holiday tables.

## 5. Implementation checklist (completed in repo)

- [x] `laytime-calendar-count.ts` — `countableHours…WithLaytimeExpiry` + `applyImportContractCalendarToMotherSegments(..., allowedLaytimeHours)`.
- [x] `laytime-calculation.service.ts` — pass allowed; fix used/excluded/balance/dispatch; build chronology; apply CP **counting fraction** after calendar.
- [x] `laytime-counting-fraction.ts` — resolve explicit fraction vs `workableHatches / totalHatches`; scale segment `countingHours` (skips when event has explicit impact).
- [x] `import_contracts` — `laytime_counting_fraction`, `workable_hatches`, `total_hatches` + PATCH API + **Import contract laytime** form.
- [x] `laytime-chronology.ts` — split chronology slice at **laytime expiry** with **Laytime expires…** remark; running totals unchanged in substance.
- [x] `laytime-mother-daily-ledger.ts` — demurrage vs cumulative **working** hours.
- [x] `mother-laytime-timesheet-table.tsx` — Laytime2000-style **statement summary** (d-h-m + 5dp days × rate), **port statement** block, chronology + Frac strip + contract details.
- [x] Frontend / API types in `sof-api.ts` and `import-contracts-api.ts`.
- [x] Unit tests for OODDA calendar path and counting fraction helpers.

## 6. How to operate in VMS

1. Link SOF to vessel call; set **laytime time zone** (IANA).
2. Enter **import contract** (rate, excluded days, optional week marker line, demurrage/dispatch rates). Optionally set **Fraction (0–1)** or **workable / total hatches** (explicit fraction wins) for Laytime2000-style **Frac** on credited hours after the weekday calendar.
3. Record **SOF events** in chronological order; use **Normal** for time that counts and **Hold** for interruptions; use **laytime impact hours** when the charter fixes credited hours for an event (that bypasses hatch/fraction scaling).
4. Open **Laytime** tab → **Recalculate** — review the **Laytime worksheet**: statement summary (Laytime2000-style `Xd-XXh-XXm` + decimal days × rate), daily ledger, **port statement** (vessel / NOR / commence) with chronology (including **Laytime expires…** at the allowance), then SOF segments. Optional “Summary…” collapsible for legend and contract detail.

**Database:** apply migration `20260514120000_import_contract_laytime_counting_fraction` (then `npx prisma generate` if your environment supports it).
