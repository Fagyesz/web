import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TranslatePipe } from '../../../src/app/pipes/translate.pipe';
import { LanguageService } from '../../../src/app/services/language.service';
import { AuthService } from '../../../src/app/services/auth.service';
import { LanguageSelectorComponent } from '../../../src/app/components/shared/language-selector/language-selector.component';

@Component({
  selector: 'app-settings-menu',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe, LanguageSelectorComponent],
  templateUrl: './settings-menu.component.html',
  styleUrls: ['./settings-menu.component.css']
})
export class SettingsMenuComponent implements OnInit {
  isOpen = false;
  isAuthenticated = false;
  isAdmin = false;

  constructor(
    private languageService: LanguageService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.user().subscribe(user => {
      this.isAuthenticated = !!user;
      this.isAdmin = this.authService.isStaff;
    });
  }

  toggleMenu(): void {
    this.isOpen = !this.isOpen;
  }

  logout(): void {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/login']);
      this.isOpen = false;
    });
  }
} 