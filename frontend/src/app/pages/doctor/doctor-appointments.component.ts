import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { NotifBellComponent } from '../../shared/notif-bell.component';

@Component({
  selector: 'app-doctor-appointments',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NotifBellComponent],
  templateUrl: './doctor-appointments.component.html',
  styleUrl: './doctor-appointments.component.scss'
})
export class DoctorAppointmentsComponent implements OnInit {
  appointments: any[] = [];
  page = 1; pageSize = 10;
  sortCol = ''; sortDir = 1;
  search = '';
  statusFilter = '';
  todayOnly = false;

  constructor(public api: ApiService, private route: ActivatedRoute) {}
  ngOnInit() {
    this.route.queryParams.subscribe(p => {
      if (p['search']) { this.search = p['search']; this.todayOnly = false; }
    });
    const saved = sessionStorage.getItem('doctorApptFilters');
    if (saved && !this.search) { const f = JSON.parse(saved); this.search = f.search; this.statusFilter = f.statusFilter; this.todayOnly = f.todayOnly; this.page = f.page; this.pageSize = f.pageSize; }
    this.api.getDoctorAppointments().subscribe(d => this.appointments = d);
  }

  saveFilters() { sessionStorage.setItem('doctorApptFilters', JSON.stringify({ search: this.search, statusFilter: this.statusFilter, todayOnly: this.todayOnly, page: this.page, pageSize: this.pageSize })); }

  get filtered() {
    let data = this.appointments;
    if (this.todayOnly) { const n = new Date(); const today = `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`; data = data.filter(a => a.appointment_date === today); }
    if (this.statusFilter) data = data.filter(a => a.status === this.statusFilter);
    if (this.search) {
      const s = this.search.toLowerCase();
      data = data.filter(a => (a.first_name + ' ' + a.last_name).toLowerCase().includes(s) || a.appointment_date.includes(s));
    }
    return data;
  }

  get paged() {
    let data = [...this.filtered];
    if (this.sortCol) data.sort((a: any, b: any) => (a[this.sortCol] > b[this.sortCol] ? 1 : -1) * this.sortDir);
    return data.slice((this.page - 1) * this.pageSize, this.page * this.pageSize);
  }
  get totalItems() { return this.filtered.length; }

  sort(col: string) { this.sortDir = this.sortCol === col ? -this.sortDir : 1; this.sortCol = col; }

  updateStatus(a: any, status: string) {
    this.api.updateAppointmentStatus(a.id, status).subscribe(() => { a.status = status; });
  }

  printing = false;
  get printDate() { return new Date().toLocaleDateString(); }

  printTable() {
    this.printing = true;
    setTimeout(() => { window.print(); this.printing = false; });
  }

  exportCsv() {
    const rows = this.filtered;
    const header = 'Date,Time,Patient,Reason,Status';
    const csv = [header, ...rows.map(a => `${a.appointment_date},${a.time_slot},"${a.first_name} ${a.last_name}","${a.reason_for_visit}",${a.status}`)].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const el = document.createElement('a');
    el.href = url; el.download = 'appointments.csv'; el.click();
    URL.revokeObjectURL(url);
  }
}
