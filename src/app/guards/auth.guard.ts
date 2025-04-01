import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take } from 'rxjs/operators';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  return authService.user().pipe(
    take(1),
    map(user => {
      const isAuthenticated = !!user;
      
      if (!isAuthenticated) {
        // User is not authenticated, redirect to login
        router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
        return false;
      }
      
      return true;
    })
  );
}; 