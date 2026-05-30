import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { PharmaNotifBellComponent } from '../../shared/pharma-notif-bell.component';

@Component({
  selector: 'app-pharmacist-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, PharmaNotifBellComponent],
  templateUrl: './pharmacist-inventory.component.html',
  styleUrl: './pharmacist-inventory.component.scss'
})
export class PharmacistInventoryComponent implements OnInit {
  inventory: any[] = [];
  showAdd = false;
  showStock = false;
  newMed: any = {};
  txn: any = { medicine_id: '', transaction_type: 'Sales', quantity: 0, price_per_unit: 0, total_price: 0, transaction_date: '', remarks: '' };
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

  calcTotal() { this.txn.total_price = (this.txn.quantity || 0) * (this.txn.price_per_unit || 0); }
  today() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }

  onMedicineChange() {
    const med = this.inventory.find(m => m.id === +this.txn.medicine_id);
    if (med) { this.txn.price_per_unit = med.unit_price; this.calcTotal(); }
  }

  addMedicine() {
    this.api.addMedicine(this.newMed).subscribe(() => { this.showAdd = false; this.newMed = {}; this.load(); });
  }

  submitTransaction() {
    this.api.addStockTransaction({ ...this.txn, medicine_id: +this.txn.medicine_id }).subscribe(() => { this.showStock = false; this.txn = { medicine_id: '', transaction_type: 'Sales', quantity: 0, price_per_unit: 0, total_price: 0, transaction_date: this.today(), remarks: '' }; this.load(); });
  }

  printing = false;
  get printDate() { return new Date().toLocaleDateString(); }

  printTable() {
    this.printing = true;
    setTimeout(() => { window.print(); this.printing = false; });
  }

  exportCsv() {
    const rows = this.filtered;
    const header = 'Name,Category,Batch,Form,Strength,Unit,Quantity,Price,Expiry Date';
    const csv = [header, ...rows.map(m => `"${m.medicine_name}","${m.category}",${m.batch_number},${m.dosage_form},${m.strength},${m.unit},${m.quantity},${m.unit_price},${m.expiration_date}`)].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const el = document.createElement('a');
    el.href = url; el.download = 'inventory.csv'; el.click();
    URL.revokeObjectURL(url);
  }
}
