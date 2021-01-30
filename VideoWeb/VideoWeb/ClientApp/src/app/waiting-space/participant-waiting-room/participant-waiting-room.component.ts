import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AdalService } from 'adal-angular4';
import { Subscription } from 'rxjs';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ConferenceStatus } from 'src/app/services/clients/api-client';
import { ClockService } from 'src/app/services/clock.service';
import { ErrorService } from 'src/app/services/error.service';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { DeviceTypeService } from '../../services/device-type.service';
import { HeartbeatModelMapper } from '../../shared/mappers/heartbeat-model-mapper';
import { VideoCallService } from '../services/video-call.service';
import { WaitingRoomBaseComponent } from '../waiting-room-shared/waiting-room-base.component';
import { UserMediaService } from 'src/app/services/user-media.service';
import { UserMediaStreamService } from 'src/app/services/user-media-stream.service';
import { HearingRole } from '../models/hearing-role-model';
import { NotificationSoundsService } from '../services/notification-sounds.service';
import { ConferenceStatusMessage } from 'src/app/services/models/conference-status-message';

@Component({
    selector: 'app-participant-waiting-room',
    templateUrl: './participant-waiting-room.component.html',
    styleUrls: ['./participant-waiting-room.component.scss', '../waiting-room-global-styles.scss']
})
export class ParticipantWaitingRoomComponent extends WaitingRoomBaseComponent implements OnInit, OnDestroy {
    currentTime: Date;
    hearingStartingAnnounced: boolean;

    clockSubscription$: Subscription;

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

    ngOnInit() {
        this.audioOnly = this.videoCallService.retrieveVideoCallPreferences().audioOnly;
        this.errorCount = 0;
        this.logger.debug('[Participant WR] - Loading participant waiting room');
        this.connected = false;
        this.notificationSoundsService.initHearingAlertSound();
        this.getConference().then(() => {
            this.subscribeToClock();
            this.startEventHubSubscribers();
            (async () => {
                const loggedParticipant = await this.videoWebService.getCurrentParticipant(this.conferenceId);
                this.participant = this.conference.participants.find(x => x.id === loggedParticipant.participant_id);

                this.getJwtokenAndConnectToPexip();
            })();
        });
    }

    @HostListener('window:beforeunload')
    ngOnDestroy(): void {
        this.logger.debug('[Participant WR] - Clearing intervals and subscriptions for participant waiting room', {
            conference: this.conference?.id
        });
        this.executeWaitingRoomCleanup();
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
        await this.notificationSoundsService.playHearingAlertSound();
        this.hearingStartingAnnounced = true;
    }

    getConferenceStatusText(): string {
        if (this.hearing.getConference().status === ConferenceStatus.NotStarted) {
            if (this.hearing.isStarting()) {
                return 'is about to begin';
            } else if (this.hearing.isDelayed()) {
                return 'is delayed';
            } else {
                return '';
            }
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
        if (!this.isWitness && (this.hearing.isOnTime() || this.hearing.isPaused() || this.hearing.isClosed())) {
            return 'hearing-on-time';
        }
        if (!this.isWitness && (this.hearing.isStarting() || this.hearing.isInSession())) {
            return 'hearing-near-start';
        }
        if (!this.isWitness && this.hearing.isDelayed()) {
            return 'hearing-delayed';
        }
        if (this.hearing.isSuspended()) {
            return 'hearing-delayed';
        }
        if (this.isWitness && this.hearing.isInSession()) {
            return 'hearing-near-start';
        } else {
            return 'hearing-on-time';
        }
    }

    get isWitness(): boolean {
        return this.participant?.hearing_role === HearingRole.WITNESS;
    }

    handleConferenceStatusChange(message: ConferenceStatusMessage) {
        super.handleConferenceStatusChange(message);
        if (!this.validateIsForConference(message.conferenceId)) {
            return;
        }
        if (message.status === ConferenceStatus.InSession && !this.isWitness) {
            this.notificationSoundsService.playHearingAlertSound();
        } else {
            this.notificationSoundsService.stopHearingAlertSound();
        }
    }
}
