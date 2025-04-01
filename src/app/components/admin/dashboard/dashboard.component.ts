import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { AuthService } from '../../../services/auth.service';
import { UserService } from '../../../services/user.service';
import { UserRole } from '../../../models/user.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe],
  template: `
    <div class="admin-container">
      <div class="admin-sidebar">
        <h3>{{ 'admin.dashboard' | translate }}</h3>
        <nav>
          <ul>
            <li><a routerLink="/admin/news" routerLinkActive="active">{{ 'admin.news' | translate }}</a></li>
            <li><a routerLink="/admin/events" routerLinkActive="active">{{ 'admin.events' | translate }}</a></li>
            <li *ngIf="canManageRoles"><a routerLink="/admin/roles" routerLinkActive="active">{{ 'admin.role-management' | translate }}</a></li>
          </ul>
        </nav>
        <button class="btn-logout" (click)="logout()">{{ 'nav.logout' | translate }}</button>
      </div>
      <div class="admin-content">
        <h2>{{ 'admin.dashboard' | translate }}</h2>
        <p>Welcome to the admin dashboard. Select an option from the sidebar to manage content.</p>
        
        <div class="dashboard-cards">
          <div class="dashboard-card" routerLink="/admin/news">
            <div class="card-icon">
              <i class="fas fa-newspaper"></i>
            </div>
            <div class="card-content">
              <h3>{{ 'admin.news' | translate }}</h3>
              <p>Manage church news and announcements</p>
            </div>
          </div>
          
          <div class="dashboard-card" routerLink="/admin/events">
            <div class="card-icon">
              <i class="fas fa-calendar"></i>
            </div>
            <div class="card-content">
              <h3>{{ 'admin.events' | translate }}</h3>
              <p>Manage upcoming church events</p>
            </div>
          </div>
          
          <div class="dashboard-card" *ngIf="canManageRoles" routerLink="/admin/roles">
            <div class="card-icon">
              <i class="fas fa-users-cog"></i>
            </div>
            <div class="card-content">
              <h3>{{ 'admin.role-management' | translate }}</h3>
              <p>Manage user roles and permissions</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-container {
      display: flex;
      min-height: calc(100vh - 160px);
    }
    .admin-sidebar {
      width: 250px;
      background-color: #f8f9fa;
      padding: 2rem;
      border-right: 1px solid #e9ecef;
      display: flex;
      flex-direction: column;
    }
    .admin-sidebar h3 {
      margin-top: 0;
      margin-bottom: 1.5rem;
    }
    .admin-sidebar ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .admin-sidebar ul li {
      margin-bottom: 0.5rem;
    }
    .admin-sidebar ul li a {
      display: block;
      padding: 0.5rem 0;
      color: #333;
      text-decoration: none;
      transition: color 0.3s;
    }
    .admin-sidebar ul li a:hover, .admin-sidebar ul li a.active {
      color: #3474eb;
    }
    .btn-logout {
      margin-top: auto;
      background-color: transparent;
      border: 1px solid #dc3545;
      color: #dc3545;
      padding: 0.5rem;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.3s;
    }
    .btn-logout:hover {
      background-color: #dc3545;
      color: white;
    }
    .admin-content {
      flex: 1;
      padding: 2rem;
    }
    .dashboard-cards {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
      margin-top: 2rem;
    }
    .dashboard-card {
      display: flex;
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      padding: 1.5rem;
      cursor: pointer;
      transition: transform 0.3s, box-shadow 0.3s;
    }
    .dashboard-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 5px 10px rgba(0,0,0,0.15);
    }
    .card-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 60px;
      height: 60px;
      background-color: #e6effd;
      border-radius: 50%;
      margin-right: 1rem;
      color: #3474eb;
      font-size: 1.5rem;
    }
    .card-content h3 {
      margin-top: 0;
      margin-bottom: 0.5rem;
    }
    .card-content p {
      margin: 0;
      color: #666;
    }
    @media (max-width: 768px) {
      .admin-container {
        flex-direction: column;
      }
      .admin-sidebar {
        width: 100%;
        border-right: none;
        border-bottom: 1px solid #e9ecef;
        padding: 1rem;
      }
      .btn-logout {
        margin-top: 1rem;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  canManageRoles = false;
  
  constructor(
    private authService: AuthService,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Instead of immediately redirecting, check the profile first
    // This avoids race conditions where isStaff might not be updated yet
    
    console.log('Dashboard initializing, checking auth status...');
    console.log('Current auth state - isStaff:', this.authService.isStaff);
    console.log('Current auth state - isAuthenticated:', this.authService.isAuthenticated);
    
    // Check if user has permission to access admin dashboard using the profile
    this.userService.getCurrentUserProfile().subscribe(profile => {
      if (profile) {
        console.log('Current user profile in dashboard:', profile);
        console.log('Current user role:', profile.role);
        
        // Check for admin role permissions
        this.canManageRoles = profile.role === UserRole.ADMIN || profile.role === UserRole.DEV;
        console.log('Can manage roles:', this.canManageRoles);
        
        // Check if user has any valid role for this page
        const hasValidRole = 
          profile.role === UserRole.STAFF || 
          profile.role === UserRole.ADMIN || 
          profile.role === UserRole.DEV;
        
        console.log('Has valid role for dashboard:', hasValidRole);
        
        if (!hasValidRole) {
          console.log('User lacks permission, redirecting to login');
          this.router.navigate(['/login']);
        }
      } else {
        console.log('No user profile found in dashboard, checking auth status');
        
        // If no profile but user is authenticated, wait a bit for profile to load
        if (this.authService.isAuthenticated) {
          console.log('User is authenticated but profile not loaded yet, waiting...');
          // Don't redirect yet, give the profile time to load
        } else {
          console.log('User not authenticated, redirecting to login');
          this.router.navigate(['/login']);
        }
      }
    });
  }

  logout(): void {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/login']);
    });
  }
} 