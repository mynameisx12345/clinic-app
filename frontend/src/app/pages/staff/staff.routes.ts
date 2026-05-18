import { Routes } from '@angular/router';

export const STAFF_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./staff-dashboard.component').then(m => m.StaffDashboardComponent) },
  { path: 'appointments', loadComponent: () => import('./staff-appointments.component').then(m => m.StaffAppointmentsComponent) },
  { path: 'appointments/book', loadComponent: () => import('../booking/booking.component').then(m => m.BookingComponent), data: { cancelRoute: '/staff/appointments', successRoute: '/staff/appointments' } },
  { path: 'availability', loadComponent: () => import('./staff-availability.component').then(m => m.StaffAvailabilityComponent) },
  { path: 'patients', loadComponent: () => import('./staff-patients.component').then(m => m.StaffPatientsComponent) },
  { path: 'patients/:id', loadComponent: () => import('./staff-patient-view.component').then(m => m.StaffPatientViewComponent), data: { backRoute: '/staff/patients' } },
  { path: 'inventory', loadComponent: () => import('./staff-inventory.component').then(m => m.StaffInventoryComponent) },
  { path: 'register-user', loadComponent: () => import('./staff-register-user.component').then(m => m.StaffRegisterUserComponent) }
];
