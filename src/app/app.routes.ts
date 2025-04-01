import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './services/auth.service';
import { map } from 'rxjs/operators';
import { of } from 'rxjs';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';
import { UserRole } from './models/user.model';

// Staff guard function
const isStaffGuard = () => {
  const authService = inject(AuthService);
  return of(authService.isStaff ? true : { path: '/login' });
};

export const routes: Routes = [
  { 
    path: '', 
    loadComponent: () => import('./components/home/home.component').then(m => m.HomeComponent) 
  },
  { 
    path: 'about', 
    loadComponent: () => import('./components/about/about.component').then(m => m.AboutComponent) 
  },
  { 
    path: 'services', 
    loadComponent: () => import('./components/services/services.component').then(m => m.ServicesComponent) 
  },
  { 
    path: 'events', 
    loadComponent: () => import('./components/events/events.component').then(m => m.EventsComponent) 
  },
  { 
    path: 'sermons', 
    loadComponent: () => import('./components/sermons/sermons.component').then(m => m.SermonsComponent) 
  },
  { 
    path: 'contact', 
    loadComponent: () => import('./components/contact/contact.component').then(m => m.ContactComponent) 
  },
  { 
    path: 'login', 
    loadComponent: () => import('./components/auth/login/login.component').then(m => m.LoginComponent) 
  },
  { 
    path: 'test-tailwind', 
    loadComponent: () => import('./test-tailwind/test-tailwind.component').then(m => m.TestTailwindComponent) 
  },
  {
    path: 'settings',
    loadComponent: () => import('./components/settings/settings.component').then(m => m.SettingsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'admin',
    loadComponent: () => import('./components/admin/dashboard/dashboard.component').then(c => c.DashboardComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.DEV] }
  },
  {
    path: 'admin/events',
    loadComponent: () => import('./components/admin/events/events-management.component').then(c => c.EventsManagementComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.DEV, UserRole.STAFF] }
  },
  {
    path: 'admin/news',
    loadComponent: () => import('./components/admin/news/news-management.component').then(c => c.NewsManagementComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.DEV, UserRole.STAFF] }
  },
  {
    path: 'admin/roles',
    loadComponent: () => import('./components/admin/role-management/role-management.component').then(c => c.RoleManagementComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.DEV] }
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full'
  }
];
