import { Routes } from '@angular/router';
import { InvoiceList } from './features/invoice-list/invoice-list';
import { InvoiceDetail } from './features/invoice-detail/invoice-detail';

export const routes: Routes = [
    {path: '', component: InvoiceList},
    {path: 'invoice/:id', component: InvoiceDetail}
];
