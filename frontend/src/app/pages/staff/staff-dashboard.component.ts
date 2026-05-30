import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { NotifBellComponent } from '../../shared/notif-bell.component';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-staff-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, NotifBellComponent, NgChartsModule],
  templateUrl: './staff-dashboard.component.html',
  styleUrl: './staff-dashboard.component.scss'
})
export class StaffDashboardComponent implements OnInit {
  metrics = { todayAppts: 0, doneToday: 0, cancelledToday: 0, forConfirmation: 0, upcoming: 0, totalPatients: 0 };

  statusLabels: string[] = [];
  statusData: ChartConfiguration<'doughnut'>['data']['datasets'] = [];
  statusOptions: ChartConfiguration<'doughnut'>['options'] = { responsive: true, plugins: { legend: { position: 'bottom' } } };

  trendLabels: string[] = [];
  trendData: ChartConfiguration<'line'>['data']['datasets'] = [];
  trendOptions: ChartConfiguration<'line'>['options'] = { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, title: { display: true, text: 'Appointments' } }, x: { title: { display: true, text: 'Date' } } } };

  constructor(public api: ApiService) {}

  ngOnInit() {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    this.api.getAppointments().subscribe(appts => {
      this.metrics.todayAppts = appts.filter(a => a.appointment_date === today).length;
      this.metrics.doneToday = appts.filter(a => a.appointment_date === today && a.status === 'Completed').length;
      this.metrics.cancelledToday = appts.filter(a => a.appointment_date === today && a.status === 'Cancelled').length;
      this.metrics.forConfirmation = appts.filter(a => a.status === 'Pending').length;
      this.metrics.upcoming = appts.filter(a => a.appointment_date > today && a.status !== 'Cancelled').length;

      // Status doughnut
      const statuses = ['Pending', 'Confirmed', 'Completed', 'Cancelled'];
      const colors = ['#f59e0b', '#0d6efd', '#22c55e', '#ef4444'];
      this.statusLabels = statuses;
      this.statusData = [{ data: statuses.map(s => appts.filter(a => a.status === s).length), backgroundColor: colors }];

      // Trend line (last 30 days)
      const days: string[] = [];
      for (let i = 29; i >= 0; i--) { const d = new Date(now.getTime() - i * 86400000); days.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`); }
      this.trendLabels = days.map(d => d.slice(5));
      this.trendData = [{ data: days.map(d => appts.filter(a => a.appointment_date === d).length), borderColor: '#0d6efd', backgroundColor: '#0d6efd20', tension: 0.3, fill: true }];
    });
    this.api.getPatients().subscribe(p => this.metrics.totalPatients = p.length);
  }
}
