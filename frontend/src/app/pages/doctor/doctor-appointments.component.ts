import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-doctor-appointments',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
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

  constructor(public api: ApiService) {}
  ngOnInit() {
    const saved = sessionStorage.getItem('doctorApptFilters');
    if (saved) { const f = JSON.parse(saved); this.search = f.search; this.statusFilter = f.statusFilter; this.todayOnly = f.todayOnly; this.page = f.page; this.pageSize = f.pageSize; }
    this.api.getDoctorAppointments().subscribe(d => this.appointments = d);
  }

  saveFilters() { sessionStorage.setItem('doctorApptFilters', JSON.stringify({ search: this.search, statusFilter: this.statusFilter, todayOnly: this.todayOnly, page: this.page, pageSize: this.pageSize })); }

  get filtered() {
    let data = this.appointments;
    if (this.todayOnly) { const today = new Date().toISOString().split('T')[0]; data = data.filter(a => a.appointment_date === today); }
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
}
