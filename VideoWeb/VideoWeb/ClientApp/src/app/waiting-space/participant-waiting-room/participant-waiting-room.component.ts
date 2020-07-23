import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AdalService } from 'adal-angular4';
import { Subscription } from 'rxjs';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ConferenceStatus, ParticipantStatus } from 'src/app/services/clients/api-client';
import { ClockService } from 'src/app/services/clock.service';
import { ErrorService } from 'src/app/services/error.service';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { ConferenceStatusMessage } from 'src/app/services/models/conference-status-message';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { DeviceTypeService } from '../../services/device-type.service';
import { HeartbeatModelMapper } from '../../shared/mappers/heartbeat-model-mapper';
import { Hearing } from '../../shared/models/hearing';
import { CallError, ConnectedCall, DisconnectedCall, ParticipantUpdated } from '../models/video-call-models';
import { VideoCallService } from '../services/video-call.service';
import { WaitingRoomBaseComponent } from '../waiting-room-shared/waiting-room-base.component';

declare var HeartbeatFactory: any;

@Component({
    selector: 'app-participant-waiting-room',
    templateUrl: './participant-waiting-room.component.html',
    styleUrls: ['./participant-waiting-room.component.scss']
})
export class ParticipantWaitingRoomComponent extends WaitingRoomBaseComponent implements OnInit, OnDestroy {
    currentTime: Date;
    hearingStartingAnnounced: boolean;
    currentPlayCount: number;
    hearingAlertSound: HTMLAudioElement;

    isPrivateConsultation: boolean;
    audioMuted: boolean;
    handRaised: boolean;
    remoteMuted: boolean;

    clockSubscription$: Subscription;

    CALL_TIMEOUT = 31000; // 31 seconds
    callbackTimeout: NodeJS.Timer;

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
        private consultationService: ConsultationService,
        private clockService: ClockService
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
            router
        );
        this.isPrivateConsultation = false;
        this.handRaised = false;
    }

    get handToggleText(): string {
        if (this.handRaised) {
            return 'Lower my hand';
        } else {
            return 'Raise my hand';
        }
    }

    ngOnInit() {
        this.errorCount = 0;
        this.logger.debug('Loading participant waiting room');
        this.connected = false;
        this.initHearingAlert();
        this.getConference().then(() => {
            this.subscribeToClock();
            this.startEventHubSubscribers();
            this.getJwtokenAndConnectToPexip();
        });
    }

    @HostListener('window:beforeunload')
    ngOnDestroy(): void {
        clearTimeout(this.callbackTimeout);
        if (this.heartbeat) {
            this.heartbeat.kill();
        }
        this.disconnect();
    }

    initHearingAlert() {
        this.hearingStartingAnnounced = false;
        this.currentPlayCount = 1;

        this.hearingAlertSound = new Audio();
        this.hearingAlertSound.src = '/assets/audio/hearing_starting_soon.mp3';
        this.hearingAlertSound.load();
        const self = this;
        this.hearingAlertSound.addEventListener(
            'ended',
            function () {
                self.currentPlayCount++;
                if (self.currentPlayCount <= 3) {
                    this.play();
                }
            },
            false
        );
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

    announceHearingIsAboutToStart(): void {
        const self = this;
        this.hearingAlertSound.play().catch(function (reason) {
            self.logger.error('Failed to announce hearing starting', reason);
        });
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

    handleConferenceStatusChange(message: ConferenceStatusMessage) {
        super.handleConferenceStatusChange(message);
        if (message.status === ConferenceStatus.Closed) {
            this.getConferenceClosedTime(this.hearing.id);
        }
    }

    handleCallConnected(callConnected: ConnectedCall) {
        super.handleCallConnected(callConnected);
        this.setupParticipantHeartbeat();
    }

    handleCallError(error: CallError) {
        super.handleCallError(error);
        this.heartbeat.kill();
    }

    handleCallDisconnect(reason: DisconnectedCall) {
        super.handleCallDisconnect(reason);
        this.heartbeat.kill();
        if (!this.hearing.isPastClosedTime()) {
            this.callbackTimeout = setTimeout(() => {
                this.call();
            }, this.CALL_TIMEOUT);
        }
    }

    handleParticipantUpdatedInVideoCall(updatedParticipant: ParticipantUpdated): boolean {
        if (super.handleParticipantUpdatedInVideoCall(updatedParticipant)) {
            this.handRaised = updatedParticipant.handRaised;
            return true;
        }
        return false;
    }

    updateShowVideo(): void {
        if (!this.connected) {
            this.logger.debug('Not showing video because not connecting to node');
            this.showSelfView = false;
            this.showVideo = false;
            this.showConsultationControls = false;
            this.isPrivateConsultation = false;
            return;
        }

        if (this.hearing.isInSession()) {
            this.logger.debug('Showing video because hearing is in session');
            this.showSelfView = true;
            this.showVideo = true;
            this.showConsultationControls = false;
            this.isPrivateConsultation = false;
            return;
        }

        if (this.participant.status === ParticipantStatus.InConsultation) {
            this.logger.debug('Showing video because hearing is in session');
            this.resetMute();
            this.showSelfView = true;
            this.showVideo = true;
            this.isPrivateConsultation = true;
            this.showConsultationControls = !this.isAdminConsultation;
            return;
        }

        this.logger.debug('Not showing video because hearing is not in session and user is not in consultation');
        this.showSelfView = false;
        this.showVideo = false;
        this.showConsultationControls = false;
        this.isPrivateConsultation = false;
    }

    async onConsultationCancelled() {
        this.logger.info(
            `Participant waiting room : Conference : ${this.conference.id}, Case name : ${this.conference.case_name}. Participant ${this.participant.id} attempting to leave conference: ${this.conference.id}`
        );
        try {
            await this.consultationService.leaveConsultation(this.conference, this.participant);
        } catch (error) {
            this.logger.error('Failed to leave private consultation', error);
        }
    }

    toggleView(): boolean {
        return (this.selfViewOpen = !this.selfViewOpen);
    }

    async getConferenceClosedTime(conferenceId: string): Promise<void> {
        try {
            this.conference = await this.videoWebService.getConferenceById(conferenceId);
            this.hearing = new Hearing(this.conference);
            this.participant = this.conference.participants.find(
                x => x.username.toLowerCase() === this.adalService.userInfo.userName.toLowerCase()
            );
            this.logger.info(
                `Participant waiting room : Conference with id ${conferenceId} closed | Participant Id : ${this.participant.id}, ${this.participant.display_name}.`
            );
        } catch (error) {
            this.logger.error(`There was an error getting a conference ${conferenceId}`, error);
        }
    }

    getCurrentTimeClass() {
        if (this.hearing.isOnTime() || this.hearing.isPaused() || this.hearing.isClosed()) {
            return 'hearing-on-time';
        }
        if (this.hearing.isStarting()) {
            return 'hearing-near-start';
        }
        if (this.hearing.isDelayed() || this.hearing.isSuspended()) {
            return 'hearing-delayed';
        }
    }

    toggleHandRaised() {
        if (this.handRaised) {
            this.logger.debug('lowering hand');
            this.videoCallService.lowerHand();
        } else {
            this.logger.debug('raising hand');
            this.videoCallService.raiseHand();
        }
        this.handRaised = !this.handRaised;
    }
}
