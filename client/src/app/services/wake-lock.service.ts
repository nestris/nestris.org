import { Injectable, OnDestroy } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class WakeLockService implements OnDestroy {
  private wakeLock: any = null;
  private wakeLockEnabled: boolean = false;
  private reconnectInterval: any = null;
  private readonly RECONNECT_DELAY_MS: number = 2000;

  constructor() {
    // Add visibility change listener to reacquire lock when page becomes visible
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    }
  }

  /**
   * Requests a screen wake lock to prevent the screen from dimming or turning off.
   */
  async enableWakeLock(): Promise<void> {
    this.wakeLockEnabled = true;
    await this.acquireWakeLock();
    
    // Start periodic reconnection attempts if not already started
    this.startReconnectInterval();
  }

  /**
   * Releases the screen wake lock if it is currently active.
   */
  async disableWakeLock(): Promise<void> {
    this.wakeLockEnabled = false;
    
    // Stop reconnection attempts
    this.stopReconnectInterval();
    
    // Release the current lock if it exists
    if (this.wakeLock) {
      try {
        await this.wakeLock.release();
        this.wakeLock = null;
        console.log('Wake Lock released');
      } catch (err) {
        console.error('Error releasing Wake Lock:', err);
      }
    }
  }

  /**
   * Handles document visibility changes to reacquire wake lock when document becomes visible
   */
  private async handleVisibilityChange(): Promise<void> {
    if (document.visibilityState === 'visible' && this.wakeLockEnabled && !this.wakeLock) {
      console.log('Document became visible, attempting to reacquire Wake Lock');
      await this.acquireWakeLock();
    }
  }

  /**
   * Core method to acquire the wake lock
   */
  private async acquireWakeLock(): Promise<boolean> {
    // Check if the Wake Lock API is available
    if (!('wakeLock' in navigator)) {
      console.warn('Wake Lock API not supported in this browser.');
      return false;
    }

    // Don't try to acquire if we already have an active lock
    if (this.wakeLock) {
      return true;
    }

    try {
      // Request a screen wake lock
      this.wakeLock = await (navigator as any).wakeLock.request('screen');

      // Listen for the release event
      this.wakeLock.addEventListener('release', () => {
        console.log('Wake Lock was released by the system');
        this.wakeLock = null;
        
        // If wake lock should still be enabled, try to reacquire immediately
        if (this.wakeLockEnabled) {
          console.log('Attempting to reacquire Wake Lock after system release');
          // We don't need to call acquireWakeLock here since the interval will handle it
        }
      });

      console.log('Wake Lock is active');
      return true;
    } catch (err) {
      console.error('Failed to acquire wake lock:', err);
      return false;
    }
  }

  /**
   * Starts the reconnection interval if it's not already running
   */
  private startReconnectInterval(): void {
    if (!this.reconnectInterval) {
      console.log('Starting wake lock reconnection interval');
      this.reconnectInterval = setInterval(async () => {
        if (this.wakeLockEnabled && !this.wakeLock && document.visibilityState === 'visible') {
          console.log('Periodic reconnection attempt for Wake Lock');
          await this.acquireWakeLock();
        }
      }, this.RECONNECT_DELAY_MS);
    }
  }

  /**
   * Stops the reconnection interval
   */
  private stopReconnectInterval(): void {
    if (this.reconnectInterval) {
      console.log('Stopping wake lock reconnection interval');
      clearInterval(this.reconnectInterval);
      this.reconnectInterval = null;
    }
  }

  /**
   * Clean up when service is destroyed
   */
  ngOnDestroy(): void {
    this.disableWakeLock();
    
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    }
  }
}