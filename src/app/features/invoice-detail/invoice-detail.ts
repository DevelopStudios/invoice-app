import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { InvoiceService } from '../../core/services/invoice/invoice.service';
import { Invoice } from '../../core/models/invoice.model';
import { CommonModule } from '@angular/common';
import { ConfirmationModal } from "../../shared/components/confirmation-modal/confirmation-modal";
import { InvoiceForm } from "../invoice-form/invoice-form";
import { take } from 'rxjs';

@Component({
  selector: 'app-invoice-detail',
  imports: [CommonModule, ConfirmationModal, InvoiceForm, RouterLink],
  templateUrl: './invoice-detail.html',
  styleUrl: './invoice-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InvoiceDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(InvoiceService);
  invoice = signal<Invoice | null>(null);
  isModalOpen = signal(false);
  isEditing = signal(false);
  isLoading = signal(true);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isLoading.set(false);
      this.service.getInvoiceById(id).pipe(
        take(1)
      ).subscribe((found:any) => this.invoice.set(found));
    }
  }

  getStatusColor(status: string | undefined) {
    switch (status) {
      case 'paid': return '#33d69f';
      case 'pending': return '#ff8f00';
      case 'draft': return '#373b53';
      default: return '#373b53';
    }
  }

  markAsPaid() {
    this.isLoading.set(true)
    const currentInvoice = this.invoice();
    if (currentInvoice) {
      const updatedInvoice:Invoice = {
        ...currentInvoice,
        status: 'paid'
      };
      this.service.updateInvoice(updatedInvoice).subscribe(value => 
      this.isLoading.set(false)
      );
    }
  }

  deleteInvoice() {
    const id = this.invoice()?.id;
    if (id) {
      this.service.deleteInvoice(id).subscribe({
        next: () => {
          this.isModalOpen.set(false);
          this.router.navigate(['/']);
        },
        error: (err) => {
          console.error('Deletion failed:', err);
        }
      });
    }
  }

}
