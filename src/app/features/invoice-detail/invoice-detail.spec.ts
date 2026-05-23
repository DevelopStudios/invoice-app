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
    expect(text).toContain('1,800.90');
  });
});
