import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-doctor-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './doctor-dashboard.component.html',
  styleUrl: './doctor-dashboard.component.scss'
})
export class DoctorDashboardComponent implements OnInit {
  metrics = { forConfirmation: 0, todayAppts: 0, totalPatients: 0 };
  constructor(public api: ApiService) {}

  ngOnInit() {
    const today = new Date().toISOString().split('T')[0];
    this.api.getDoctorAppointments().subscribe(appts => {
      this.metrics.forConfirmation = appts.filter(a => a.status === 'Pending').length;
      this.metrics.todayAppts = appts.filter(a => a.appointment_date === today).length;
    });
    this.api.getDoctorPatients(this.api.user.id).subscribe(p => this.metrics.totalPatients = p.length);
  }
}
