import { Injectable, Type, ComponentRef } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface AlertEntry {
  alertId: string;
  componentType: Type<any>;
  inputs?: { [key: string]: any };
  hide?: boolean; // New property to control fade-out
}

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private alertsSubject = new BehaviorSubject<Map<string, AlertEntry>>(new Map());
  private alertRefs = new Map<string, ComponentRef<any>>();

  /**
   * Observable of current alerts
   */
  get alerts$(): Observable<Map<string, AlertEntry>> {
    return this.alertsSubject.asObservable();
  }

  /**
   * Adds an alert component to be rendered
   * @param componentType Component type of the alert
   * @param alertId Unique identifier for the alert
   * @param inputs Inputs for the alert component
   * @param autoHideSeconds Optional time in seconds to auto-hide the alert
   */
  addAlert<T>(
    componentType: Type<T>,
    alertId: string,
    inputs?: { [key: string]: any },
    autoHideSeconds?: number
  ): void {
    const currentAlerts = this.alertsSubject.value;
    currentAlerts.set(alertId, {
      alertId,
      componentType,
      inputs,
      hide: false // Set hide to false by default
    });
    this.alertsSubject.next(currentAlerts);

    // Set up auto-hide if `autoHideSeconds` is provided
    if (autoHideSeconds) {
      setTimeout(() => this.removeAlert(alertId), autoHideSeconds * 1000);
    }
  }

  /**
   * Removes an alert by ID, only if it exists.
   * Sets hide to true for a fade-out transition before full removal.
   */
  removeAlert(alertId: string): void {
    const currentAlerts = this.alertsSubject.value;
    const alertEntry = currentAlerts.get(alertId);
    if (!alertEntry) {
      return; // Alert doesn't exist, do nothing
    }

    // Set hide to true to trigger fade-out animation
    alertEntry.hide = true;
    currentAlerts.set(alertId, alertEntry);
    this.alertsSubject.next(currentAlerts);

    // Wait for the fade-out animation to complete, then fully remove the alert
    setTimeout(() => {
      currentAlerts.delete(alertId);
      this.alertsSubject.next(currentAlerts);

      // Clean up alert reference
      const alertRef = this.alertRefs.get(alertId);
      if (alertRef) {
        alertRef.destroy();
        this.alertRefs.delete(alertId);
      }
    }, 1000); // Delay for the fade-out effect
  }

  /**
   * Updates an alert's inputs
   */
  updateAlert(
    alertId: string,
    inputs: { [key: string]: any }
  ): void {
    const currentAlerts = this.alertsSubject.value;
    const entry = currentAlerts.get(alertId);
    if (entry) {
      const newInputs = { ...entry.inputs, ...inputs };
      entry.inputs = newInputs;
      currentAlerts.set(alertId, entry);
      this.alertsSubject.next(currentAlerts);
    }
  }

  /**
   * Gets an alert reference by ID
   */
  getAlert(alertId: string): ComponentRef<any> | undefined {
    return this.alertRefs.get(alertId);
  }

  /**
   * Registers an alert reference (called by container)
   */
  registerAlertRef(alertId: string, alertRef: ComponentRef<any>): void {
    this.alertRefs.set(alertId, alertRef);
  }

  /**
   * Removes all alerts
   */
  clearAll(): void {
    this.alertsSubject.next(new Map());
    this.alertRefs.forEach(ref => ref.destroy());
    this.alertRefs.clear();
  }
}
