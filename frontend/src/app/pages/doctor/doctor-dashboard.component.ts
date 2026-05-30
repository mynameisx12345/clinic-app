import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { NotifBellComponent } from '../../shared/notif-bell.component';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-doctor-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, NotifBellComponent, NgChartsModule],
  templateUrl: './doctor-dashboard.component.html',
  styleUrl: './doctor-dashboard.component.scss'
})
export class DoctorDashboardComponent implements OnInit {
  metrics = { forConfirmation: 0, todayAppts: 0, totalPatients: 0 };

  statusLabels: string[] = [];
  statusData: ChartConfiguration<'doughnut'>['data']['datasets'] = [];
  statusOptions: ChartConfiguration<'doughnut'>['options'] = { responsive: true, plugins: { legend: { position: 'bottom' } } };

  weekLabels: string[] = [];
  weekData: ChartConfiguration<'bar'>['data']['datasets'] = [];
  weekOptions: ChartConfiguration<'bar'>['options'] = { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, title: { display: true, text: 'Appointments' } } } };

  constructor(public api: ApiService) {}

  ngOnInit() {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    this.api.getDoctorAppointments().subscribe(appts => {
      this.metrics.forConfirmation = appts.filter(a => a.status === 'Pending').length;
      this.metrics.todayAppts = appts.filter(a => a.appointment_date === today).length;

      // Status doughnut
      const statuses = ['Pending', 'Confirmed', 'Completed', 'Cancelled'];
      const colors = ['#f59e0b', '#0d6efd', '#22c55e', '#ef4444'];
      this.statusLabels = statuses;
      this.statusData = [{ data: statuses.map(s => appts.filter(a => a.status === s).length), backgroundColor: colors }];

      // Weekly bar chart
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      const days: string[] = [];
      const labels: string[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        days.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`);
        labels.push(dayNames[d.getDay()]);
      }
      this.weekLabels = labels;
      this.weekData = [{ data: days.map(d => appts.filter(a => a.appointment_date === d).length), backgroundColor: '#0d6efd' }];
    });
    this.api.getDoctorPatients(this.api.user.id).subscribe(p => this.metrics.totalPatients = p.length);
  }
}
