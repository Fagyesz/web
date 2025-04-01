import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserService } from '../services/user.service';
import { map, take, tap } from 'rxjs/operators';
import { UserProfile, UserRole, isRoleHigherOrEqual } from '../models/user.model';
import { Observable, of } from 'rxjs';

export const roleGuard: CanActivateFn = (route, state) => {
  const userService = inject(UserService);
  const router = inject(Router);
  
  // Get required roles from route data
  const requiredRoles = route.data?.['roles'] as UserRole[] || [];
  
  if (requiredRoles.length === 0) {
    // No role requirements specified, allow access
    return true;
  }
  
  return userService.getCurrentUserProfile().pipe(
    take(1),
    map((userProfile: UserProfile | null) => {
      if (!userProfile) {
        // User not authenticated or profile not loaded
        router.navigate(['/login']);
        return false;
      }
      
      // Check if user has any of the required roles
      const hasRequiredRole = requiredRoles.some(role => 
        isRoleHigherOrEqual(userProfile.role, role)
      );
      
      if (!hasRequiredRole) {
        console.log(`Access denied: User role ${userProfile.role} is insufficient. Required: ${requiredRoles.join(', ')}`);
        // User doesn't have required role, redirect to home
        router.navigate(['/']);
        return false;
      }
      
      return true;
    })
  );
}; 