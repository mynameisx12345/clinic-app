import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { ApiService } from '../services/api.service';

export const authGuard: CanActivateFn = () => {
  const api = inject(ApiService);
  const router = inject(Router);
  if (!api.isLoggedIn) { router.navigate(['/login']); return false; }
  return true;
};

export const roleGuard = (...roles: string[]): CanActivateFn => () => {
  const api = inject(ApiService);
  const router = inject(Router);
  if (!api.isLoggedIn) { router.navigate(['/login']); return false; }
  if (!roles.includes(api.user.role)) { router.navigate(['/' + api.user.role]); return false; }
  return true;
};
