import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Logger } from 'src/app/services/logging/logger-base';
import { PageTrackerService } from 'src/app/services/page-tracker.service';
import { SessionStorage } from 'src/app/services/session-storage';

@Component({
    selector: 'app-error-camera-microphone',
    templateUrl: './error-camera-microphone.component.html'
})
export class ErrorCameraMicrophoneComponent implements OnInit {
    deviceIsInUse = false;

    private readonly loggerPrefix = '[ErrorCameraMicrophonePage] -';
    readonly ERROR_CAMERA_MIC_MESSAGE_KEY = 'vh.error.camera.mic.message';
    errorMessage: SessionStorage<string>;
    errorMessageTitle: string;

    constructor(private router: Router, private pageTracker: PageTrackerService, private logger: Logger) {}

    ngOnInit(): void {
        this.deviceIsInUse = this.getErrorMessage();
    }

    private getErrorMessage(): boolean {
        this.errorMessage = new SessionStorage<string>(this.ERROR_CAMERA_MIC_MESSAGE_KEY);
        const errorType = this.errorMessage.get();
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
