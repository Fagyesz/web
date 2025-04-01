import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoginTrackerService {
  private readonly STORAGE_KEY = 'bapti_login_history';
  private readonly MAX_HISTORY = 20;
  
  /**
   * Track a login event in local storage
   */
  trackLogin(email: string, role: string): void {
    try {
      console.log(`Tracking login for ${email} with role ${role}`);
      
      // Create a log entry
      const logEntry = {
        email,
        role,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        platform: navigator.platform
      };
      
      // Get existing history
      let history = this.getLoginHistory();
      
      // Add new entry at the beginning
      history.unshift(logEntry);
      
      // Limit the history size
      if (history.length > this.MAX_HISTORY) {
        history = history.slice(0, this.MAX_HISTORY);
      }
      
      // Save back to storage
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
      
      console.log(`Login tracked successfully, history now has ${history.length} entries`);
    } catch (error) {
      console.error('Error tracking login:', error);
    }
  }
  
  /**
   * Get login history from storage
   */
  getLoginHistory(): any[] {
    try {
      const storedData = localStorage.getItem(this.STORAGE_KEY);
      return storedData ? JSON.parse(storedData) : [];
    } catch (error) {
      console.error('Error getting login history:', error);
      return [];
    }
  }
  
  /**
   * Clear login history
   */
  clearLoginHistory(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    console.log('Login history cleared');
  }
} 