import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { PatientViewComponent } from '../../shared/patient-view/patient-view.component';
import { NotifBellComponent } from '../../shared/notif-bell.component';

@Component({
  selector: 'app-staff-patient-view',
  standalone: true,
  imports: [RouterLink, PatientViewComponent, NotifBellComponent],
  template: `
<div class="admin-layout">
  <nav class="sidebar">
    <div class="sidebar-brand">
      <img src="assets/1000054328.webp" alt="Logo">
      <span>Ballogdajan Medical Clinic</span>
    </div>
    <a routerLink="/staff">⊞ Dashboard</a>
    <a routerLink="/staff/appointments">📋 Appointments</a>
    <a routerLink="/staff/availability">⏲ Availability</a>
    <a routerLink="/staff/patients" class="active">👥 Patients</a>
    <a routerLink="/staff/register-user">⊕ Register User</a>
  </nav>
  <div class="admin-main">
    <header class="admin-header">
      <h4>Patient Details</h4>
      <div class="admin-header-actions">
        <app-notif-bell></app-notif-bell>
        <div class="user-info">
          <span>{{api.user?.username}}</span>
          <button class="btn-logout-sm" (click)="api.logout()">Logout</button>
        </div>
      </div>
    </header>
    <app-patient-view></app-patient-view>
  </div>
</div>`
})
export class StaffPatientViewComponent {
  constructor(public api: ApiService) {}
}
