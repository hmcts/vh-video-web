import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AdalService } from 'adal-angular4';
import { Subscription } from 'rxjs';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import {
    ConferenceResponse,
    ConferenceStatus,
    ConsultationAnswer,
    ParticipantResponse,
    ParticipantStatus,
    TokenResponse
} from 'src/app/services/clients/api-client';
import { ClockService } from 'src/app/services/clock.service';
import { ErrorService } from 'src/app/services/error.service';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { ConferenceStatusMessage } from 'src/app/services/models/conference-status-message';
import { ParticipantStatusMessage } from 'src/app/services/models/participant-status-message';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { DeviceTypeService } from '../../services/device-type.service';
import { HeartbeatModelMapper } from '../../shared/mappers/heartbeat-model-mapper';
import { Hearing } from '../../shared/models/hearing';
import { CallError, CallSetup, ConnectedCall, DisconnectedCall } from '../models/video-call-models';
import { VideoCallService } from '../services/video-call.service';

declare var HeartbeatFactory: any;

@Component({
    selector: 'app-participant-waiting-room',
    templateUrl: './participant-waiting-room.component.html',
    styleUrls: ['./participant-waiting-room.component.scss']
})
export class ParticipantWaitingRoomComponent implements OnInit, OnDestroy {
    private maxBandwidth = 768;

    loadingData: boolean;
    hearing: Hearing;
    participant: ParticipantResponse;
    conference: ConferenceResponse;
    token: TokenResponse;

    stream: MediaStream | URL;
    connected: boolean;
    outgoingStream: MediaStream | URL;

    currentTime: Date;
    hearingStartingAnnounced: boolean;
    currentPlayCount: number;
    hearingAlertSound: HTMLAudioElement;

    showVideo: boolean;
    showSelfView: boolean;
    showConsultationControls: boolean;
    isPrivateConsultation: boolean;
    selfViewOpen: boolean;
    isAdminConsultation: boolean;
    audioMuted: boolean;

    clockSubscription$: Subscription;
    eventHubSubscription$ = new Subscription();
    videoCallSubscription$ = new Subscription();
    errorCount: number;

    CALL_TIMEOUT = 31000; // 31 seconds
    callbackTimeout: NodeJS.Timer;
    heartbeat: any;

