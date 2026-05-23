# InvoiceFlow

A billing lifecycle manager built in Angular 20 — create, edit, and track invoices through draft → pending → paid. Describe an invoice in plain English and the on-device AI fills the form for you.

**Live:** [invoice-1qmx1.kinsta.page](https://invoice-1qmx1.kinsta.page)

---

## What makes it interesting

Most invoice demos are just forms. InvoiceFlow adds a browser-native AI layer that parses natural language into a structured invoice — no API key, no server round-trip. The Qwen2.5-0.5B model runs entirely in a Web Worker via WebLLM, so the main thread stays unblocked while the model loads and infers. The rest of the app is built on Angular 20 Signals throughout — reactive state without Zone.js overhead, computed filters, and effect-driven form patching.

---

## AI invoice generation

Type a plain-English description in the AI field and hit **Generate**:

> "3 hours of UI design at $75/hr for Sarah Johnson (sarah@acmecorp.com), due in 7 days"

The model outputs structured JSON, which is parsed and patched directly into the reactive form — including line items, totals, payment terms, and due date. A hallucination guard discards any items whose prices or quantities don't appear in the original prompt.

**How it works under the hood:**

1. `LlmInferenceService` spawns a dedicated Web Worker on first use
2. The worker loads `Qwen2.5-0.5B-Instruct-q4f16_1-MLC` via WebLLM (cached in IndexedDB after first download, ~300MB)
3. A structured system prompt enforces raw JSON output with strict field types
4. `cleanAndParseJson()` handles arithmetic expressions, un-padded dates, malformed JSON, and hallucinated line items
5. The result is patched into the Angular Reactive Form via `patchValue()` + `FormArray` rebuild

Loading progress is exposed as Signals (`engineProgress`, `engineStatus`, `isReady`) so the UI reacts without subscriptions.

---

## How it works

| Layer | Technology | Role |
|-------|-----------|------|
| AI inference | WebLLM + Qwen2.5-0.5B | Browser-native NLP → invoice JSON |
| Web Worker | `llm.worker.ts` | Isolates model loading from main thread |
| Signals | Angular 20 Signals | Reactive state: filters, form sync, AI status |
| Forms | Angular Reactive Forms | `FormGroup` + `FormArray` for dynamic line items |
| Persistence | localStorage + HTTP fallback | CRUD client-side; seeds from `assets/data.json` on first load |
| Styling | Tailwind CSS 4 + SCSS | Utility-first with component-scoped overrides |
| Framework | Angular 20 standalone | No NgModules; inject(), effect(), viewChild() |

---

## Features

- **AI form fill** — describe an invoice in plain text, get a populated form
- **Full CRUD** — create, edit, delete invoices with validation
- **Status lifecycle** — draft → pending → paid, enforced at service layer
- **Multi-status filter** — filter by any combination of draft / pending / paid
- **Line items** — dynamic FormArray with auto-calculated item totals and grand total
- **Due date calculation** — computed from creation date + payment terms (Net 1 / 7 / 30)
- **Local persistence** — survives page refresh; no backend required
- **Dark mode** — system-preference aware, togglable manually

---

## Stack

| | |
|---|---|
| Framework | Angular 20.3 |
| AI runtime | @mlc-ai/web-llm 0.2.82 |
| Model | Qwen2.5-0.5B-Instruct-q4f16_1-MLC |
| Styling | Tailwind CSS 4.2 + SCSS |
| Reactivity | Angular Signals + RxJS 7.8 |
| Language | TypeScript 5.8 |
| Unit tests | Karma 6 + Jasmine 5 |
| E2E tests | Playwright |

---

## Testing

### Unit tests (Karma + Jasmine)

```bash
ng test
```

Runs in watch mode by default. For a single CI run: `ng test --watch=false`.

**What's covered:**
- `LlmInferenceService` — JSON parsing, arithmetic evaluation, date normalisation, hallucination guard
- `InvoiceService` — localStorage CRUD, HTTP seeding, sender address lookup
- `InvoiceForm` — validation feedback, AI generate does not overwrite sender address, date fallback
- `InvoiceList` — singular/plural invoice count grammar
- `InvoiceDetail` — $ currency prefix, two decimal places on amounts

### E2E tests (Playwright)

```bash
# First time only — install browser
npx playwright install chromium

# In one terminal: start the dev server
ng serve

# In another terminal: run all e2e specs
npx playwright test

# Interactive UI mode
npx playwright test --ui
```

**What's covered:**
- Invoice list loads with $ amounts and correct count grammar
- Filter by status shows only matching invoices
- New invoice form blocks invalid saves and shows validation errors
- Creating an invoice adds it to the list
- Detail page shows $ amounts with two decimal places and non-wrapping dates
- Editing an invoice reflects changes on the detail page
- Delete confirmation modal names the invoice; confirming removes it from the list
- Mark as Paid updates the status badge and disables the button

---

## Run locally

```bash
npm install
ng serve
```

Navigate to `http://localhost:4200`

> **First AI use:** the model (~300MB) downloads and caches in the browser on first click of **Load AI**. Subsequent loads are instant. Requires a browser with WebGPU or WASM fallback support (Chrome 113+, Edge 113+).
