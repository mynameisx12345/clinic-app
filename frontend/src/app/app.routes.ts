import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/welcome/welcome.component').then(m => m.WelcomeComponent) },
  { path: 'login', loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent) },
  { path: 'book', loadComponent: () => import('./pages/booking/booking.component').then(m => m.BookingComponent) },
  { path: 'thank-you', loadComponent: () => import('./pages/thank-you/thank-you.component').then(m => m.ThankYouComponent) },
  { path: 'patient', canActivate: [roleGuard('patient')], loadComponent: () => import('./pages/patient/patient-dashboard.component').then(m => m.PatientDashboardComponent) },
  { path: 'staff', canActivate: [roleGuard('staff')], loadChildren: () => import('./pages/staff/staff.routes').then(m => m.STAFF_ROUTES) },
  { path: 'doctor', canActivate: [roleGuard('doctor')], loadChildren: () => import('./pages/doctor/doctor.routes').then(m => m.DOCTOR_ROUTES) },
  { path: 'pharmacist', canActivate: [roleGuard('pharmacist')], loadChildren: () => import('./pages/pharmacist/pharmacist.routes').then(m => m.PHARMACIST_ROUTES) },
  { path: '**', redirectTo: '' }
];
