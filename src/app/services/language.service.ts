import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

export interface Translation {
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private currentLang = new BehaviorSubject<string>('en');
  private translations: {[lang: string]: Translation} = {};
  private translationsLoaded: {[lang: string]: boolean} = {};
  private availableLanguages = ['en', 'hu'];

  constructor(private http: HttpClient) {
    const savedLang = localStorage.getItem('preferredLanguage');
    if (savedLang && this.availableLanguages.includes(savedLang)) {
      this.currentLang.next(savedLang);
    }
    
    // Load initial translations for current language
    this.loadTranslations(this.currentLang.value);
  }

  getCurrentLang(): Observable<string> {
    return this.currentLang.asObservable();
  }

  getAvailableLanguages(): string[] {
    return this.availableLanguages;
  }

  setLanguage(lang: string): void {
    if (this.availableLanguages.includes(lang) && lang !== this.currentLang.value) {
      this.currentLang.next(lang);
      localStorage.setItem('preferredLanguage', lang);
      
      if (!this.translationsLoaded[lang]) {
        this.loadTranslations(lang);
      }
    }
  }

  private loadTranslations(lang: string): void {
    this.http.get<Translation>(`/assets/i18n/${lang}.json`)
      .subscribe({
        next: (data) => {
          this.translations[lang] = data;
          this.translationsLoaded[lang] = true;
        },
        error: (error) => {
          console.error(`Could not load translations for ${lang}`, error);
          // Fallback to English if translation file can't be loaded
          if (lang !== 'en') {
            this.loadTranslations('en');
          }
        }
      });
  }

  translate(key: string): string {
    const currentLang = this.currentLang.value;
    
    if (!this.translations[currentLang]) {
      return key;
    }
    
    // Handle nested keys (e.g. 'events.add-to-calendar')
    const keys = key.split('.');
    let translation: any = this.translations[currentLang];
    
    for (const k of keys) {
      if (translation && translation[k] !== undefined) {
        translation = translation[k];
      } else {
        return key;
      }
    }
    
    return typeof translation === 'string' ? translation : key;
  }
} 