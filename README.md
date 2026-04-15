# InvoiceFlow

A billing lifecycle manager built in Angular — create, edit, and track invoices through draft → pending → paid.

**Live:** [invoice-1qmx1.kinsta.page](https://invoice-1qmx1.kinsta.page)

---

## What makes it interesting

Most invoice demos are just forms. InvoiceFlow models the billing lifecycle as a finite state machine at the service layer — status transitions are enforced in code, not left to the UI to get right. The form is built on Angular CDK primitives with full WCAG 2.1 AA compliance, and all data persists locally without a backend.

---

## How it works

| Layer | Technology | Role |
|-------|-----------|------|
| State machine | Service layer | Enforces draft → pending → paid transitions |
| Forms | Angular CDK | Accessible form primitives, custom controls |
| Persistence | localStorage | All invoices stored client-side — no backend |
| Framework | Angular 17+ | Standalone components, OnPush, lazy-loaded routes |

---

## Stack

- Angular 17
- Angular CDK
- TypeScript
- localStorage

---

## Run locally

```bash
npm install
ng serve
```

Navigate to `http://localhost:4200`
