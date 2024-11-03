import { Injectable, Type, ComponentRef } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface AlertEntry {
  alertId: string;
  componentType: Type<any>;
  inputs?: { [key: string]: any };
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
   */
  addAlert<T>(
    componentType: Type<T>,
    alertId: string,
    inputs?: { [key: string]: any }
  ): void {
    const currentAlerts = this.alertsSubject.value;
    currentAlerts.set(alertId, {
      alertId,
      componentType,
      inputs
    });
    this.alertsSubject.next(currentAlerts);
  }

  /**
   * Removes an alert by ID
   */
  removeAlert(alertId: string): void {
    const currentAlerts = this.alertsSubject.value;
    currentAlerts.delete(alertId);
    this.alertsSubject.next(currentAlerts);

    // Clean up alert reference
    const alertRef = this.alertRefs.get(alertId);
    if (alertRef) {
      alertRef.destroy();
      this.alertRefs.delete(alertId);
    }
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
      entry.inputs = { ...entry.inputs, ...inputs };
      currentAlerts.set(alertId, entry);
      this.alertsSubject.next(currentAlerts);

      // Update existing alert instance if it exists
      const alertRef = this.alertRefs.get(alertId);
      if (alertRef) {
        Object.keys(inputs).forEach(key => {
          alertRef.instance[key] = inputs[key];
        });
        alertRef.changeDetectorRef.detectChanges();
      }
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