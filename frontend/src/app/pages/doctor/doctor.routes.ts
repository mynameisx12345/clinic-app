import { Routes } from '@angular/router';

export const DOCTOR_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./doctor-dashboard.component').then(m => m.DoctorDashboardComponent) },
  { path: 'appointments', loadComponent: () => import('./doctor-appointments.component').then(m => m.DoctorAppointmentsComponent) },
  { path: 'consultation/:id', loadComponent: () => import('./consultation.component').then(m => m.ConsultationComponent) },
  { path: 'patients', loadComponent: () => import('./doctor-patients.component').then(m => m.DoctorPatientsComponent) },
  { path: 'patients/:id', loadComponent: () => import('./doctor-patient-view.component').then(m => m.DoctorPatientViewComponent), data: { backRoute: '/doctor/patients' } }
];
