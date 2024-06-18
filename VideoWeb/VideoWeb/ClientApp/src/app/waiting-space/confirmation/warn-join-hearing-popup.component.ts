import { Component, EventEmitter, Input, Output } from '@angular/core';
import { YesNoPopupBaseDirective } from '../../shared/confirmation/yes-no-popup-base.component';
import { NotificationSoundsService } from '../services/notification-sounds.service';
import { FocusService } from 'src/app/services/focus.service';

@Component({
    selector: 'app-warn-join-hearing-popup',
    templateUrl: './warn-join-hearing-popup.component.html',
    styleUrls: ['../../shared/confirmation/yes-no-popup-base.component.scss']
})
export class WarnJoinHearingPopupComponent extends YesNoPopupBaseDirective {
    @Input() hearingStartTime: Date;
    @Output() popupAnswered = new EventEmitter<boolean>();

    constructor(
        protected focusService: FocusService,
        protected notificationSoundService: NotificationSoundsService
    ) {
        super(focusService);
    }

    submit(): void {
        this.notificationSoundService.initHearingAlertSound();
        this.notificationSoundService.initConsultationRequestRingtone();
        this.popupAnswered.emit(true);
    }
}