    constructor(
        private route: ActivatedRoute,
        private videoWebService: VideoWebService,
        private eventService: EventsService,
        private adalService: AdalService,
        private errorService: ErrorService,
        private clockService: ClockService,
        private logger: Logger,
        private consultationService: ConsultationService,
        private router: Router,
        private heartbeatMapper: HeartbeatModelMapper,
        private deviceTypeService: DeviceTypeService,
        private videoCallService: VideoCallService
    ) {
        this.isAdminConsultation = false;
        this.loadingData = true;
        this.showVideo = false;
        this.showConsultationControls = false;
        this.selfViewOpen = false;
        this.showSelfView = false;
        this.isPrivateConsultation = false;
        this.audioMuted = false;
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

    disconnect() {
        this.videoCallService.disconnectFromCall();
        this.stream = null;
        this.outgoingStream = null;
        this.connected = false;
        this.showVideo = false;
        this.showSelfView = false;
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

    async getConference() {
        const conferenceId = this.route.snapshot.paramMap.get('conferenceId');
        return this.videoWebService
            .getConferenceById(conferenceId)
            .then((data: ConferenceResponse) => {
                this.errorCount = 0;
                this.loadingData = false;
                this.hearing = new Hearing(data);
                this.conference = this.hearing.getConference();
                this.participant = data.participants.find(
                    x => x.username.toLowerCase() === this.adalService.userInfo.userName.toLowerCase()
                );
                this.logger.info(`Participant waiting room : Conference Id: ${conferenceId} and participantId: ${this.participant.id},
          participant name : ${this.videoWebService.getObfuscatedName(this.participant.name)}`);
            })
            .catch(error => {
                this.logger.error(`There was an error getting a conference ${conferenceId}`, error);
                this.loadingData = false;
                this.errorService.handleApiError(error);
            });
    }

    async getJwtokenAndConnectToPexip(): Promise<void> {
        try {
            this.logger.debug('retrieving jwtoken');
            this.token = await this.videoWebService.getJwToken(this.participant.id);
            this.logger.debug('retrieved jwtoken for heartbeat');
            await this.setupPexipEventSubscriptionAndClient();
            this.call();
        } catch (error) {
            this.logger.error(`There was an error getting a jwtoken for ${this.participant.id}`, error);
            this.errorService.handleApiError(error);
        }
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

    startEventHubSubscribers() {
        this.logger.debug('Subscribing to conference status changes...');
        this.eventHubSubscription$.add(
            this.eventService.getHearingStatusMessage().subscribe(message => {
                this.handleConferenceStatusChange(message);
                this.updateShowVideo();
            })
        );

        this.logger.debug('Subscribing to participant status changes...');
        this.eventHubSubscription$.add(
            this.eventService.getParticipantStatusMessage().subscribe(message => {
                this.handleParticipantStatusChange(message);
                this.updateShowVideo();
            })
        );

        this.logger.debug('Subscribing to admin consultation messages...');
        this.eventHubSubscription$.add(
            this.eventService.getAdminConsultationMessage().subscribe(message => {
                if (message.answer && message.answer === ConsultationAnswer.Accepted) {
                    this.isAdminConsultation = true;
                }
            })
        );

        this.logger.debug('Subscribing to EventHub disconnects');
        this.eventHubSubscription$.add(
            this.eventService.getServiceDisconnected().subscribe(async attemptNumber => {
                await this.handleEventHubDisconnection(attemptNumber);
            })
        );

        this.logger.debug('Subscribing to EventHub reconnects');
        this.eventHubSubscription$.add(
            this.eventService.getServiceReconnected().subscribe(() => {
                this.logger.info(`EventHub re-connected for ${this.participant.id} in conference ${this.hearing.id}`);
                this.getConference().then(() => this.updateShowVideo());
            })
        );

        this.eventService.start();
    }

    async handleEventHubDisconnection(reconnectionAttempt: number) {
        if (reconnectionAttempt < 7) {
            this.logger.info(`EventHub disconnection for ${this.participant.id} in conference ${this.hearing.id}`);
            this.logger.info(`EventHub disconnection #${reconnectionAttempt}`);
            try {
                await this.getConference();
                this.updateShowVideo();
            } catch (error) {
                this.errorService.handleApiError(error);
            }
        } else {
            this.logger.info(`EventHub disconnection too many times (#${reconnectionAttempt}), going to service error`);
            this.errorService.goToServiceError('Your connection was lost');
        }
    }

    handleParticipantStatusChange(message: ParticipantStatusMessage): any {
        const participant = this.hearing.getConference().participants.find(p => p.id === message.participantId);
        const isMe = participant.username.toLowerCase() === this.adalService.userInfo.userName.toLowerCase();
        if (isMe) {
            this.participant.status = message.status;
        }
        participant.status = message.status;
        this.logger.info(
            `Participant waiting room : Conference : ${this.conference.id}, Case name : ${this.conference.case_name}, Participant status : ${participant.status}`
        );
        if (message.status !== ParticipantStatus.InConsultation && isMe) {
            this.isAdminConsultation = false;
        }
    }

    handleConferenceStatusChange(message: ConferenceStatusMessage) {
        this.hearing.getConference().status = message.status;
        this.conference.status = message.status;
        this.logger.info(
            `Participant waiting room : Conference : ${this.conference.id}, Case name : ${this.conference.case_name}, Conference status : ${message.status}`
        );
        if (message.status === ConferenceStatus.Closed) {
            this.getConferenceClosedTime(this.hearing.id);
        }
    }

    setupParticipantHeartbeat() {
        const baseUrl = this.conference.pexip_node_uri.replace('sip.', '');
        const url = `https://${baseUrl}/virtual-court/api/v1/hearing/${this.conference.id}`;
        this.logger.debug(`heartbeat uri: ${url}`);
        const bearerToken = `Bearer ${this.token.token}`;
        this.heartbeat = new HeartbeatFactory(
            this.videoCallService.pexipAPI,
            url,
            this.conference.id,
            this.participant.id,
            bearerToken,
            this.handleHeartbeat(this)
        );
    }

    async setupPexipEventSubscriptionAndClient() {
        this.logger.debug('Setting up pexip client...');

        this.videoCallSubscription$.add(this.videoCallService.onCallSetup().subscribe(setup => this.handleCallSetup(setup)));
        this.videoCallSubscription$.add(
            this.videoCallService.onCallConnected().subscribe(callConnected => this.handleCallConnected(callConnected))
        );
        this.videoCallSubscription$.add(this.videoCallService.onError().subscribe(callError => this.handleCallError(callError)));
        this.videoCallSubscription$.add(
            this.videoCallService.onCallDisconnected().subscribe(disconnectedCall => this.handleCallDisconnect(disconnectedCall))
        );

        await this.videoCallService.setupClient();
    }

    handleCallSetup(callSetup: CallSetup) {
        this.logger.info('running pexip setup');
        this.videoCallService.connect('', null);
        this.outgoingStream = callSetup.stream;
    }

    handleCallConnected(callConnected: ConnectedCall) {
        this.errorCount = 0;
        this.connected = true;
        this.logger.info('successfully connected to call');
        this.stream = callConnected.stream;
        const incomingFeedElement = document.getElementById('incomingFeed') as any;
        if (this.stream) {
            this.updateShowVideo();
            if (incomingFeedElement) {
                this.assignStream(incomingFeedElement, callConnected.stream);
            }
        }
        this.setupParticipantHeartbeat();
    }

    handleCallError(error: CallError) {
        this.errorCount++;
        this.connected = false;
        this.heartbeat.kill();
        this.updateShowVideo();
        this.logger.error(`Error from pexip. Reason : ${error.reason}`, error.reason);
        if (this.errorCount > 3) {
            this.errorService.goToServiceError('Your connection was lost');
        }
    }

    handleCallDisconnect(reason: DisconnectedCall) {
        this.connected = false;
        this.heartbeat.kill();
        this.updateShowVideo();
        this.logger.warn(`Disconnected from pexip. Reason : ${reason.reason}`);
        if (!this.hearing.isPastClosedTime()) {
            this.callbackTimeout = setTimeout(() => {
                this.call();
            }, this.CALL_TIMEOUT);
        }
    }

    call() {
        this.logger.info('calling pexip');
        const pexipNode = this.hearing.getConference().pexip_node_uri;
        const conferenceAlias = this.hearing.getConference().participant_uri;
        const displayName = this.participant.tiled_display_name;
        this.logger.debug(`Calling ${pexipNode} - ${conferenceAlias} as ${displayName}`);
        if (navigator.userAgent.toLowerCase().indexOf('firefox') !== -1) {
            this.videoCallService.enableH264(false);
        }
        this.videoCallService.makeCall(pexipNode, conferenceAlias, displayName, this.maxBandwidth);
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
            this.resetMute();
            this.showConsultationControls = false;
            this.isPrivateConsultation = false;
            return;
        }

        if (this.participant.status === ParticipantStatus.InConsultation) {
            this.logger.debug('Showing video because hearing is in session');
            this.showSelfView = true;
            this.showVideo = true;
            this.resetMute();
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

    assignStream(videoElement, stream) {
        if (typeof MediaStream !== 'undefined' && stream instanceof MediaStream) {
            videoElement.srcObject = stream;
        } else {
            videoElement.src = stream;
        }
    }

    handleHeartbeat(self: this) {
        return async function (heartbeat) {
            const heartbeatModel = self.heartbeatMapper.map(
                JSON.parse(heartbeat),
                self.deviceTypeService.getBrowserName(),
                self.deviceTypeService.getBrowserVersion()
            );

            await self.eventService.sendHeartbeat(self.hearing.id, self.participant.id, heartbeatModel);
        };
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

    /**
     *Unmutes participants
     **/
    resetMute() {
        if (this.audioMuted) {
            this.muteUnmuteCall();
        }
    }
    muteUnmuteCall() {
        const muteAudio = this.videoCallService.toggleMute();
        this.logger.info('Participant mute status :' + muteAudio);
        this.audioMuted = muteAudio;
    }
}
