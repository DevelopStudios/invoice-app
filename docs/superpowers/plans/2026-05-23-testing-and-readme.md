# Testing & README Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add regression-anchored unit tests (Karma/Jasmine) and e2e tests (Playwright) covering all fixed bugs and core user flows, then update the README with testing documentation.

**Architecture:** Unit tests live alongside source files in existing `.spec.ts` files. E2E tests live in a new `e2e/` directory at project root driven by Playwright. Each test maps to a known bug or critical business rule — no tests exist purely for coverage.

**Tech Stack:** Angular 20, Karma 6, Jasmine 5, Playwright (latest), TypeScript 5.8

---

## File Map

| Action | Path | Purpose |
|--------|------|---------|
| Modify | `src/app/shared/services/llm-inference.ts` | Add date normalization to `cleanAndParseJson` |
| Replace | `src/app/shared/services/llm-inference.spec.ts` | LlmInferenceService unit tests |
| Create | `src/app/core/services/invoice/invoice.service.spec.ts` | InvoiceService unit tests |
| Replace | `src/app/features/invoice-form/invoice-form.spec.ts` | InvoiceForm component tests |
| Replace | `src/app/features/invoice-list/invoice-list.spec.ts` | InvoiceList component tests |
| Replace | `src/app/features/invoice-detail/invoice-detail.spec.ts` | InvoiceDetail component tests |
| Create | `playwright.config.ts` | Playwright configuration |
| Create | `e2e/invoice-list.spec.ts` | E2E: list page flows |
| Create | `e2e/invoice-create.spec.ts` | E2E: new invoice flow |
| Create | `e2e/invoice-detail.spec.ts` | E2E: detail page flows |
| Create | `e2e/invoice-edit.spec.ts` | E2E: edit flow |
| Create | `e2e/invoice-actions.spec.ts` | E2E: delete + mark as paid |
| Modify | `package.json` | Add Playwright dep + e2e scripts |
| Modify | `README.md` | Add Testing section, update stack table |

---

## Task 1: Install Playwright

**Files:**
- Modify: `package.json`
- Create: `playwright.config.ts`

- [ ] **Step 1: Install Playwright test runner and Chromium**

```bash
npm install -D @playwright/test
npx playwright install chromium
```

Expected: `node_modules/@playwright/test` present, Chromium browser downloaded.

- [ ] **Step 2: Add e2e scripts to package.json**

In `package.json`, add to the `"scripts"` block:

```json
"e2e": "playwright test",
"e2e:ui": "playwright test --ui"
```

- [ ] **Step 3: Create playwright.config.ts at project root**

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: process.env['CI'] ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
```

- [ ] **Step 4: Verify Playwright can run (no tests yet)**

Make sure `ng serve` is running in a separate terminal, then:

```bash
npx playwright test --list
```

Expected: `No tests found` (no spec files yet). No errors.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json playwright.config.ts
git commit -m "chore: install Playwright and configure e2e runner"
```

---

## Task 2: LlmInferenceService — add date normalisation + unit tests

**Files:**
- Modify: `src/app/shared/services/llm-inference.ts`
- Create: `src/app/shared/services/llm-inference.spec.ts`

- [ ] **Step 1: Write the failing date-padding test first**

Create `src/app/shared/services/llm-inference.spec.ts`:

