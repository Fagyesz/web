import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { LanguageService } from '../../services/language.service';
import { AuthService } from '../../services/auth.service';
import { DebugService } from '../../services/debug.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  template: `
    <div class="container mx-auto px-4 py-12">
      <div class="max-w-3xl mx-auto">
        <h1 class="text-3xl font-bold mb-8">{{ 'settings.title' | translate }}</h1>
        
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 class="text-xl font-semibold mb-4">{{ 'settings.language' | translate }}</h2>
          
          <div class="flex space-x-4">
            <button 
              *ngFor="let language of availableLanguages" 
              (click)="changeLanguage(language.code)"
              class="px-4 py-2 rounded-md border"
              [ngClass]="{'bg-blue-100 border-blue-500': currentLanguage === language.code, 
                          'border-gray-300 hover:bg-gray-50': currentLanguage !== language.code}">
              {{ language.name }}
            </button>
          </div>
        </div>
        
        <!-- Staff Only Settings -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-6" *ngIf="isStaff">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h2 class="text-xl font-semibold mb-1">{{ 'settings.debug-mode' | translate }}</h2>
              <p class="text-gray-600 text-sm">{{ 'settings.debug-description' | translate }}</p>
            </div>
            
            <label class="inline-flex items-center cursor-pointer">
              <input type="checkbox" 
                    [checked]="debugMode" 
                    (change)="toggleDebugMode()" 
                    class="sr-only peer">
              <div class="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          <!-- Debug Mode Button -->
          <div class="flex items-center mt-4">
            <button 
              (click)="toggleDebugMode()" 
              class="w-full py-2 px-4 rounded-md text-center font-medium text-white transition-colors"
              [ngClass]="debugMode ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'">
              {{ (debugMode ? 'settings.disable-debug' : 'settings.enable-debug') | translate }}
            </button>
          </div>
        </div>
        
        <!-- Debug Info Section (temporary) -->
        <div class="bg-red-100 rounded-lg shadow-md p-6 mb-6" *ngIf="false">
          <h2 class="text-xl font-semibold mb-2">Debug Information</h2>
          <p>Is Staff: <span class="font-bold">{{ isStaff }}</span></p>
          <p>Is Logged In: <span class="font-bold">{{ isLoggedIn }}</span></p>
          <p>User Email: <span class="font-bold">{{ userEmail || 'Not logged in' }}</span></p>
          <p>Debug Mode: <span class="font-bold">{{ debugMode }}</span></p>
          
          <!-- Debug Mode Toggle Button (always visible) -->
          <div class="mt-4">
            <button 
              (click)="toggleDebugMode(true)" 
              class="w-full py-2 px-4 rounded-md text-center font-medium text-white transition-colors"
              [ngClass]="debugMode ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'">
              {{ (debugMode ? 'settings.disable-debug' : 'settings.enable-debug') | translate }} (FORCE)
            </button>
          </div>
        </div>
        
        <!-- Account Settings -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h2 class="text-xl font-semibold mb-4">{{ 'settings.account' | translate }}</h2>
          
          <div *ngIf="!isLoggedIn" class="text-center p-4 bg-gray-50 rounded-lg">
            <p class="mb-4">{{ 'settings.login-required' | translate }}</p>
            <button class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition">
              {{ 'settings.login' | translate }}
            </button>
          </div>
          
          <div *ngIf="isLoggedIn">
            <div class="flex items-center space-x-4 mb-6">
              <div class="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h3 class="font-semibold">{{ userEmail }}</h3>
                <p class="text-sm text-gray-600" *ngIf="isStaff">{{ 'settings.staff-account' | translate }}</p>
              </div>
            </div>
            
            <button class="text-red-600 hover:text-red-800 border border-red-600 hover:bg-red-50 rounded-md px-4 py-2 transition">
              {{ 'settings.logout' | translate }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      background-color: #f9fafb;
      min-height: 100vh;
    }
  `]
})
export class SettingsComponent implements OnInit, OnDestroy {
  availableLanguages = [
    { code: 'en', name: 'English' },
    { code: 'hu', name: 'Magyar' },
    { code: 'ro', name: 'Română' }
  ];
  
  currentLanguage = 'en';
  isLoggedIn = false;
  isStaff = false;
  userEmail = '';
  debugMode = false;
  
  private subscription = new Subscription();
  
  constructor(
    private languageService: LanguageService,
    private authService: AuthService,
    private debugService: DebugService
  ) {}
  
  ngOnInit(): void {
    // Get current language
    this.subscription.add(
      this.languageService.getCurrentLang().subscribe(lang => {
        this.currentLanguage = lang;
      })
    );
    
    // Check if user is logged in
    this.checkAuthStatus();
    
    // Get debug mode status
    this.subscription.add(
      this.debugService.isDebugMode().subscribe((mode: boolean) => {
        this.debugMode = mode;
      })
    );
  }
  
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
  
  changeLanguage(lang: string): void {
    this.languageService.setLanguage(lang);
  }
  
  toggleDebugMode(force: boolean = false): void {
    if (!this.isStaff && !force) return;
    console.log('Toggling debug mode, current value:', this.debugMode);
    this.debugService.toggleDebugMode();
  }
  
  private checkAuthStatus(): void {
    // In a real app, you would check the auth state
    const user = this.authService.getCurrentUser();
    this.isLoggedIn = !!user;
    
    if (this.isLoggedIn) {
      this.userEmail = user.email || 'Unknown';
      this.isStaff = this.authService.isStaffMember();
    }
  }
} 