import { Routes } from '@angular/router';

export const PHARMACIST_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./pharmacist-dashboard.component').then(m => m.PharmacistDashboardComponent) },
  { path: 'inventory', loadComponent: () => import('./pharmacist-inventory.component').then(m => m.PharmacistInventoryComponent) },
  { path: 'reports', loadComponent: () => import('./pharmacist-reports.component').then(m => m.PharmacistReportsComponent) }
];