```typescript
import { TestBed } from '@angular/core/testing';
import { LlmInferenceService } from './llm-inference';

describe('LlmInferenceService – cleanAndParseJson', () => {
  let service: LlmInferenceService;
  // Access the private method via cast
  const parse = (text: string, prompt: string) =>
    (service as any).cleanAndParseJson(text, prompt);

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LlmInferenceService);
  });

  it('strips markdown code fences before parsing', () => {
    const text = '```json\n{"clientName":"Test"}\n```';
    expect(parse(text, 'prompt').clientName).toBe('Test');
  });

  it('evaluates arithmetic expressions like (5 * 80)', () => {
    const text = '{"items":[{"name":"Work","quantity":5,"price":80,"total":(5 * 80)}]}';
    const result = parse(text, '5 hours 80');
    expect(result.items[0].total).toBe(400);
  });

  it('pads un-padded single-digit day in createdAt', () => {
    const text = JSON.stringify({ createdAt: '2021-10-7', paymentDue: '2021-10-14' });
    expect(parse(text, 'prompt').createdAt).toBe('2021-10-07');
  });

  it('pads un-padded single-digit month and day', () => {
    const text = JSON.stringify({ createdAt: '2021-1-3' });
    expect(parse(text, 'prompt').createdAt).toBe('2021-01-03');
  });

  it('leaves already-padded dates unchanged', () => {
    const text = JSON.stringify({ createdAt: '2021-10-07' });
    expect(parse(text, 'prompt').createdAt).toBe('2021-10-07');
  });

  it('discards items when no price/qty/total matches numbers in prompt', () => {
    const text = JSON.stringify({
      clientName: 'Test',
      items: [{ name: 'New Logo', quantity: 1, price: 1532, total: 1532 }],
    });
    const result = parse(text, '5 hours of design at 75 per hour');
    expect(result.items).toEqual([]);
  });

  it('keeps items when a price appears in the prompt', () => {
    const text = JSON.stringify({
      clientName: 'Test',
      items: [{ name: 'Design', quantity: 5, price: 75, total: 375 }],
    });
    const result = parse(text, '5 hours of design at 75 per hour');
    expect(result.items.length).toBe(1);
  });

  it('repairs unquoted JSON keys via fallback', () => {
    const text = '{clientName: "Test"}';
    expect(parse(text, 'prompt').clientName).toBe('Test');
  });

  it('returns {} for completely unparseable input', () => {
    expect(parse('not json at all <<<', 'prompt')).toEqual({});
  });
});
```

- [ ] **Step 2: Run to confirm date-padding tests fail**

```bash
ng test --include="**/llm-inference.spec.ts" --watch=false
```

Expected: `pads un-padded single-digit day` and `pads un-padded single-digit month and day` FAIL. Other tests may pass or fail depending on current implementation.

- [ ] **Step 3: Add date normalisation to cleanAndParseJson in llm-inference.ts**

In `src/app/shared/services/llm-inference.ts`, inside `cleanAndParseJson`, after `parsed = JSON.parse(jsonString)` (in both the try and catch branches), add the following date normalisation block **before** the hallucination guard. Replace the current parsed-object construction block with:

```typescript
      let parsed: Partial<ParsedInvoice>;
      try {
        parsed = JSON.parse(jsonString);
      } catch (initialError) {
        jsonString = jsonString
          .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
          .replace(/,\s*([}\]])/g, '$1');
        parsed = JSON.parse(jsonString);
      }

      // Normalise dates to yyyy-MM-dd (model sometimes outputs 2021-1-3)
      const padDate = (d: string) =>
        d.replace(/^(\d{4})-(\d{1,2})-(\d{1,2})$/, (_, y, m, day) =>
          `${y}-${m.padStart(2, '0')}-${day.padStart(2, '0')}`
        );
      if (parsed.createdAt) parsed.createdAt = padDate(parsed.createdAt);
      if (parsed.paymentDue) parsed.paymentDue = padDate(parsed.paymentDue);

      if (parsed.items && parsed.items.length > 0) {
        const userNumbers = [...userInput.matchAll(/\d+(\.\d+)?/g)].map(m => parseFloat(m[0]));
        const allItemsGroundedInPrompt = parsed.items.every((item: any) =>
          userNumbers.some(n => n === item.price || n === item.quantity || n === item.total)
        );
        if (!allItemsGroundedInPrompt) {
          parsed.items = [];
        }
      }

      return parsed;
```

- [ ] **Step 4: Run all LlmInferenceService tests and confirm they pass**

