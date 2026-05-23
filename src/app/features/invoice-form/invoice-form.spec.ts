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
