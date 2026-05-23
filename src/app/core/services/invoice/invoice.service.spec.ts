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