```bash
ng test --include="**/llm-inference.spec.ts" --watch=false
```

Expected: All 9 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/shared/services/llm-inference.ts src/app/shared/services/llm-inference.spec.ts
git commit -m "test: add LlmInferenceService unit tests and date normalisation"
```

---

## Task 3: InvoiceService unit tests

**Files:**
- Create: `src/app/core/services/invoice/invoice.service.spec.ts`

- [ ] **Step 1: Write the tests**

Create `src/app/core/services/invoice/invoice.service.spec.ts`:

```typescript
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { InvoiceService } from './invoice.service';
import { Invoice } from '../../models/invoice.model';

const STORAGE_KEY = 'invoice_data';

const makeInvoice = (overrides: Partial<Invoice> = {}): Invoice => ({
  id: 'TS0001',
  createdAt: '2026-01-01',
  paymentDue: '2026-01-31',
  description: 'Test',
  paymentTerms: 30,
  clientName: 'Test Client',
  clientEmail: 'test@example.com',
  status: 'pending',
  senderAddress: { street: '1 Main St', city: 'London', postCode: 'E1 1AA', country: 'UK' },
  clientAddress: { street: '2 Other St', city: 'Manchester', postCode: 'M1 1AA', country: 'UK' },
  items: [],
  total: 0,
  ...overrides,
});

