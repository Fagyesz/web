import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { DataService, EventItem } from '../../services/data.service';
import { CalendarService } from '../../services/calendar.service';
import { DebugService } from '../../services/debug.service';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { LanguageService } from '../../services/language.service';
import { UserService } from '../../services/user.service';
import { UserProfile, UserRole } from '../../models/user.model';
import { AuthService } from '../../services/auth.service';
import { StorageService } from '../../services/storage.service';
import { RouterModule } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [CommonModule, DatePipe, TranslatePipe, MatButtonModule, RouterModule, MatProgressSpinnerModule],
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.css']
})
export class EventsComponent implements OnInit, OnDestroy {
  events: EventItem[] = [];
  isLoading = true;
  errorMessage: string | null = null;
  currentLanguage = 'en';
  showDebugInfo = false;
  private subscription = new Subscription();
  
  // Today's date for highlighting in calendar
  today = new Date();

  currentUserProfile: UserProfile | null = null;

  constructor(
    private dataService: DataService,
    private calendarService: CalendarService,
    private languageService: LanguageService,
    private debugService: DebugService,
    private cdr: ChangeDetectorRef,
    private userService: UserService,
    private auth: AuthService,
    private storageService: StorageService
  ) {}

  ngOnInit(): void {
    this.loadEvents();
    
    // Get current language
    this.subscription.add(
      this.languageService.getCurrentLang().subscribe(lang => {
        this.currentLanguage = lang;
      })
    );
    
    // Subscribe to debug mode changes
    this.subscription.add(
      this.debugService.isDebugMode().subscribe((isDebug: boolean) => {
        this.showDebugInfo = isDebug;
        this.cdr.detectChanges();
      })
    );

    // Get current user profile for debugging
    this.userService.getCurrentUserProfile().subscribe(profile => {
      this.currentUserProfile = profile;
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  loadEvents(): void {
    this.isLoading = true;
    this.errorMessage = null;
    
    console.log('Started loading events, isLoading:', this.isLoading);
    
    // TEMPORARY FIX: Set isLoading to false after a short delay
    setTimeout(() => {
      this.isLoading = false;
      console.log('Timeout: isLoading set to false:', this.isLoading);
      this.cdr.detectChanges();
    }, 2000);
    
    this.subscription.add(
      this.dataService.getEvents().pipe(
        finalize(() => {
          this.isLoading = false;
          console.log('Finalize called, isLoading set to false:', this.isLoading);
          this.cdr.detectChanges();
        })
      ).subscribe({
        next: (events) => {
          this.events = events;
          console.log(`Loaded ${events.length} events from Firestore:`, events);
          console.log('Current isLoading state:', this.isLoading);
          
          if (events.length === 0) {
            console.log('No events found');
          }
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error loading events:', error);
          this.errorMessage = 'Error loading events. Please try again.';
          this.cdr.detectChanges();
        }
      })
    );
  }

  formatDay(dateString: string): string {
    const date = new Date(dateString);
    return date.getDate().toString();
  }

  formatMonth(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('default', { month: 'short' });
  }

  /**
   * Check if a date is today
   * @param day Day number
   * @param month Month (1-12)
   * @param year Year
   * @returns boolean
   */
  isToday(day: number, month: number, year: number): boolean {
    const today = new Date();
    return today.getDate() === day && 
           today.getMonth() + 1 === month && 
           today.getFullYear() === year;
  }

  /**
   * Add event to Google Calendar
   * @param event Event details
   */
  addToGoogleCalendar(event: any): void {
    // Construct a date object from the string date and time 
    const eventDate = new Date(event.date);
    
    // Parse the time string (e.g., "7:00 PM - 8:30 PM")
    const timeRange = event.time.split(' - ');
    const startTime = this.parseTimeString(timeRange[0], eventDate);
    
    // If end time exists, parse it, otherwise set end time to start time + 1 hour
    let endTime;
    if (timeRange.length > 1) {
      endTime = this.parseTimeString(timeRange[1], eventDate);
    } else {
      endTime = new Date(startTime);
      endTime.setHours(endTime.getHours() + 1);
    }

    // Create calendar event object
    const calendarEvent = {
      title: event.title,
      description: event.description,
      location: event.location,
      startDate: startTime,
      endDate: endTime
    };
    
    // Generate and open the Google Calendar URL
    const url = this.calendarService.generateGoogleCalendarUrl(calendarEvent);
    window.open(url, '_blank');
  }

  /**
   * Generate and download an .ics file for an event
   * @param event Event details
   */
  downloadICalendarFile(event: any): void {
    // Construct dates similar to addToGoogleCalendar
    const eventDate = new Date(event.date);
    const timeRange = event.time.split(' - ');
    const startTime = this.parseTimeString(timeRange[0], eventDate);
    
    let endTime;
    if (timeRange.length > 1) {
      endTime = this.parseTimeString(timeRange[1], eventDate);
    } else {
      endTime = new Date(startTime);
      endTime.setHours(endTime.getHours() + 1);
    }

    // Create calendar event object
    const calendarEvent = {
      title: event.title,
      description: event.description,
      location: event.location,
      startDate: startTime,
      endDate: endTime
    };
    
    // Generate iCalendar data
    const icsData = this.calendarService.generateICalendarData(calendarEvent);
    
    // Create a Blob with the iCalendar data
    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
    
    // Create a URL for the Blob
    const url = URL.createObjectURL(blob);
    
    // Create a link element and trigger a download
    const link = document.createElement('a');
    link.href = url;
    link.download = `${event.title.replace(/\s+/g, '_')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Revoke the URL to free up memory
    URL.revokeObjectURL(url);
  }

  /**
   * Handle image loading errors by displaying a placeholder
   * @param event Image error event
   * @param title Event title
   */
  handleImageError(event: any, title: string): void {
    event.target.src = `https://via.placeholder.com/800x400?text=${title.replace(/\s+/g, '+')}`;
    event.onerror = null; // Prevent infinite loop if placeholder also fails
  }

  /**
   * Parse a time string (e.g., "7:00 PM") and apply it to a date
   * @param timeStr Time string to parse
   * @param baseDate Date object to apply the time to
   * @returns New Date object with the time applied
   */
  private parseTimeString(timeStr: string, baseDate: Date): Date {
    const date = new Date(baseDate);
    
    // Parse the time string (e.g., "7:00 PM")
    let hours = 0;
    let minutes = 0;
    
    // Extract hours and minutes
    const timeParts = timeStr.match(/(\d+)(?::(\d+))?\s*([aApP][mM])?/);
    
    if (timeParts) {
      hours = parseInt(timeParts[1], 10);
      minutes = timeParts[2] ? parseInt(timeParts[2], 10) : 0;
      
      // Handle AM/PM
      const meridian = timeParts[3] ? timeParts[3].toLowerCase() : null;
      
      if (meridian === 'pm' && hours < 12) {
        hours += 12;
      } else if (meridian === 'am' && hours === 12) {
        hours = 0;
      }
    }
    
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  /**
   * Toggle debug mode on/off
   */
  toggleDebugMode(): void {
    console.log('Toggling debug mode from events page');
    this.showDebugInfo = !this.showDebugInfo;
    this.debugService.toggleDebugMode();
    this.cdr.detectChanges();
  }

  /**
   * Force set current user as admin
   */
  async forceSetAsAdmin(): Promise<void> {
    try {
      if (!this.auth.currentUser) {
        alert('No user logged in');
        return;
      }
      
      const user = this.auth.currentUser;
      console.log('Force setting user as admin:', user.email);
      
      const success = await this.userService.forceUpdateUserRole(user.uid, UserRole.ADMIN);
      
      if (success) {
        alert(`User ${user.email} has been set as ADMIN. Try accessing admin features now.`);
      } else {
        alert('Failed to set user as admin. Check console for errors.');
      }
    } catch (error) {
      console.error('Error setting user as admin:', error);
      alert(`Error: ${(error as Error).message}`);
    }
  }

  /**
   * Initialize the users collection
   */
  async initializeUsersCollection(): Promise<void> {
    try {
      await this.userService.initializeUsersCollection();
      alert('Users collection initialized successfully. Try accessing the role management page now.');
    } catch (error) {
      console.error('Error initializing users collection:', error);
      alert('Error initializing users collection: ' + (error as Error).message);
    }
  }

  /**
   * Get the displayable image URL for an event
   * This handles both Firebase URLs and local storage fallback URLs
   */
  getEventImageUrl(event: EventItem): string {
    if (!event.imageUrl) return '';
    
    // Check if this is a local storage URL (from CORS fallback)
    if (event.imageUrl.startsWith(window.location.origin + '/local-storage/')) {
      // Try to get from local storage
      const matches = event.imageUrl.match(/(\d+)_[^\/]+$/);
      if (matches && matches[1]) {
        const key = `bapti_image_${matches[1]}`;
        const dataUrl = localStorage.getItem(key);
        if (dataUrl) {
          return dataUrl;
        }
      }
    }
    
    // Regular URL
    return event.imageUrl;
  }
}
