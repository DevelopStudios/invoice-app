import { Component, inject, input, OnInit, output, effect, signal } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Invoice } from '../../core/models/invoice.model';
import { DecimalPipe } from '@angular/common';
import { InvoiceService } from '../../core/services/invoice/invoice.service';

@Component({
  selector: 'app-invoice-form',
  standalone: true,
  imports: [ReactiveFormsModule, DecimalPipe],
  templateUrl: './invoice-form.html',
  styleUrl: './invoice-form.scss',
})
export class InvoiceForm implements OnInit {
  private fb = inject(FormBuilder);
  public invoiceService = inject(InvoiceService);
  invoiceForm!: FormGroup;
  invoice = input<Invoice | null>(null);
  close = output<void>();
  isSaving: boolean = false;
  constructor() {

    this.invoiceForm = this.fb.group({
      senderAddress: this.fb.group({
        street: [''], city: [''], postCode: [''], country: ['']
      }),
      clientName: ['', Validators.required],
      clientEmail: ['', [Validators.required, Validators.email]],
      clientAddress: this.fb.group({
        street: [''], city: [''], postCode: [''], country: ['']
      }),
      createdAt: [''],
      paymentTerms: [30],
      items: this.fb.array([])
    });


    effect(() => {
      const data = this.invoice();
      if (data && this.invoiceForm) {
        this.invoiceForm.reset();
        this.invoiceForm.patchValue({
          clientName: data.clientName,
          clientEmail: data.clientEmail,
          createdAt: data.createdAt,
          paymentTerms: data.paymentTerms,
          senderAddress: data.senderAddress,
          clientAddress: data.clientAddress
        });
        this.items.clear();
        if (data.items) {
          data.items.forEach(item => {
            this.items.push(this.fb.group({
              name: [item.name],
              quantity: [item.quantity],
              price: [item.price],
              total: [item.total]
            }));
          });
        }
      }
    });
  }

  ngOnInit() {
  }

  removeItem(index: number): void {
    this.items.removeAt(index);
  }

  get items() {
    return this.invoiceForm.get('items') as FormArray;
  }

  addItem() {
    this.items.push(this.fb.group({
      name: [''], quantity: [1], price: [0]
    }));
  }

  save(status: 'draft' | 'pending' = 'pending') {
  if (status === 'pending' && this.invoiceForm.invalid) {
    this.invoiceForm.markAllAsTouched();
    return;
  }

  const formValue = this.invoiceForm.getRawValue();
  const currentInvoice = this.invoice();
  this.isSaving = true;
  const itemsWithTotals = formValue.items.map((item: any) => ({
    ...item,
    total: item.quantity * item.price
  }));

  const grandTotal = itemsWithTotals.reduce((sum: number, item: any) => sum + item.total, 0);

  const dueDate = this.calculateDueDate(formValue.createdAt, formValue.paymentTerms);

  const invoiceData: Invoice = {
    ...currentInvoice, 
    ...formValue,
    items: itemsWithTotals,
    total: grandTotal,
    paymentDue: dueDate,
    status: status
  };

  if (currentInvoice?.id) {
    this.invoiceService.updateInvoice(invoiceData).subscribe({
      next: () => this.handleSuccess(),
      error: () => this.isSaving = false
    });
  } else {
    const newInvoice = {
      ...invoiceData,
      id: this.generateResourceId(),
    } as Invoice;

    this.invoiceService.createInvoice(newInvoice).subscribe({
      next: () => this.handleSuccess(),
      error: () => this.isSaving = false
    });
  }
}

private calculateDueDate(createdAt: string, terms: number): string {
  if (!createdAt) return '';
  const date = new Date(createdAt);
  date.setDate(date.getDate() + Number(terms));
  return date.toISOString().split('T')[0];
}

  private handleSuccess() {
    this.isSaving = false;
    this.close.emit();
  }
  private generateResourceId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const nums = '0123456789';
    let id = '';
    for (let i = 0; i < 2; i++) id += chars.charAt(Math.floor(Math.random() * chars.length));
    for (let i = 0; i < 4; i++) id += nums.charAt(Math.floor(Math.random() * nums.length));
    return id;
  }
}