describe('InvoiceService', () => {
  let service: InvoiceService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(InvoiceService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  describe('getInvoices', () => {
    it('fetches from HTTP when localStorage is empty', () => {
      const seeded = [makeInvoice()];
      service.getInvoices().subscribe(data => expect(data).toEqual(seeded));
      const req = httpMock.expectOne('assets/data.json');
      req.flush(seeded);
    });

    it('reads from localStorage on subsequent calls without HTTP', () => {
      const cached = [makeInvoice({ id: 'CACHED1' })];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cached));
      service.getInvoices().subscribe(data => expect(data).toEqual(cached));
      httpMock.expectNone('assets/data.json');
    });
  });

  describe('createInvoice', () => {
    it('appends the invoice to localStorage', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      const inv = makeInvoice({ id: 'NEW001' });
      service.createInvoice(inv).subscribe();
      const stored: Invoice[] = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
      expect(stored.find(i => i.id === 'NEW001')).toBeTruthy();
    });
  });

  describe('updateInvoice', () => {
    it('updates the matching invoice and leaves others unchanged', () => {
      const original = makeInvoice({ id: 'UPD001', clientName: 'Before' });
      const other = makeInvoice({ id: 'OTHER1' });
      localStorage.setItem(STORAGE_KEY, JSON.stringify([original, other]));
      service.updateInvoice({ ...original, clientName: 'After' }).subscribe();
      const stored: Invoice[] = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
      expect(stored.find(i => i.id === 'UPD001')?.clientName).toBe('After');
      expect(stored.find(i => i.id === 'OTHER1')).toBeTruthy();
    });
  });

  describe('deleteInvoice', () => {
    it('removes the invoice from localStorage', () => {
      const inv = makeInvoice({ id: 'DEL001' });
      localStorage.setItem(STORAGE_KEY, JSON.stringify([inv]));
      service.deleteInvoice('DEL001').subscribe();
      const stored: Invoice[] = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
      expect(stored.find(i => i.id === 'DEL001')).toBeUndefined();
    });
  });

  describe('getLastSenderAddress', () => {
    it('returns the senderAddress of the most recent invoice with a street', () => {
      const old = makeInvoice({ id: 'OLD001', senderAddress: { street: 'Old St', city: '', postCode: '', country: '' } });
      const recent = makeInvoice({ id: 'NEW001', senderAddress: { street: 'New St', city: '', postCode: '', country: '' } });
      localStorage.setItem(STORAGE_KEY, JSON.stringify([old, recent]));
      expect(service.getLastSenderAddress()?.street).toBe('New St');
    });

    it('skips invoices with no street and returns the next valid one', () => {
      const withAddress = makeInvoice({ id: 'HAS001', senderAddress: { street: '1 Main St', city: '', postCode: '', country: '' } });
      const noAddress = makeInvoice({ id: 'NONE01', senderAddress: { street: '', city: '', postCode: '', country: '' } });
      localStorage.setItem(STORAGE_KEY, JSON.stringify([withAddress, noAddress]));
      expect(service.getLastSenderAddress()?.street).toBe('1 Main St');
    });

    it('returns null when localStorage is empty', () => {
      expect(service.getLastSenderAddress()).toBeNull();
    });
  });
});
```

- [ ] **Step 2: Run and confirm all tests pass**

```bash
ng test --include="**/invoice.service.spec.ts" --watch=false
```

Expected: All 8 tests PASS.

- [ ] **Step 3: Commit**

```bash
git add src/app/core/services/invoice/invoice.service.spec.ts
git commit -m "test: add InvoiceService unit tests"
```

---

## Task 4: InvoiceForm component tests

**Files:**
- Replace: `src/app/features/invoice-form/invoice-form.spec.ts`

- [ ] **Step 1: Write the tests**

Replace the entire content of `src/app/features/invoice-form/invoice-form.spec.ts`:

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { InvoiceForm } from './invoice-form';
import { InvoiceService } from '../../core/services/invoice/invoice.service';
import { LlmInferenceService } from '../../shared/services/llm-inference';

const mockLlmService = {
  isReady: signal(false),
  engineStatus: signal('Idle'),
  engineProgress: signal(0),
  parseInvoicePrompt: jasmine.createSpy('parseInvoicePrompt').and.returnValue(Promise.resolve({})),
  initialize: jasmine.createSpy('initialize').and.returnValue(Promise.resolve()),
};

describe('InvoiceForm', () => {
  let component: InvoiceForm;
  let fixture: ComponentFixture<InvoiceForm>;
  let mockInvoiceService: jasmine.SpyObj<InvoiceService>;

  beforeEach(async () => {
    mockInvoiceService = jasmine.createSpyObj('InvoiceService', [
      'createInvoice', 'updateInvoice', 'getLastSenderAddress',
    ]);
    mockInvoiceService.createInvoice.and.returnValue(of({} as any));
    mockInvoiceService.getLastSenderAddress.and.returnValue(null);
    mockLlmService.parseInvoicePrompt.calls.reset();

    await TestBed.configureTestingModule({
      imports: [InvoiceForm],
      providers: [
        { provide: InvoiceService, useValue: mockInvoiceService },
        { provide: LlmInferenceService, useValue: mockLlmService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InvoiceForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('save – validation', () => {
    it('marks all controls as touched when saving with invalid form', () => {
      component.save('pending');
      expect(component.invoiceForm.get('clientName')?.touched).toBeTrue();
      expect(component.invoiceForm.get('clientEmail')?.touched).toBeTrue();
    });

    it('does not call createInvoice when form is invalid', () => {
      component.save('pending');
      expect(mockInvoiceService.createInvoice).not.toHaveBeenCalled();
    });

    it('calls createInvoice when required fields are filled', () => {
      component.invoiceForm.patchValue({ clientName: 'Test', clientEmail: 'test@example.com' });
      component.save('pending');
      expect(mockInvoiceService.createInvoice).toHaveBeenCalled();
    });
  });

  describe('onAiGenerate', () => {
    it('does not overwrite senderAddress when AI result omits it', async () => {
      const address = { street: '19 Union Terrace', city: 'London', postCode: 'E1 3EZ', country: 'UK' };
      component.invoiceForm.patchValue({ senderAddress: address });
      mockLlmService.parseInvoicePrompt.and.returnValue(
        Promise.resolve({ clientName: 'AI Client', paymentTerms: 7 })
      );
      await component.onAiGenerate('some prompt');
      expect(component.invoiceForm.get('senderAddress')?.value).toEqual(address);
    });

    it('sets createdAt to today when AI result omits it', async () => {
      const today = new Date().toISOString().split('T')[0];
      mockLlmService.parseInvoicePrompt.and.returnValue(
        Promise.resolve({ clientName: 'AI Client' })
      );
      await component.onAiGenerate('some prompt');
      expect(component.invoiceForm.get('createdAt')?.value).toBe(today);
    });
  });
});
```

