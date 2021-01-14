import { HostListener } from '@angular/core';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AdalService } from 'adal-angular4';
import { Subscription } from 'rxjs';
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
import { pageUrls } from 'src/app/shared/page-url.constants';
import { NotificationSoundsService } from '../services/notification-sounds.service';
import { VideoCallService } from '../services/video-call.service';
import { WaitingRoomBaseComponent } from '../waiting-room-shared/waiting-room-base.component';

@Component({
    selector: 'app-joh-waiting-room',
    templateUrl: './joh-waiting-room.component.html',
    styleUrls: ['../waiting-room-global-styles.scss']
})
export class JohWaitingRoomComponent extends WaitingRoomBaseComponent implements OnInit, OnDestroy {
    private readonly loggerPrefixJOH = '[JOH WR] -';

    hearingStartingAnnounced: boolean;
    clockSubscription$: Subscription;
    currentTime: Date;

    constructor(
        protected route: ActivatedRoute,
        protected videoWebService: VideoWebService,
        protected eventService: EventsService,
        protected adalService: AdalService,
        protected logger: Logger,
        protected errorService: ErrorService,
        protected heartbeatMapper: HeartbeatModelMapper,
        protected videoCallService: VideoCallService,
        protected deviceTypeService: DeviceTypeService,
        protected router: Router,
        protected consultationService: ConsultationService,
        private clockService: ClockService,
        protected userMediaService: UserMediaService,
        protected userMediaStreamService: UserMediaStreamService,
        protected notificationSoundsService: NotificationSoundsService
    ) {
        super(
            route,
            videoWebService,
            eventService,
            adalService,
            logger,
            errorService,
            heartbeatMapper,
            videoCallService,
            deviceTypeService,
            router,
            consultationService,
            userMediaService,
            userMediaStreamService,
            notificationSoundsService
        );
    }

    ngOnInit(): void {
        this.audioOnly = false;
        this.errorCount = 0;
        this.logger.debug(`${this.loggerPrefixJOH} Loading JOH waiting room`);
        this.connected = false;
        this.notificationSoundsService.initHearingAlertSound();
        this.getConference().then(() => {
            this.subscribeToClock();
            this.startEventHubSubscribers();
            this.getJwtokenAndConnectToPexip();
        });
    }

    subscribeToClock(): void {
        this.clockSubscription$ = this.clockService.getClock().subscribe(time => {
            this.currentTime = time;
            this.checkIfHearingIsClosed();
            this.checkIfHearingIsStarting();
        });
    }

    checkIfHearingIsStarting(): void {
        if (this.hearing.isStarting() && !this.hearingStartingAnnounced) {
            this.announceHearingIsAboutToStart();
        }
    }

    checkIfHearingIsClosed(): void {
        if (this.hearing.isPastClosedTime()) {
            this.clockSubscription$.unsubscribe();
            this.router.navigate([pageUrls.ParticipantHearingList]);
        }
    }

    async announceHearingIsAboutToStart(): Promise<void> {
        this.hearingStartingAnnounced = true;
        await this.notificationSoundsService.playHearingAlertSound();
    }

    getConferenceStatusText(): string {
        if (this.hearing.getConference().status === ConferenceStatus.NotStarted) {
            return '';
        } else if (this.hearing.isSuspended()) {
            return 'is suspended';
        } else if (this.hearing.isPaused()) {
            return 'is paused';
        } else if (this.hearing.isClosed()) {
            return 'is closed';
        }
        return 'is in session';
    }

    getCurrentTimeClass() {
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
