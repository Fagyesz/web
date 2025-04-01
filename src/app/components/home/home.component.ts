import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { DataService, EventItem, NewsItem } from '../../services/data.service';
import { Subscription } from 'rxjs';
import { LanguageService } from '../../services/language.service';
import { DebugService } from '../../services/debug.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe, TranslatePipe],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {
  events: EventItem[] = [];
  news: NewsItem[] = [];
  isLoading = true;
  currentLanguage = 'en';
  showDebugInfo = false;
  private subscription = new Subscription();

  constructor(
    private dataService: DataService,
    private languageService: LanguageService,
    private debugService: DebugService
  ) {}

  ngOnInit(): void {
    this.loadData();
    
    // Get the current language
    this.languageService.getCurrentLang().subscribe(lang => {
      this.currentLanguage = lang;
    });
    
    // Subscribe to debug mode changes
    this.subscription.add(
      this.debugService.isDebugMode().subscribe((isDebug: boolean) => {
        this.showDebugInfo = isDebug;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  loadData(): void {
    this.isLoading = true;
    
    // Load events from Firestore
    this.subscription.add(
      this.dataService.getEvents().subscribe({
        next: (events) => {
          this.events = events.slice(0, 3); // Get only first 3 events
          console.log(`Loaded ${events.length} events for home page`);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading events for home page:', error);
          this.isLoading = false;
        }
      })
    );
    
    // Load news from Firestore
    this.subscription.add(
      this.dataService.getNews().subscribe({
        next: (news) => {
          this.news = news.slice(0, 3); // Get only first 3 news items
          console.log(`Loaded ${news.length} news items for home page`);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading news for home page:', error);
        }
      })
    );
  }

  /**
   * Toggle debug mode on/off
   */
  toggleDebugMode(): void {
    console.log('Toggling debug mode from home page');
    this.showDebugInfo = !this.showDebugInfo;
    this.debugService.toggleDebugMode();
  }
}
