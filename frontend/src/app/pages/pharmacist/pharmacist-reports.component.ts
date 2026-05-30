import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { PharmaNotifBellComponent } from '../../shared/pharma-notif-bell.component';

@Component({
  selector: 'app-pharmacist-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, PharmaNotifBellComponent],
  templateUrl: './pharmacist-reports.component.html',
  styleUrl: './pharmacist-reports.component.scss'
})
export class PharmacistReportsComponent implements OnInit {
  ledger: any[] = [];
  page=1; pageSize=10;
  sortCol=''; sortDir=1;
  search=''; typeFilter=''; dateFrom=''; dateTo='';

  get filtered() {
    let data = this.ledger;
    if (this.search) { const s = this.search.toLowerCase(); data = data.filter(t => t.medicine_name?.toLowerCase().includes(s)); }
    if (this.typeFilter) data = data.filter(t => t.transaction_type === this.typeFilter);
    if (this.dateFrom) data = data.filter(t => t.transaction_date >= this.dateFrom);
    if (this.dateTo) data = data.filter(t => t.transaction_date <= this.dateTo);
    return data;
  }
  get paged() {
    let data = [...this.filtered];
    if (this.sortCol) data.sort((a: any,b: any) => (a[this.sortCol] > b[this.sortCol] ? 1 : -1) * this.sortDir);
    return data.slice((this.page-1)*this.pageSize, this.page*this.pageSize);
  }
  get totalItems() { return this.filtered.length; }
  sort(col: string) { this.sortDir = this.sortCol === col ? -this.sortDir : 1; this.sortCol = col; }

  constructor(public api: ApiService) {}
  ngOnInit() { this.api.getStockLedger().subscribe(d => this.ledger = d); }

  printing = false;
  get printDate() { return new Date().toLocaleDateString(); }

  printTable() {
    this.printing = true;
    setTimeout(() => { window.print(); this.printing = false; });
  }

  exportCsv() {
    const rows = this.filtered;
    const header = 'Date,Medicine,Type,Quantity,Price/Unit,Total';
    const csv = [header, ...rows.map(t => `${t.transaction_date},"${t.medicine_name}",${t.transaction_type},${t.quantity},${t.price_per_unit},${t.total_price}`)].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const el = document.createElement('a');
    el.href = url; el.download = 'stock-ledger.csv'; el.click();
    URL.revokeObjectURL(url);
  }
}
