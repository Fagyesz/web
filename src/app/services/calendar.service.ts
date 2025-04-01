import { Injectable } from '@angular/core';

interface CalendarEvent {
  title: string;
  description?: string;
  location?: string;
  startDate: Date;
  endDate?: Date;
  allDay?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CalendarService {
  
  constructor() { }
  
  /**
   * Generate Google Calendar URL for adding an event
   * @param event Calendar event details
   * @returns URL string that can be used to add event to Google Calendar
   */
  generateGoogleCalendarUrl(event: CalendarEvent): string {
    // Base URL for Google Calendar
    const baseUrl = 'https://calendar.google.com/calendar/render?action=TEMPLATE';
    
    // Format dates for Google Calendar
    const startDate = this.formatDateForGoogleCalendar(event.startDate);
    const endDate = event.endDate ? 
      this.formatDateForGoogleCalendar(event.endDate) : 
      this.formatDateForGoogleCalendar(this.addHoursToDate(event.startDate, 1));
    
    // Create URL parameters
    let params = [
      `dates=${startDate}/${endDate}`,
      `text=${encodeURIComponent(event.title)}`
    ];
    
    // Add optional parameters if they exist
    if (event.description) {
      params.push(`details=${encodeURIComponent(event.description)}`);
    }
    
    if (event.location) {
      params.push(`location=${encodeURIComponent(event.location)}`);
    }
    
    // Return complete URL
    return `${baseUrl}&${params.join('&')}`;
  }
  
  /**
   * Generate iCalendar (.ics) data for an event
   * @param event Calendar event details
   * @returns string with iCalendar format data
   */
  generateICalendarData(event: CalendarEvent): string {
    const startDate = this.formatDateForICalendar(event.startDate);
    const endDate = event.endDate ? 
      this.formatDateForICalendar(event.endDate) : 
      this.formatDateForICalendar(this.addHoursToDate(event.startDate, 1));
    
    const now = this.formatDateForICalendar(new Date());
    
    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      `DTSTART:${startDate}`,
      `DTEND:${endDate}`,
      `SUMMARY:${event.title}`,
      event.description ? `DESCRIPTION:${event.description}` : '',
      event.location ? `LOCATION:${event.location}` : '',
      `DTSTAMP:${now}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].filter(line => line !== '').join('\r\n');
  }
  
  /**
   * Helper function to add hours to a date
   */
  private addHoursToDate(date: Date, hours: number): Date {
    const newDate = new Date(date);
    newDate.setHours(newDate.getHours() + hours);
    return newDate;
  }
  
  /**
   * Format date for Google Calendar URL
   * Format: YYYYMMDDTHHMMSSZ
   */
  private formatDateForGoogleCalendar(date: Date): string {
    return date.toISOString().replace(/-|:|\.\d\d\d/g, '');
  }
  
  /**
   * Format date for iCalendar
   * Format: YYYYMMDDTHHMMSSZ
   */
  private formatDateForICalendar(date: Date): string {
    return date.toISOString().replace(/-|:|\.\d\d\d/g, '');
  }
} 