import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, of, tap } from 'rxjs';
import { Invoice } from '../../models/invoice.model';

@Injectable({ providedIn: 'root' })
export class InvoiceService {
  private http = inject(HttpClient);
  private readonly STORAGE_KEY = 'invoice_data';
  private dataUrl = 'assets/data.json'; 

  getInvoices(): Observable<Invoice[]> {
    const savedData = localStorage.getItem(this.STORAGE_KEY);
    
    if (savedData) {
      return of(JSON.parse(savedData));
    }

    return this.http.get<Invoice[]>(this.dataUrl).pipe(
      tap(invoices => {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(invoices));
      })
    );
  }

  createInvoice(invoice: Invoice): Observable<Invoice> {
    const invoices = this.getRawData();
    invoices.push(invoice);
    this.saveRawData(invoices);
    return of(invoice);
  }

  updateInvoice(invoice: Invoice): Observable<Invoice> {
    let invoices = this.getRawData();
    const index = invoices.findIndex(i => i.id === invoice.id);
    if (index !== -1) {
      invoices[index] = invoice;
      this.saveRawData(invoices);
    }
    return of(invoice);
  }

  deleteInvoice(id: string): Observable<void> {
    const invoices = this.getRawData().filter(i => i.id !== id);
    this.saveRawData(invoices);
    return of(undefined);
  }

  getInvoiceById(id: string): Observable<Invoice | undefined> {
    return this.getInvoices().pipe(
      map(invoices => invoices.find(i => i.id === id))
    );
  }

  private getRawData(): Invoice[] {
    return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
  }

  private saveRawData(invoices: Invoice[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(invoices));
  }
}