# Testing & README Design — InvoiceFlow
Date: 2026-05-23

## Overview

Add regression-anchored unit tests (Karma + Jasmine) and e2e tests (Playwright) to the InvoiceFlow app, then update the README to document the testing setup. Every unit test maps to a bug that was previously fixed or a critical business rule — no tests exist purely for coverage metrics.

---

## Unit Tests

Framework: Karma + Jasmine (already configured, `ng test`).

### LlmInferenceService (`llm-inference.spec.ts`)

Tests target `cleanAndParseJson` directly — it is pure logic with no DOM dependency.

| Test | What it verifies |
|------|-----------------|
| Strips markdown fences | ` ```json ... ``` ` removed before parse |
| Evaluates arithmetic | `(5 * 80)` in JSON string resolved to `400` |
| Pads un-padded dates | `"2021-10-7"` normalised to `"2021-10-07"` for both `createdAt` and `paymentDue` |
| Hallucination guard — discard | Items whose price/quantity/total share no number with the prompt are set to `[]` |
| Hallucination guard — keep | Items whose price appears in the prompt are returned unchanged |
| Malformed JSON repair | Unquoted keys fixed by fallback regex; result returned successfully |
| Unparseable input | Returns `{}` without throwing |

### InvoiceService (`invoice.service.spec.ts`)

Tests run against a `localStorage` mock (cleared in `beforeEach`).

| Test | What it verifies |
|------|-----------------|
| First load seeds from HTTP | `getInvoices` calls `HttpClient` when localStorage is empty |
| Subsequent load reads cache | `getInvoices` returns localStorage data without HTTP call |
| `createInvoice` persists | Invoice appears in localStorage after create |
| `updateInvoice` mutates correctly | Updated fields reflected; other invoices unchanged |
| `deleteInvoice` removes entry | Invoice absent from localStorage after delete |
| `getLastSenderAddress` — found | Returns senderAddress of most recent invoice with non-empty street |
| `getLastSenderAddress` — skips blank | Ignores invoices with no street, returns next valid one |
| `getLastSenderAddress` — empty storage | Returns `null` |

### InvoiceForm (`invoice-form.spec.ts`)

| Test | What it verifies |
|------|-----------------|
| Invalid save marks all touched | `markAllAsTouched()` called; `cdr.markForCheck()` called |
| Valid save proceeds | Service `createInvoice` called with correct payload |
| AI generate preserves senderAddress | After `onAiGenerate`, `senderAddress` form value unchanged |
| AI generate sets today's date | When LLM result omits `createdAt`, form gets today's ISO date |

### InvoiceList (`invoice-list.spec.ts`)

| Test | What it verifies |
|------|-----------------|
| Singular grammar | Count of 1 renders "There is 1 invoice" |
| Plural grammar | Count > 1 renders "There are N total invoices" |
| Zero state | Count of 0 renders "No invoices" |

### InvoiceDetail (`invoice-detail.spec.ts`)

| Test | What it verifies |
|------|-----------------|
| Dollar prefix | Amounts rendered with `$` not `£` |
| Decimal places | Amounts show two decimal places (e.g. `$1,800.90`) |

---

## E2E Tests

Framework: Playwright, installed into `e2e/` at project root. Targets `http://localhost:4200`. Dev server must be running before `npx playwright test`.

### `invoice-list.spec.ts`
- Page loads; at least one invoice card is visible
- Each card amount contains `$` and a decimal point
- Count text is grammatically correct for the number of visible cards
- Filter dropdown opens on click; filtering by "paid" shows only paid invoices

### `invoice-create.spec.ts`
- Clicking Save & Send on an empty form does not navigate away
- Required field inputs visually indicate error state
- Completing clientName, clientEmail, one line item, and saving → new invoice visible in list

### `invoice-detail.spec.ts`
- Navigating to an invoice renders amounts with `$` and two decimal places
- Date values have `white-space: nowrap` computed style (no mid-number wrapping)

### `invoice-edit.spec.ts`
- Opening edit from detail page pre-fills the form with existing values
- Changing client name and saving reflects the new name on the detail page

### `invoice-actions.spec.ts`
- Delete: confirmation modal contains the invoice ID; confirming removes the invoice from the list
- Mark as Paid: status badge changes to "paid"; Mark as Paid button gains `disabled` attribute

---

## README Update

Full rewrite of `README.md`. Existing content (features, AI explanation, architecture table, run locally) is preserved. Changes:

- **Stack table**: add Playwright row
- **New section — Testing**: documents `ng test`, Playwright install, `npx playwright test`, `--ui` flag, and a bullet summary of what each layer covers
- No other structural changes

---

## Out of Scope

- CI pipeline integration
- Visual regression tests
- Mobile viewport e2e (Playwright config for multiple viewports)
- Component DOM snapshot tests
