import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-staff-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './staff-inventory.component.html',
  styleUrl: './staff-inventory.component.scss'
})
export class StaffInventoryComponent implements OnInit {
  inventory: any[] = [];
  showAdd = false;
  newMed: any = {};
  page=1; pageSize=10;
  sortCol=''; sortDir=1;
  search=''; statusFilter='';

  get filtered() {
    let data = this.inventory;
    if (this.search) { const s = this.search.toLowerCase(); data = data.filter(m => m.medicine_name.toLowerCase().includes(s) || m.category?.toLowerCase().includes(s)); }
    if (this.statusFilter === 'Good') data = data.filter(m => this.qtyStatus(m) === 'Good' && this.expStatus(m) === 'Good');
    else if (this.statusFilter === 'Low Stock') data = data.filter(m => this.qtyStatus(m) === 'Low Stock');
    else if (this.statusFilter === 'Critical') data = data.filter(m => this.qtyStatus(m) === 'Critical');
    else if (this.statusFilter === 'Expiring Soon') data = data.filter(m => this.expStatus(m) === 'Expiring Soon');
    else if (this.statusFilter === 'Expired') data = data.filter(m => this.expStatus(m) === 'Expired');
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
  ngOnInit() { this.load(); }
  load() { this.api.getInventory().subscribe(d => this.inventory = d); }

  qtyStatus(m: any) { return m.quantity <= 5 ? 'Critical' : m.quantity <= 20 ? 'Low Stock' : 'Good'; }
  expStatus(m: any) {
    const today = new Date(); const exp = new Date(m.expiration_date);
    if (exp <= today) return 'Expired';
    if (exp <= new Date(today.getTime() + 90 * 86400000)) return 'Expiring Soon';
    return 'Good';
  }

  addMedicine() {
    this.api.addMedicine(this.newMed).subscribe(() => { this.showAdd = false; this.newMed = {}; this.load(); });
  }
}