- [ ] **Step 2: Run and confirm all tests pass**

```bash
ng test --include="**/invoice-form.spec.ts" --watch=false
```

Expected: All 5 tests PASS.

- [ ] **Step 3: Commit**

```bash
git add src/app/features/invoice-form/invoice-form.spec.ts
git commit -m "test: add InvoiceForm component tests"
```

---

## Task 5: InvoiceList component tests

**Files:**
- Replace: `src/app/features/invoice-list/invoice-list.spec.ts`

- [ ] **Step 1: Write the tests**

Replace the entire content of `src/app/features/invoice-list/invoice-list.spec.ts`:

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';
import { provideRouter } from '@angular/router';
import { InvoiceList } from './invoice-list';
import { InvoiceService } from '../../core/services/invoice/invoice.service';
import { Invoice } from '../../core/models/invoice.model';

const makeInvoice = (overrides: Partial<Invoice> = {}): Invoice => ({
  id: 'TS0001', createdAt: '2026-01-01', paymentDue: '2026-01-31',
  description: 'Test', paymentTerms: 30, clientName: 'Client',
  clientEmail: 'c@c.com', status: 'pending',
  senderAddress: { street: '', city: '', postCode: '', country: '' },
  clientAddress: { street: '', city: '', postCode: '', country: '' },
  items: [], total: 100,
  ...overrides,
});

