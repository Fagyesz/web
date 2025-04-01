import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DebugService {
  private debugModeKey = 'bapti_debug_mode';
  private debugModeSubject = new BehaviorSubject<boolean>(false);
  
  constructor() {
    // Check local storage on init
    this.loadDebugState();
  }
  
  /**
   * Load debug state from local storage
   */
  private loadDebugState(): void {
    const savedState = localStorage.getItem(this.debugModeKey);
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        this.debugModeSubject.next(state.enabled);
      } catch (e) {
        console.error('Error parsing debug state:', e);
        this.debugModeSubject.next(false);
      }
    }
  }
  
  /**
   * Save the current debug state to local storage
   */
  private saveDebugState(enabled: boolean): void {
    const state = {
      enabled,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem(this.debugModeKey, JSON.stringify(state));
  }
  
  /**
   * Enable debug mode
   */
  enableDebugMode(): void {
    this.debugModeSubject.next(true);
    this.saveDebugState(true);
  }
  
  /**
   * Disable debug mode
   */
  disableDebugMode(): void {
    this.debugModeSubject.next(false);
    this.saveDebugState(false);
  }
  
  /**
   * Toggle debug mode state
   */
  toggleDebugMode(): void {
    const currentState = this.debugModeSubject.value;
    this.debugModeSubject.next(!currentState);
    this.saveDebugState(!currentState);
  }
  
  /**
   * Check if debug mode is enabled
   */
  isDebugMode(): Observable<boolean> {
    return this.debugModeSubject.asObservable();
  }
  
  /**
   * Get current debug mode value
   */
  isDebugModeEnabled(): boolean {
    return this.debugModeSubject.value;
  }
} 