import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-staff-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './staff-dashboard.component.html',
  styleUrl: './staff-dashboard.component.scss'
})
export class StaffDashboardComponent implements OnInit {
  metrics = { todayAppts: 0, doneToday: 0, cancelledToday: 0, forConfirmation: 0, upcoming: 0, totalPatients: 0 };
  constructor(public api: ApiService) {}

  ngOnInit() {
    const today = new Date().toISOString().split('T')[0];
    this.api.getAppointments().subscribe(appts => {
      this.metrics.todayAppts = appts.filter(a => a.appointment_date === today).length;
      this.metrics.doneToday = appts.filter(a => a.appointment_date === today && a.status === 'Completed').length;
      this.metrics.cancelledToday = appts.filter(a => a.appointment_date === today && a.status === 'Cancelled').length;
      this.metrics.forConfirmation = appts.filter(a => a.status === 'Pending').length;
      this.metrics.upcoming = appts.filter(a => a.appointment_date > today && a.status !== 'Cancelled').length;
    });
    this.api.getPatients().subscribe(p => this.metrics.totalPatients = p.length);
  }
}
