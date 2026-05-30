import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { NotifBellComponent } from '../../shared/notif-bell.component';

@Component({
  selector: 'app-doctor-patients',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NotifBellComponent],
  templateUrl: './doctor-patients.component.html',
  styleUrl: './doctor-patients.component.scss'
})
export class DoctorPatientsComponent implements OnInit {
  patients: any[] = [];
  page=1; pageSize=10;
  sortCol=''; sortDir=1;
  search=''; genderFilter='';
  get filtered() {
    let data = this.patients;
    if (this.genderFilter) data = data.filter(p => p.gender === this.genderFilter);
    if (this.search) { const s = this.search.toLowerCase(); data = data.filter(p => (p.first_name + ' ' + p.last_name).toLowerCase().includes(s) || p.contact_number?.includes(s)); }
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
  ngOnInit() { this.api.getDoctorPatients(this.api.user.id).subscribe(d => this.patients = d); }

  printing = false;
  get printDate() { return new Date().toLocaleDateString(); }

  printTable() {
    this.printing = true;
    setTimeout(() => { window.print(); this.printing = false; });
  }

  exportCsv() {
    const rows = this.filtered;
    const header = 'Name,Gender,Age,Contact';
    const csv = [header, ...rows.map(p => `"${p.first_name} ${p.last_name}",${p.gender},${p.age},${p.contact_number}`)].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const el = document.createElement('a');
    el.href = url; el.download = 'patients.csv'; el.click();
    URL.revokeObjectURL(url);
  }
}
