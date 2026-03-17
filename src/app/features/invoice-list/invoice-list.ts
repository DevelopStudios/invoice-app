import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { InvoiceService } from '../../core/services/invoice/invoice.service';
import { Invoice } from '../../core/models/invoice.model';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { InvoiceForm } from "../invoice-form/invoice-form";

@Component({
  selector: 'app-invoice-list',
  imports: [CommonModule, RouterLink, InvoiceForm],
  templateUrl: './invoice-list.html',
  styleUrl: './invoice-list.scss',
})
export class InvoiceList implements OnInit {
  private invoiceService = inject(InvoiceService);
  invoices = signal<Invoice[]>([]);
  statusFilter = signal<string | null>(null);
  filteredInvoices = computed(() => {
  const data = this.invoices();
  const currentFilters = this.filters();
  const activeFilters = Object.keys(currentFilters).filter(key => currentFilters[key]);
  if (activeFilters.length === 0) return data;
  return data.filter(inv => activeFilters.includes(inv.status));
  });
  invoiceCount = computed(() => this.filteredInvoices().length);
  isFilterOpen = signal(false);
  filters = signal<any>({
    draft: false,
    pending: false,
    paid: false
  });
  isFormOpen = signal<boolean>(false);
  selectedInvoice = signal<Invoice | null>(null);

  ngOnInit(): void {
    this.invoiceService.getInvoices().subscribe(data => {
     this.invoices.set(data);
    });
  }

  openNewInvoice() {
    this.selectedInvoice.set(null);
    this.isFormOpen.set(true);
  }

  closeForm() {
    this.isFormOpen.set(false);
  }

  toggleFilter() {
    this.isFilterOpen.update(v => !v);
  }

  setFilter(status: string) {
    this.filters.update(f => ({
      ...f,
      [status]: !f[status]
    }));
  }

  protected getStatusColor(status: string): string {
  switch (status) {
    case 'paid': return '#33d69f';
    case 'pending': return '#ff8f00';
    default: return '#373b53';
  }
}

}
