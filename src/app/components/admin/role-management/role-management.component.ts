import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../services/user.service';
import { UserProfile, UserRole, getRoleDisplayName } from '../../../models/user.model';
import { Subscription } from 'rxjs';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-role-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatMenuModule,
    MatButtonModule,
    MatIconModule,
    ReactiveFormsModule,
    TranslatePipe,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatChipsModule,
    MatCardModule,
    MatDividerModule,
    TranslateModule,
    RouterModule
  ],
  template: `
    <div class="admin-page p-4">
      <h2 class="text-2xl mb-4">{{ 'admin.role-management' | translate }}</h2>
      <p class="mb-4 text-gray-600">{{ 'admin.role-management.description' | translate }}</p>
      
      <div class="bg-white p-4 rounded-lg shadow">
        <div *ngIf="isLoading" class="flex justify-center items-center h-40">
          <mat-spinner [diameter]="40"></mat-spinner>
        </div>
        
        <div *ngIf="!isLoading && users.length === 0" class="p-8 text-center bg-gray-100 rounded-lg">
          <p>{{ 'admin.no-users-found' | translate }}</p>
        </div>
        
        <div *ngIf="!isLoading && users.length > 0">
          <div class="mb-4 bg-blue-50 p-4 rounded">
            <h3 class="font-bold mb-2">{{ 'admin.roles.info-title' | translate }}</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
              <div class="p-2">
                <span class="inline-block px-2 py-1 rounded bg-purple-600 text-white text-sm mb-1">{{ 'admin.roles.dev' | translate }}</span>
                <p class="text-sm">{{ 'admin.roles.dev-description' | translate }}</p>
              </div>
              <div class="p-2">
                <span class="inline-block px-2 py-1 rounded bg-blue-600 text-white text-sm mb-1">{{ 'admin.roles.admin' | translate }}</span>
                <p class="text-sm">{{ 'admin.roles.admin-description' | translate }}</p>
              </div>
              <div class="p-2">
                <span class="inline-block px-2 py-1 rounded bg-green-600 text-white text-sm mb-1">{{ 'admin.roles.staff' | translate }}</span>
                <p class="text-sm">{{ 'admin.roles.staff-description' | translate }}</p>
              </div>
              <div class="p-2">
                <span class="inline-block px-2 py-1 rounded bg-gray-600 text-white text-sm mb-1">{{ 'admin.roles.guest' | translate }}</span>
                <p class="text-sm">{{ 'admin.roles.guest-description' | translate }}</p>
              </div>
            </div>
          </div>
          
          <div class="overflow-x-auto shadow-md sm:rounded-lg">
            <div class="inline-block min-w-full align-middle">
              <table class="min-w-full divide-y divide-gray-200 table-fixed">
                <thead class="bg-gray-50">
                  <tr>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">{{ 'admin.user' | translate }}</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">{{ 'admin.email' | translate }}</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">{{ 'admin.current-role' | translate }}</th>
                    <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">{{ 'admin.actions' | translate }}</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr *ngFor="let user of users" [ngClass]="{'bg-blue-50': isCurrentUser(user)}">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center">
                        <div *ngIf="user.photoURL" class="h-10 w-10 rounded-full overflow-hidden mr-3">
                          <img [src]="user.photoURL" [alt]="user.displayName" class="h-full w-full object-cover">
                        </div>
                        <div *ngIf="!user.photoURL" class="h-10 w-10 flex items-center justify-center rounded-full bg-gray-300 mr-3">
                          {{ getUserInitials(user) }}
                        </div>
                        <div>
                          <div class="text-sm font-medium text-gray-900">{{ user.displayName }}</div>
                          <div *ngIf="isCurrentUser(user)" class="text-xs text-gray-500">({{ 'admin.you' | translate }})</div>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {{ user.email }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span [ngClass]="{
                        'px-2 py-1 text-xs font-semibold rounded-full': true,
                        'bg-purple-100 text-purple-800': user.role === 'dev',
                        'bg-blue-100 text-blue-800': user.role === 'admin',
                        'bg-green-100 text-green-800': user.role === 'staff',
                        'bg-gray-100 text-gray-800': user.role === 'guest'
                      }">
                        {{ getRoleDisplay(user.role) }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex justify-end">
                        <button 
                          class="px-3 py-1 rounded-md border border-blue-300 text-blue-600 flex items-center"
                          [matMenuTriggerFor]="roleMenu"
                          [disabled]="isCurrentUser(user) || !canModifyUser(user)"
                        >
                          <i class="fas fa-pencil-alt mr-1 text-sm"></i>
                          {{ 'admin.change-role' | translate }}
                        </button>
                        
                        <mat-menu #roleMenu="matMenu">
                          <div class="p-2 bg-white">
                            <div class="text-xs font-bold text-gray-500 mb-2">{{ 'admin.change-role-to' | translate }}</div>
                            
                            <div *ngFor="let role of getAvailableRoles(user)" class="mb-1">
                              <button 
                                mat-menu-item 
                                (click)="changeUserRole(user, role)"
                                [disabled]="role === user.role"
                                class="w-full"
                              >
                                <div class="flex items-center w-full">
                                  <span [ngClass]="{
                                    'px-2 py-1 text-xs font-semibold rounded-full': true,
                                    'bg-purple-100 text-purple-800': role === 'dev',
                                    'bg-blue-100 text-blue-800': role === 'admin',
                                    'bg-green-100 text-green-800': role === 'staff',
                                    'bg-gray-100 text-gray-800': role === 'guest'
                                  }">
                                    {{ getRoleDisplay(role) }}
                                  </span>
                                  <span *ngIf="role === user.role" class="text-xs text-gray-400 ml-2">({{ 'admin.current' | translate }})</span>
                                </div>
                              </button>
                            </div>
                          </div>
                        </mat-menu>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-page {
      max-width: 1200px;
      margin: 0 auto;
    }
    
    :host ::ng-deep .mat-mdc-menu-panel {
      min-width: 180px !important;
      background-color: white !important;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1) !important;
    }
    
    :host ::ng-deep .mat-mdc-menu-content {
      padding: 0 !important;
      background-color: white !important;
    }
    
    :host ::ng-deep .mat-mdc-menu-item {
      height: auto !important;
      min-height: 36px;
      line-height: normal;
      padding: 4px 8px;
      background-color: white !important;
    }
    
    @media (max-width: 768px) {
      table th, table td {
        padding-left: 0.5rem !important;
        padding-right: 0.5rem !important;
      }
      
      button span.material-icons-outlined + span {
        display: none;
      }
    }
  `]
})
export class RoleManagementComponent implements OnInit, OnDestroy {
  users: UserProfile[] = [];
  searchForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  currentUser: UserProfile | null = null;
  private subscriptions = new Subscription();
  
