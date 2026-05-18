import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-pharmacist-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
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
}