describe('InvoiceList', () => {
  let component: InvoiceList;
  let fixture: ComponentFixture<InvoiceList>;
  let mockInvoiceService: jasmine.SpyObj<InvoiceService>;

  beforeEach(async () => {
    mockInvoiceService = jasmine.createSpyObj('InvoiceService', ['getInvoices']);
    mockInvoiceService.getInvoices.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [InvoiceList],
      providers: [
        { provide: InvoiceService, useValue: mockInvoiceService },
        provideRouter([]),
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(InvoiceList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('invoice count grammar', () => {
    it('shows "No invoices" when count is 0', () => {
      const text: string = fixture.nativeElement.querySelector('p').textContent;
      expect(text).toContain('No invoices');
    });

    it('shows "There is 1 invoice" when count is 1', () => {
      mockInvoiceService.getInvoices.and.returnValue(of([makeInvoice()]));
      component.ngOnInit();
      fixture.detectChanges();
      const text: string = fixture.nativeElement.querySelector('p').textContent;
      expect(text).toContain('There is 1 invoice');
      expect(text).not.toContain('invoices');
    });

    it('shows "There are N total invoices" when count is 2', () => {
      mockInvoiceService.getInvoices.and.returnValue(
        of([makeInvoice({ id: 'A00001' }), makeInvoice({ id: 'B00002' })])
      );
      component.ngOnInit();
      fixture.detectChanges();
      const text: string = fixture.nativeElement.querySelector('p').textContent;
      expect(text).toContain('There are 2 total invoices');
    });
  });
});
```

- [ ] **Step 2: Run and confirm all tests pass**

```bash
ng test --include="**/invoice-list.spec.ts" --watch=false
```

Expected: All 4 tests PASS. If the singular grammar ("There is 1 invoice") test fails, it means the grammar fix in `invoice-list.html` is not yet applied — update line 7 of that template:

```html
{{ invoiceCount() === 1
    ? 'There is 1 invoice'
    : invoiceCount() > 1
      ? 'There are ' + invoiceCount() + ' total invoices'
      : 'No invoices' }}
```

Then re-run.

- [ ] **Step 3: Commit**

```bash
git add src/app/features/invoice-list/invoice-list.spec.ts src/app/features/invoice-list/invoice-list.html
git commit -m "test: add InvoiceList component tests (grammar + count)"
```

---

## Task 6: InvoiceDetail component tests

**Files:**
- Replace: `src/app/features/invoice-detail/invoice-detail.spec.ts`

- [ ] **Step 1: Write the tests**

Replace the entire content of `src/app/features/invoice-detail/invoice-detail.spec.ts`:

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { InvoiceDetail } from './invoice-detail';
import { InvoiceService } from '../../core/services/invoice/invoice.service';
import { Invoice } from '../../core/models/invoice.model';

const mockInvoice: Invoice = {
  id: 'RT3080',
  createdAt: '2021-08-18',
  paymentDue: '2021-08-19',
  description: 'Re-branding',
  paymentTerms: 1,
  clientName: 'Jensen Huang',
  clientEmail: 'jensenh@mail.com',
  status: 'pending',
  senderAddress: { street: '19 Union Terrace', city: 'London', postCode: 'E1 3EZ', country: 'UK' },
  clientAddress: { street: '106 Kendell Street', city: 'Sharrington', postCode: 'NR24 5WQ', country: 'UK' },
  items: [{ name: 'Brand Guidelines', quantity: 1, price: 1800.90, total: 1800.90 }],
  total: 1800.90,
};

describe('InvoiceDetail', () => {
  let component: InvoiceDetail;
  let fixture: ComponentFixture<InvoiceDetail>;

  beforeEach(async () => {
    const mockInvoiceService = jasmine.createSpyObj('InvoiceService', [
      'getInvoiceById', 'updateInvoice', 'deleteInvoice',
    ]);
    mockInvoiceService.getInvoiceById.and.returnValue(of(mockInvoice));

    await TestBed.configureTestingModule({
      imports: [InvoiceDetail],
      providers: [
        { provide: InvoiceService, useValue: mockInvoiceService },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => 'RT3080' } } },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(InvoiceDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders amounts with $ not £', () => {
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('$');
    expect(text).not.toContain('£');
  });

  it('renders total with two decimal places', () => {
    const text: string = fixture.nativeElement.textContent;
    // Angular number pipe with 1.2-2 formats 1800.9 as 1,800.90
    expect(text).toContain('1,800.90');
  });
});
```

- [ ] **Step 2: Run and confirm all tests pass**

```bash
ng test --include="**/invoice-detail.spec.ts" --watch=false
```

Expected: All 3 tests PASS.

- [ ] **Step 3: Commit**

```bash
git add src/app/features/invoice-detail/invoice-detail.spec.ts
git commit -m "test: add InvoiceDetail component tests (currency symbol + decimals)"
```

---

## Task 7: E2E — invoice list

**Files:**
- Create: `e2e/invoice-list.spec.ts`

> **Pre-requisite:** `ng serve` must be running on port 4200 before running any e2e task.

- [ ] **Step 1: Create the spec**

```typescript
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForLoadState('networkidle');
});

test('invoice list loads and shows invoice cards', async ({ page }) => {
  const cards = page.locator('[class*="rounded-xl"][class*="grid"]');
  await expect(cards.first()).toBeVisible();
});

test('each card shows a $ amount with decimal point', async ({ page }) => {
  const amount = page.locator('span').filter({ hasText: /^\$[\d,]+\.\d{2}$/ }).first();
  await expect(amount).toBeVisible();
});

test('invoice count text is grammatically correct for plural', async ({ page }) => {
  const count = await page.locator('h1 + p').textContent();
  // With seeded data there will be many invoices
  expect(count).toMatch(/There are \d+ total invoices/);
});

test('filter by paid shows only paid invoices', async ({ page }) => {
  await page.getByRole('button', { name: /Filter/i }).click();
  await page.getByText('paid', { exact: true }).click();
  await page.waitForTimeout(300);
  const statuses = await page.locator('[class*="capitalize"][class*="rounded-lg"]').allTextContents();
  expect(statuses.every(s => s.trim() === 'paid')).toBeTruthy();
});
```

- [ ] **Step 2: Run with ng serve running in a separate terminal**

```bash
npx playwright test e2e/invoice-list.spec.ts
```

Expected: All 4 tests PASS.

- [ ] **Step 3: Commit**

```bash
git add e2e/invoice-list.spec.ts
git commit -m "test(e2e): add invoice list specs"
```

---

## Task 8: E2E — invoice create

**Files:**
- Create: `e2e/invoice-create.spec.ts`

- [ ] **Step 1: Create the spec**

```typescript
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForLoadState('networkidle');
});

test('clicking Save & Send with empty form does not navigate away', async ({ page }) => {
  await page.getByRole('button', { name: /New/i }).click();
  await page.getByRole('button', { name: /Save & Send/i }).click();
  await expect(page).toHaveURL('/');
});

test('required fields show error state after failed save attempt', async ({ page }) => {
  await page.getByRole('button', { name: /New/i }).click();
  await page.getByRole('button', { name: /Save & Send/i }).click();
  // Error spans contain "can't be empty"
  await expect(page.getByText("can't be empty").first()).toBeVisible();
});

test('filling required fields and saving adds invoice to list', async ({ page }) => {
  await page.getByRole('button', { name: /New/i }).click();

  await page.getByLabel("Client's Name").fill('E2E Test Client');
  await page.getByLabel("Client's Email").fill('e2e@test.com');

  // Add a line item
  await page.getByRole('button', { name: /Add New Item/i }).click();
  await page.locator('input[formcontrolname="name"]').last().fill('Test Service');
  await page.locator('input[formcontrolname="quantity"]').last().fill('2');
  await page.locator('input[formcontrolname="price"]').last().fill('150');

  await page.getByRole('button', { name: /Save & Send/i }).click();
  await page.waitForURL('/');

  await expect(page.getByText('E2E Test Client')).toBeVisible();
});
```

- [ ] **Step 2: Run**

```bash
npx playwright test e2e/invoice-create.spec.ts
```

Expected: All 3 tests PASS.

- [ ] **Step 3: Commit**

```bash
git add e2e/invoice-create.spec.ts
git commit -m "test(e2e): add invoice create specs"
```

---

## Task 9: E2E — invoice detail

**Files:**
- Create: `e2e/invoice-detail.spec.ts`

- [ ] **Step 1: Create the spec**

```typescript
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForLoadState('networkidle');
  // Navigate to the first seeded invoice RT3080
  await page.goto('/invoice/RT3080');
  await page.waitForLoadState('networkidle');
});

test('detail page renders amounts with $ prefix', async ({ page }) => {
  const text = await page.locator('body').textContent();
  expect(text).toContain('$');
  expect(text).not.toContain('£');
});

test('Amount Due shows two decimal places', async ({ page }) => {
  // RT3080 total is 1800.90
  const amountDue = page.locator('text=Amount Due').locator('..').locator('span').last();
  await expect(amountDue).toContainText('1,800.90');
});

test('invoice dates do not wrap mid-number', async ({ page }) => {
  // Check that date elements have white-space: nowrap
  const dateEl = page.locator('p').filter({ hasText: /^\d{4}-\d{2}-\d{2}$/ }).first();
  const whiteSpace = await dateEl.evaluate(el => getComputedStyle(el).whiteSpace);
  expect(whiteSpace).toBe('nowrap');
});
```

- [ ] **Step 2: Run**

```bash
npx playwright test e2e/invoice-detail.spec.ts
```

Expected: All 3 tests PASS.

- [ ] **Step 3: Commit**

```bash
git add e2e/invoice-detail.spec.ts
git commit -m "test(e2e): add invoice detail specs"
```

---

## Task 10: E2E — invoice edit

**Files:**
- Create: `e2e/invoice-edit.spec.ts`

- [ ] **Step 1: Create the spec**

```typescript
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.goto('/invoice/RT3080');
  await page.waitForLoadState('networkidle');
});

test('edit form pre-fills with existing client name', async ({ page }) => {
  await page.getByRole('button', { name: 'Edit' }).click();
  const clientNameInput = page.getByLabel("Client's Name");
  await expect(clientNameInput).toHaveValue('Jensen Huang');
});

test('saving a changed client name reflects on the detail page', async ({ page }) => {
  await page.getByRole('button', { name: 'Edit' }).click();
  await page.getByLabel("Client's Name").fill('Updated Client');
  await page.getByRole('button', { name: /Save Changes/i }).click();
  await expect(page.getByText('Updated Client')).toBeVisible();
});
```

- [ ] **Step 2: Run**

```bash
npx playwright test e2e/invoice-edit.spec.ts
```

Expected: Both tests PASS.

- [ ] **Step 3: Commit**

```bash
git add e2e/invoice-edit.spec.ts
git commit -m "test(e2e): add invoice edit specs"
```

---

## Task 11: E2E — delete and mark as paid

**Files:**
- Create: `e2e/invoice-actions.spec.ts`

- [ ] **Step 1: Create the spec**

```typescript
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForLoadState('networkidle');
});

test('delete confirmation modal names the invoice ID', async ({ page }) => {
  await page.goto('/invoice/RT3080');
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByText('RT3080')).toBeVisible();
});

test('confirming delete removes invoice from list', async ({ page }) => {
  await page.goto('/invoice/XM9141');
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: 'Delete' }).click();
  await page.getByRole('button', { name: /Delete/i }).last().click();
  await page.waitForURL('/');
  await expect(page.getByText('#XM9141')).not.toBeVisible();
});

test('Mark as Paid changes status badge to paid', async ({ page }) => {
  await page.goto('/invoice/RT3080');
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: 'Mark as Paid' }).click();
  await expect(page.locator('[class*="capitalize"]').filter({ hasText: 'paid' })).toBeVisible();
});

test('Mark as Paid button is disabled on already-paid invoice', async ({ page }) => {
  await page.goto('/invoice/RT3080');
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: 'Mark as Paid' }).click();
  await expect(page.getByRole('button', { name: 'Mark as Paid' })).toBeDisabled();
});
```

- [ ] **Step 2: Run**

```bash
npx playwright test e2e/invoice-actions.spec.ts
```

Expected: All 4 tests PASS.

- [ ] **Step 3: Commit**

```bash
git add e2e/invoice-actions.spec.ts
git commit -m "test(e2e): add delete and mark-as-paid specs"
```

---

## Task 12: README update

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Replace README.md with the updated version**

```markdown
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
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: update README with testing section and stack table"
```

---

## Self-Review

Checked against spec:
- LlmInferenceService: ✅ all 7 test cases covered (markdown, arithmetic, date padding ×2, hallucination guard ×2, repair, unparseable)
- InvoiceService: ✅ all 8 test cases covered (HTTP seed, localStorage cache, create, update, delete, getLastSenderAddress ×3)
- InvoiceForm: ✅ markAllAsTouched, createInvoice not called on invalid, createInvoice called on valid, senderAddress preserved, createdAt fallback
- InvoiceList: ✅ 0/1/2 invoice count grammar
- InvoiceDetail: ✅ $ prefix, two decimal places
- E2E list: ✅ loads, $ amounts, count grammar, filter
- E2E create: ✅ blocks invalid, shows errors, creates and appears in list
- E2E detail: ✅ $ prefix, decimals, nowrap dates
- E2E edit: ✅ pre-fills, saves changes
- E2E actions: ✅ delete modal names ID, confirming removes, mark as paid updates badge + disables button
- README: ✅ Testing section, stack table updated, no content removed
