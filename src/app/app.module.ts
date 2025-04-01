import { NgModule, Injectable } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { LayoutModule } from '@angular/cdk/layout';

import { environment } from '../environments/environment';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getStorage, provideStorage } from '@angular/fire/storage';

import { AppComponent } from './app.component';
import { routes } from './app.routes';

// AoT requires an exported function for factories
export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    RouterModule.forRoot(routes),
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    provideFirebaseApp(() => initializeApp(environment.firebase)) as any,
    provideFirestore(() => getFirestore()) as any,
    provideAuth(() => getAuth()) as any,
    provideStorage(() => getStorage()) as any,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      },
      defaultLanguage: 'en'
    }),
    LayoutModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

// This class will help track login sessions for debugging
@Injectable({ providedIn: 'root' })
export class LoginTracker {
  private readonly STORAGE_KEY = 'bapti_login_debug';
  
  trackLogin(email: string): void {
    try {
      const data = {
        email,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      };
      
      const history = this.getHistory();
      history.unshift(data);
      
      // Keep only last 10 logins
      if (history.length > 10) {
        history.pop();
      }
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
      console.log('Login tracked:', data);
    } catch (error) {
      console.error('Error tracking login:', error);
    }
  }
  
  getHistory(): any[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting login history:', error);
      return [];
    }
  }
  
  clearHistory(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
} 