# InvoiceFlow

A billing lifecycle manager built in Angular 20 — create, edit, and track invoices through draft → pending → paid. Describe an invoice in plain English and the on-device AI fills the form for you.

**Live:** [invoice-1qmx1.kinsta.page](https://invoice-1qmx1.kinsta.page)

---

## What makes it interesting

Most invoice demos are just forms. InvoiceFlow adds a browser-native AI layer that parses natural language into a structured invoice — no API key, no server round-trip. The Qwen2.5-0.5B model runs entirely in a Web Worker via WebLLM, so the main thread stays unblocked while the model loads and infers. The rest of the app is built on Angular 20 Signals throughout — reactive state without Zone.js overhead, computed filters, and effect-driven form patching.

---

## AI invoice generation

Type a plain-English description in the AI field and hit **Generate**:

> "Invoice for Alex Chen at alex@example.com — 3 days of consulting at $800/day and 2 logo revisions at $400 each. Net 30 from today."

The model outputs structured JSON, which is parsed and patched directly into the reactive form — including line items, totals, payment terms, and due date.

**How it works under the hood:**

1. `LlmInferenceService` spawns a dedicated Web Worker on first use
2. The worker loads `Qwen2.5-0.5B-Instruct-q4f16_1-MLC` via WebLLM (cached in IndexedDB after first download, ~300MB)
3. A structured system prompt enforces raw JSON output with strict field types
4. `cleanAndParseJson()` handles arithmetic expressions and malformed JSON that small models occasionally produce
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
| Runtime | Zone.js 0.15 |

---

## Run locally

```bash
npm install
ng serve
```

Navigate to `http://localhost:4200`

> **First AI use:** the model (~300MB) downloads and caches in the browser on first click of **Load AI**. Subsequent loads are instant. Requires a browser with WebGPU or WASM fallback support (Chrome 113+, Edge 113+).
