import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, fromEvent, merge } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class OfflineService {
  private isOfflineSubject = new BehaviorSubject<boolean>(false);
  public isOffline$ = this.isOfflineSubject.asObservable();

  constructor(private apiService: ApiService) {
    this.initializeOfflineDetection();
  }

  /**
   * Initialize offline detection using browser events and API health checks
   */
  private initializeOfflineDetection(): void {
    // Listen to browser online/offline events
    const online$ = fromEvent(window, 'online').pipe(map(() => false));
    const offline$ = fromEvent(window, 'offline').pipe(map(() => true));

    // Combine browser events with initial state
    merge(online$, offline$)
      .pipe(
        startWith(!navigator.onLine)
      )
      .subscribe(isOffline => {
        console.log('OfflineService: Browser offline state changed:', isOffline);
        this.isOfflineSubject.next(isOffline);
      });
  }

  /**
   * Check if the app should run in offline mode
   * This includes both browser offline state and API connectivity
   */
  public async checkOfflineMode(): Promise<boolean> {
    // First check browser connectivity
    if (!navigator.onLine) {
      console.log('OfflineService: Browser is offline');
      return true;
    }

    // Then check API connectivity
    try {
      const response = await fetch('/api/health', {
        method: 'GET',
        timeout: 5000
      } as any);
      
      if (!response.ok) {
        console.log('OfflineService: API health check failed');
        return true;
      }

      console.log('OfflineService: API is available');
      return false;
    } catch (error) {
      console.log('OfflineService: API connectivity check failed:', error);
      return true;
    }
  }

  /**
   * Get current offline state
   */
  public get isOffline(): boolean {
    return this.isOfflineSubject.value;
  }

  /**
   * Force offline mode (for testing or manual override)
   */
  public setOfflineMode(isOffline: boolean): void {
    console.log('OfflineService: Manually setting offline mode:', isOffline);
    this.isOfflineSubject.next(isOffline);
  }

  /**
   * Check API health and return result
   */
  public async checkApiHealth(): Promise<boolean> {
    try {
      console.log('OfflineService: Checking API health...');
      const response = await this.apiService.getHealth().toPromise();
      console.log('OfflineService: API health check successful');
      return true;
    } catch (error) {
      console.log('OfflineService: API health check failed:', error);
      return false;
    }
  }
}