  // Available roles for assignment
  readonly allRoles = [
    UserRole.DEV,
    UserRole.ADMIN,
    UserRole.STAFF,
    UserRole.GUEST
  ];

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private snackBar: MatSnackBar,
    private translate: TranslateService
  ) {
    this.searchForm = this.fb.group({
      searchTerm: ['']
    });
  }

  ngOnInit(): void {
    console.log('Role management component initialized');
    // Get current user profile to determine permissions
    this.subscriptions.add(
      this.userService.getCurrentUserProfile().subscribe(user => {
        this.currentUser = user;
        console.log('Current user profile:', user);
      })
    );
    
    // Load all users
    this.loadUsers();
    
    // Set up search with debounce
    this.subscriptions.add(
      this.searchForm.get('searchTerm')?.valueChanges
        .pipe(
          debounceTime(300),
          distinctUntilChanged()
        )
        .subscribe(term => {
          this.searchUsers(term);
        }) || new Subscription()
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /**
   * Get display name for a user role
   */
  getRoleDisplay(role: UserRole | string): string {
    return getRoleDisplayName(role as UserRole);
  }

  /**
   * Check if the provided user is the current user
   */
  isCurrentUser(user: UserProfile): boolean {
    return this.currentUser?.uid === user.uid;
  }

  /**
   * Get user initials for avatar fallback
   */
  getUserInitials(user: UserProfile): string {
    if (!user.displayName) return '?';
    
    const parts = user.displayName.split(' ');
    if (parts.length === 1) {
      return parts[0].substring(0, 1).toUpperCase();
    }
    
    return (parts[0].substring(0, 1) + parts[parts.length - 1].substring(0, 1)).toUpperCase();
  }

  /**
   * Check if current user can modify the given user's role
   */
  canModifyUser(user: UserProfile): boolean {
    if (!this.currentUser) return false;
    
    // Can't modify self
    if (this.currentUser.uid === user.uid) return false;
    
    // Dev can modify anyone (superadmin)
    if (this.currentUser.role === UserRole.DEV) return true;
    
    // Admin can only modify staff and guest
    if (this.currentUser.role === UserRole.ADMIN) {
      return user.role === UserRole.STAFF || user.role === UserRole.GUEST;
    }
    
    // Staff and below can't modify anyone
    return false;
  }

  /**
   * Get available roles that can be assigned to a user
   * based on the current user's permissions
   */
  getAvailableRoles(user: UserProfile): UserRole[] {
    if (!this.currentUser) return [];
    
    // Dev can assign any role (superadmin)
    if (this.currentUser.role === UserRole.DEV) {
      return this.allRoles;
    }
    
    // Admin can only assign staff and guest
    if (this.currentUser.role === UserRole.ADMIN) {
      return [UserRole.STAFF, UserRole.GUEST];
    }
    
    return [];
  }

  /**
   * Change a user's role
   */
  async changeUserRole(user: UserProfile, newRole: UserRole): Promise<void> {
    if (!this.canModifyUser(user)) {
      this.showError(this.translate.instant('admin.error.insufficient-permissions'));
      return;
    }
    
    try {
      console.log(`Changing role of ${user.email} from ${user.role} to ${newRole}`);
      this.isLoading = true;
      
      // Use force update to ensure role change works
      const success = await this.userService.forceUpdateUserRole(user.uid, newRole);
      
      if (success) {
        // Update local user object to reflect the change
        user.role = newRole;
        this.showSuccess(
          this.translate.instant('admin.success.role-updated', { 
            user: user.displayName || user.email,
            role: this.getRoleDisplay(newRole)
          })
        );
      } else {
        this.showError(this.translate.instant('admin.error.updating-role'));
      }
    } catch (error) {
      console.error('Error changing user role:', error);
      this.showError(this.translate.instant('admin.error.updating-role'));
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Load all users
   */
  private loadUsers(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.subscriptions.add(
      this.userService.getAllUsers().subscribe({
        next: (users) => {
          this.users = users;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading users:', error);
          this.errorMessage = 'Error loading users. Please try again.';
          this.isLoading = false;
          this.showError(this.translate.instant('admin.error.loading'));
        }
      })
    );
  }

  /**
   * Search users by term
   */
  private searchUsers(term: string): void {
    if (!term || term.trim() === '') {
      this.loadUsers();
      return;
    }
    
    this.isLoading = true;
    
    this.subscriptions.add(
      this.userService.searchUsers(term).subscribe({
        next: (users) => {
          this.users = users;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error searching users:', error);
          this.isLoading = false;
          this.showError(this.translate.instant('admin.error.searching'));
        }
      })
    );
  }

  /**
   * Show success message
   */
  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }

  /**
   * Show error message
   */
  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }
} 