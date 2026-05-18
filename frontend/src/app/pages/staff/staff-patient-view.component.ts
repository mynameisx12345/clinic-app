import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { PatientViewComponent } from '../../shared/patient-view/patient-view.component';

@Component({
  selector: 'app-staff-patient-view',
  standalone: true,
  imports: [RouterLink, PatientViewComponent],
  template: `
<div class="d-flex">
  <nav class="sidebar p-3" style="width:220px">
    <h5 class="text-white mb-4">⚙ Admin Panel</h5>
    <a routerLink="/staff">Dashboard</a>
    <a routerLink="/staff/appointments">Appointments</a>
    <a routerLink="/staff/availability">Doctor Availability</a>
    <a routerLink="/staff/patients" class="active">Patient List</a>
    <a routerLink="/staff/inventory">Inventory</a>
    <a routerLink="/staff/register-user">Register User</a>
    <hr class="border-secondary">
    <a href="#" (click)="api.logout()">Logout</a>
  </nav>
  <app-patient-view></app-patient-view>
</div>`
})
export class StaffPatientViewComponent {
  constructor(public api: ApiService) {}
}
