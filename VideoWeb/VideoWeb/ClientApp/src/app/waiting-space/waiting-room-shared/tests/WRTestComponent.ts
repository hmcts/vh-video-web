import { Router } from '@angular/router';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import { ClockService } from 'src/app/services/clock.service';
import { DeviceTypeService } from 'src/app/services/device-type.service';
import { ErrorService } from 'src/app/services/error.service';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { VideoCallService } from '../../services/video-call.service';
import { WaitingRoomBaseDirective } from '../waiting-room-base.component';
import { NotificationToastrService } from 'src/app/waiting-space/services/notification-toastr.service';
import { ConsultationInvitationService } from '../../services/consultation-invitation.service';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { HideComponentsService } from '../../services/hide-components.service';
import { FocusService } from 'src/app/services/focus.service';
import { MockStore } from '@ngrx/store/testing';
import { ConferenceState } from '../../store/reducers/conference.reducer';
import { VideoCallEventsService } from '../../services/video-call-events.service';

@Component({
    standalone: false,
    selector: 'app-test-waiting-room',
    template: `
        <div>
            <button id="consultation-leave-button" #leaveButton>Leave</button>
        </div>
    `
})
export class WRTestComponent extends WaitingRoomBaseDirective {
    @ViewChild('leaveButton', { static: true }) leaveButton: ElementRef;

    constructor(
        protected eventService: EventsService,
        protected logger: Logger,
        protected errorService: ErrorService,
        protected videoCallService: VideoCallService,
        protected deviceTypeService: DeviceTypeService,
        protected router: Router,
        protected consultationService: ConsultationService,
        protected notificationToastrService: NotificationToastrService,
        protected clockService: ClockService,
        protected consultationInvitiationService: ConsultationInvitationService,
        protected hideComponentsService: HideComponentsService,
        protected focusService: FocusService,
        protected store: MockStore<ConferenceState>,
        protected videoCallEventsService: VideoCallEventsService
    ) {
        super(
            eventService,
            logger,
            errorService,
            videoCallService,
            deviceTypeService,
            router,
            consultationService,
            notificationToastrService,
            clockService,
            consultationInvitiationService,
            hideComponentsService,
            focusService,
            store,
            videoCallEventsService
        );
    }
}
