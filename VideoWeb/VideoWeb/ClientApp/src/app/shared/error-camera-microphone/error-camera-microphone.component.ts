import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Logger } from 'src/app/services/logging/logger-base';
import { PageTrackerService } from 'src/app/services/page-tracker.service';
import { ErrorService } from 'src/app/services/error.service';

@Component({
    selector: 'app-error-camera-microphone',
    templateUrl: './error-camera-microphone.component.html'
})
export class ErrorCameraMicrophoneComponent implements OnInit {
    deviceIsInUse = false;

    private readonly loggerPrefix = '[ErrorCameraMicrophonePage] -';

    constructor(
        private router: Router,
        private pageTracker: PageTrackerService,
        private logger: Logger,
        private errorService: ErrorService
    ) {}

    ngOnInit(): void {
        this.deviceIsInUse = this.getErrorMessage();
    }

    private getErrorMessage(): boolean {
        const errorType = this.errorService.getMediaDeviceErrorMessageTypeFromStorage();
        return errorType === 'DevicesInUse';
    }

    continue() {
        const previousPage = this.pageTracker.getPreviousUrl();
        this.logger.debug(`${this.loggerPrefix} Navigating to previous page`, {
            returnUrl: previousPage
        });
        this.router.navigate([previousPage]);
    }
}
