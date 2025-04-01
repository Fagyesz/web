import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { SettingsMenuComponent } from '../../../../../components/shared/settings-menu/settings-menu.component';
import { AuthService } from '../../../services/auth.service';
import { UserService } from '../../../services/user.service';
import { UserRole } from '../../../models/user.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe, SettingsMenuComponent],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
  isAdmin = false;
  isStaff = false;
  private subscription = new Subscription();
  
  constructor(
    public authService: AuthService,
    private userService: UserService
  ) {}
  
  ngOnInit(): void {
    // Check user role directly from profile
    this.subscription.add(
      this.userService.getCurrentUserProfile().subscribe(profile => {
        if (profile) {
          console.log('Header - Current user profile:', profile);
          
          // Set admin/staff flags
          this.isAdmin = profile.role === UserRole.ADMIN || profile.role === UserRole.DEV;
          this.isStaff = profile.role === UserRole.STAFF || this.isAdmin;
          
          console.log('Header - isAdmin:', this.isAdmin);
          console.log('Header - isStaff:', this.isStaff);
        } else {
          this.isAdmin = false;
          this.isStaff = false;
        }
      })
    );
  }
  
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
