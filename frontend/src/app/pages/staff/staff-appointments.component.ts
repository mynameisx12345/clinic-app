import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { NotifBellComponent } from '../../shared/notif-bell.component';

@Component({
  selector: 'app-staff-appointments',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NotifBellComponent],
  templateUrl: './staff-appointments.component.html',
  styleUrl: './staff-appointments.component.scss'
})
export class StaffAppointmentsComponent implements OnInit {
  appointments: any[] = [];
  viewPatient: any = null;
  viewAppointment: any = null;
  sortCol = ''; sortDir = 1;
  page = 1; pageSize = 10;
  search = '';
  statusFilter = '';
  todayOnly = false;
  followUpOnly = false;

  constructor(public api: ApiService, private route: ActivatedRoute) {}
  ngOnInit() {
    this.route.queryParams.subscribe(p => { if (p['search']) { this.search = p['search']; this.todayOnly = false; } });
    this.load();
  }

  load() { this.api.getAppointments().subscribe(d => this.appointments = d); }

  get filtered() {
    let data = this.appointments;
    if (this.todayOnly) { const n = new Date(); const today = `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`; data = data.filter(a => a.appointment_date === today); }
    if (this.followUpOnly) data = data.filter(a => a.is_registered === 1);
    if (this.statusFilter) data = data.filter(a => a.status === this.statusFilter);
    if (this.search) {
      const s = this.search.toLowerCase();
      data = data.filter(a => (a.first_name + ' ' + a.last_name).toLowerCase().includes(s) || a.appointment_date.includes(s));
    }
    return data;
  }

  get paged() { return this.filtered.slice((this.page-1)*this.pageSize, this.page*this.pageSize); }
  get totalItems() { return this.filtered.length; }

  view(a: any) { this.viewAppointment = a; this.api.getPatient(a.patient_id).subscribe(p => this.viewPatient = p); }

  updateStatus(a: any, status: string) {
    this.api.updateAppointmentStatus(a.id, status).subscribe(() => { a.status = status; });
  }

  sort(col: string) {
    this.sortDir = this.sortCol === col ? -this.sortDir : 1;
    this.sortCol = col;
    this.filtered.sort((a, b) => (a[col] > b[col] ? 1 : -1) * this.sortDir);
  }

  get printDate() { return new Date().toLocaleDateString(); }

  printing = false;
  printTable() {
    this.printing = true;
    setTimeout(() => { window.print(); this.printing = false; });
  }

  exportCsv() {
    const rows = this.filtered;
    const header = 'Date,Time,Patient,Status';
    const csv = [header, ...rows.map(a => `${a.appointment_date},${a.time_slot},"${a.first_name} ${a.last_name}",${a.status}`)].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'appointments.csv'; a.click();
    URL.revokeObjectURL(url);
  }
}
