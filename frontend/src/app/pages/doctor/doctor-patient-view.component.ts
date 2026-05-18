import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { PatientViewComponent } from '../../shared/patient-view/patient-view.component';

@Component({
  selector: 'app-doctor-patient-view',
  standalone: true,
  imports: [RouterLink, PatientViewComponent],
  template: `
<div class="d-flex">
  <nav class="sidebar p-3" style="width:220px">
    <h5 class="text-white mb-4">⚕ Doctor Panel</h5>
    <a routerLink="/doctor">Dashboard</a>
    <a routerLink="/doctor/appointments">Appointments</a>
    <a routerLink="/doctor/patients" class="active">Patients</a>
    <hr class="border-secondary">
    <a href="#" (click)="api.logout()">Logout</a>
  </nav>
  <app-patient-view></app-patient-view>
</div>`
})
export class DoctorPatientViewComponent {
  constructor(public api: ApiService) {}
}
