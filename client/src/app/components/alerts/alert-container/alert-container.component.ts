import { Component, ViewContainerRef, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { AlertEntry, AlertService } from 'src/app/services/alert.service';

@Component({
  selector: 'app-alert-container',
  templateUrl: './alert-container.component.html',
  styleUrls: ['./alert-container.component.scss'],
})
export class AlertContainerComponent implements OnInit, OnDestroy {
  private subscription?: Subscription;
  private alertRefs = new Map<string, any>(); // To track alert components by ID

  // Use @ViewChild to capture the alertsHost as a ViewContainerRef
  @ViewChild('alertsHost', { read: ViewContainerRef, static: true })
  alertsHost!: ViewContainerRef;

  constructor(
    private alertService: AlertService
  ) {}

  ngOnInit() {
    this.subscription = this.alertService.alerts$.subscribe(alerts => {
      this.updateAlerts(alerts);
    });
  }

  private updateAlerts(alerts: Map<string, AlertEntry>) {
    // Remove alerts that no longer exist
    Array.from(this.alertRefs.keys()).forEach(alertId => {
      if (!alerts.has(alertId)) {
        this.alertRefs.get(alertId).destroy();
        this.alertRefs.delete(alertId);
      }
    });

    // Add or update alerts
    alerts.forEach((entry, alertId) => {
      if (this.alertRefs.has(alertId)) {
        // Update existing alert inputs if necessary
        const alertRef = this.alertRefs.get(alertId);
        if (entry.inputs) {
          Object.keys(entry.inputs).forEach(key => {
            alertRef.instance[key] = entry.inputs![key];
          });
        }
        alertRef.changeDetectorRef.detectChanges();
      } else {
        // Create new alert component inside the alertsHost container
        const alertRef = this.alertsHost.createComponent(entry.componentType);

        // Set inputs
        if (entry.inputs) {
          Object.keys(entry.inputs).forEach(key => {
            alertRef.instance[key] = entry.inputs![key];
          });
        }

        // Save the reference
        this.alertRefs.set(alertId, alertRef);

        // Register alert reference with service
        this.alertService.registerAlertRef(alertId, alertRef);

        alertRef.changeDetectorRef.detectChanges();
      }
    });
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
    this.alertRefs.forEach(ref => ref.destroy()); // Clean up all created components
  }
}