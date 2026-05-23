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
