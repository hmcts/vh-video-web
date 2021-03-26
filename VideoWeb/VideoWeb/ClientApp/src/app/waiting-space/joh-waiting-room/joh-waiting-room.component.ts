import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ConferenceStatus } from 'src/app/services/clients/api-client';
import { ClockService } from 'src/app/services/clock.service';
import { DeviceTypeService } from 'src/app/services/device-type.service';
import { ErrorService } from 'src/app/services/error.service';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { ConferenceStatusMessage } from 'src/app/services/models/conference-status-message';
import { UserMediaStreamService } from 'src/app/services/user-media-stream.service';
import { UserMediaService } from 'src/app/services/user-media.service';
import { HeartbeatModelMapper } from 'src/app/shared/mappers/heartbeat-model-mapper';
import { NotificationSoundsService } from '../services/notification-sounds.service';
import { NotificationToastrService } from '../services/notification-toastr.service';
import { RoomClosingToastrService } from '../services/room-closing-toast.service';
import { VideoCallService } from '../services/video-call.service';
import { WaitingRoomBaseDirective } from '../waiting-room-shared/waiting-room-base.component';

@Component({
    selector: 'app-joh-waiting-room',
    templateUrl: './joh-waiting-room.component.html',
    styleUrls: ['../waiting-room-global-styles.scss', './joh-waiting-room.component.scss']
})
export class JohWaitingRoomComponent extends WaitingRoomBaseDirective implements OnInit, OnDestroy {
    private readonly loggerPrefixJOH = '[JOH WR] -';

    constructor(
        protected route: ActivatedRoute,
        protected videoWebService: VideoWebService,
        protected eventService: EventsService,
        protected logger: Logger,
        protected errorService: ErrorService,
        protected heartbeatMapper: HeartbeatModelMapper,
        protected videoCallService: VideoCallService,
        protected deviceTypeService: DeviceTypeService,
        protected router: Router,
        protected consultationService: ConsultationService,
        protected userMediaService: UserMediaService,
        protected userMediaStreamService: UserMediaStreamService,
        protected notificationSoundsService: NotificationSoundsService,
        protected notificationToastrService: NotificationToastrService,
        protected roomClosingToastrService: RoomClosingToastrService,
        protected clockService: ClockService,
        protected translateService: TranslateService
    ) {
        super(
            route,
            videoWebService,
            eventService,
            logger,
            errorService,
            heartbeatMapper,
            videoCallService,
            deviceTypeService,
            router,
            consultationService,
            userMediaService,
            userMediaStreamService,
            notificationSoundsService,
            notificationToastrService,
            roomClosingToastrService,
            clockService
        );
    }

    ngOnInit(): void {
        this.audioOnly = false;
        this.errorCount = 0;
        this.logger.debug(`${this.loggerPrefixJOH} Loading JOH waiting room`);
        this.connected = false;
        this.loggedInUser = this.route.snapshot.data['loggedUser'];
        this.notificationSoundsService.initHearingAlertSound();
        this.getConference().then(() => {
            this.subscribeToClock();
            this.startEventHubSubscribers();
            this.participant = this.setLoggedParticipant();
            this.getJwtokenAndConnectToPexip();
        });
    }

    getConferenceStatusText(): string {
        if (this.hearing.getConference().status === ConferenceStatus.NotStarted) {
            return '';
        } else if (this.hearing.isSuspended()) {
            return this.translateService.instant('joh-waiting-room.is-suspended');
        } else if (this.hearing.isPaused()) {
            return this.translateService.instant('joh-waiting-room.is-paused');
        } else if (this.hearing.isClosed()) {
            return this.translateService.instant('joh-waiting-room.is-closed');
        }
        return this.translateService.instant('joh-waiting-room.is-in-session');
    }

    getCurrentTimeClass() {
        if (this.hearing.isSuspended()) {
            return 'hearing-delayed';
        }
        return 'hearing-on-time';
    }

    handleConferenceStatusChange(message: ConferenceStatusMessage) {
        super.handleConferenceStatusChange(message);
        if (!this.validateIsForConference(message.conferenceId)) {
            return;
        }
        if (message.status === ConferenceStatus.InSession) {
            this.notificationSoundsService.playHearingAlertSound();
        } else {
            this.notificationSoundsService.stopHearingAlertSound();
        }
    }

    @HostListener('window:beforeunload')
    ngOnDestroy(): void {
        this.logger.debug(`${this.loggerPrefixJOH} Clearing intervals and subscriptions for JOH waiting room`, {
            conference: this.conference?.id
        });
        this.executeWaitingRoomCleanup();
    }
}
