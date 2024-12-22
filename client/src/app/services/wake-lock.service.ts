import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class WakeLockService {
  private wakeLock: any = null;

  /**
   * Requests a screen wake lock to prevent the screen from dimming or turning off.
   */
  async enableWakeLock(): Promise<void> {
    // Check if the Wake Lock API is available
    if ('wakeLock' in navigator) {
      try {
        // Request a screen wake lock
        // Casting navigator to any to allow wakeLock usage
        this.wakeLock = await (navigator as any).wakeLock.request('screen');

        // Optional: Listen for the release event (e.g., system or user action)
        this.wakeLock.addEventListener('release', () => {
          console.log('Wake Lock was released by the system');
          this.wakeLock = null;
        });

        console.log('Wake Lock is active');
      } catch (err) {
        console.error('Failed to acquire wake lock:', err);
      }
    } else {
      console.warn('Wake Lock API not supported in this browser.');
    }
  }

  /**
   * Releases the screen wake lock if it is currently active.
   */
  async disableWakeLock(): Promise<void> {
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
}
