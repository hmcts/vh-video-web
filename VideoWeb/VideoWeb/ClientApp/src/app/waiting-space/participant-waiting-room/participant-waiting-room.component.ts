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
import { UserMediaService } from 'src/app/services/user-media.service';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { Hearing } from '../../shared/models/hearing';
import { HeartbeatModelMapper } from '../../shared/mappers/heartbeat-model-mapper';
import { DeviceTypeService } from '../../services/device-type.service';

declare var PexRTC: any;
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
    pexipAPI: any;
    stream: MediaStream;
    connected: boolean;
    outgoingStream: MediaStream;

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

    clockSubscription: Subscription;
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
        private userMediaService: UserMediaService,
        private logger: Logger,
        private consultationService: ConsultationService,
        private router: Router,
        private heartbeatMapper: HeartbeatModelMapper,
        private deviceTypeService: DeviceTypeService
    ) {
        this.isAdminConsultation = false;
        this.loadingData = true;
        this.showVideo = false;
        this.showConsultationControls = false;
        this.selfViewOpen = false;
        this.showSelfView = false;
        this.isPrivateConsultation = false;
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
        if (this.pexipAPI) {
            this.logger.info('disconnecting from pexip node');
            this.pexipAPI.disconnect();
        }
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
            function() {
                self.currentPlayCount++;
                if (self.currentPlayCount <= 3) {
                    this.play();
                }
            },
            false
        );
    }

    subscribeToClock(): void {
        this.clockSubscription = this.clockService.getClock().subscribe(time => {
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
            this.clockSubscription.unsubscribe();
            this.router.navigate([PageUrls.ParticipantHearingList]);
        }
    }

    announceHearingIsAboutToStart(): void {
        const self = this;
        this.hearingAlertSound.play().catch(function(reason) {
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
                if (!this.errorService.returnHomeIfUnauthorised(error)) {
                    this.errorService.handleApiError(error);
                }
            });
    }

    async getJwtokenAndConnectToPexip(): Promise<void> {
        try {
            this.logger.debug('retrieving jwtoken');
            this.token = await this.videoWebService.getJwToken(this.participant.id);
            this.logger.debug('retrieved jwtoken for heartbeat');
            await this.setupPexipClient();
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
        this.eventService.getHearingStatusMessage().subscribe(message => {
            this.handleConferenceStatusChange(message);
            this.updateShowVideo();
        });

        this.logger.debug('Subscribing to participant status changes...');
        this.eventService.getParticipantStatusMessage().subscribe(message => {
            this.handleParticipantStatusChange(message);
            this.updateShowVideo();
        });

        this.logger.debug('Subscribing to admin consultation messages...');
        this.eventService.getAdminConsultationMessage().subscribe(message => {
            if (message.answer && message.answer === ConsultationAnswer.Accepted) {
                this.isAdminConsultation = true;
            }
        });

        this.logger.debug('Subscribing to EventHub disconnects');
        this.eventService.getServiceDisconnected().subscribe(attemptNumber => {
            this.handleEventHubDisconnection(attemptNumber);
        });

        this.logger.debug('Subscribing to EventHub reconnects');
        this.eventService.getServiceReconnected().subscribe(() => {
            this.logger.info(`EventHub re-connected for ${this.participant.id} in conference ${this.hearing.id}`);
            this.getConference().then(() => this.updateShowVideo());
        });

        this.eventService.start();
    }

    handleEventHubDisconnection(reconnectionAttempt: number) {
        if (reconnectionAttempt < 7) {
            this.logger.info(`EventHub disconnection for ${this.participant.id} in conference ${this.hearing.id}`);
            this.logger.info(`EventHub disconnection #${reconnectionAttempt}`);
            this.getConference().then(() => this.updateShowVideo());
        } else {
            this.logger.info(`EventHub disconnection too many times (#${reconnectionAttempt}), going to service error`);
            this.errorService.goToServiceError();
        }
    }

    handleParticipantStatusChange(message: ParticipantStatusMessage): any {
        const participant = this.hearing.getConference().participants.find(p => p.id === message.participantId);
        const isMe = participant.username.toLowerCase() === this.adalService.userInfo.userName.toLowerCase();
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
        this.logger.info(
            `Participant waiting room : Conference : ${this.conference.id}, Case name : ${this.conference.case_name}, Conference status : ${message.status}`
        );
        if (message.status === ConferenceStatus.Closed) {
            this.getConferenceClosedTime(this.hearing.id);
        }
    }

    async setupPexipClient() {
        this.logger.debug('Setting up pexip client...');
        const self = this;
        this.pexipAPI = new PexRTC();

        const preferredCam = await this.userMediaService.getPreferredCamera();
        if (preferredCam) {
            this.pexipAPI.video_source = preferredCam.deviceId;
            self.logger.info(
                `Participant waiting room : Conference : ${this.conference.id}, Case name : ${this.conference.case_name}, Using preferred camera: ${preferredCam.label}`
            );
        }

        const preferredMic = await this.userMediaService.getPreferredMicrophone();
        if (preferredMic) {
            this.pexipAPI.audio_source = preferredMic.deviceId;
            self.logger.info(
                `Participant waiting room : Conference : ${this.conference.id}, Case name : ${this.conference.case_name}, Using preferred microphone: ${preferredMic.label}`
            );
        }

        this.pexipAPI.onSetup = function (stream, pin_status, conference_extension) {
            self.logger.info('running pexip setup');
            this.connect('', null);
            self.outgoingStream = stream;
            this.showSelfView = true;
        };

        this.pexipAPI.onConnect = function (stream) {
            self.errorCount = 0;
            self.connected = true;
            self.logger.info('successfully connected to call');
            self.stream = stream;
            const incomingFeedElement = document.getElementById('incomingFeed') as any;
            if (stream) {
                self.updateShowVideo();
                if (incomingFeedElement) {
                    self.assignStream(incomingFeedElement, stream);
                }
            }

            const baseUrl = self.conference.pexip_node_uri.replace('sip.', '');
            const url = `https://${baseUrl}/virtual-court/api/v1/hearing/${self.conference.id}`;
            self.logger.debug(`heartbeat uri: ${url}`);
            const bearerToken = `Bearer ${self.token.token}`;
            self.heartbeat = new HeartbeatFactory(
                self.pexipAPI,
                url,
                self.conference.id,
                self.participant.id,
                bearerToken,
                self.handleHeartbeat(self)
            );
        };

        this.pexipAPI.onError = function(reason) {
            self.errorCount++;
            self.connected = false;
            self.heartbeat.kill();
            self.updateShowVideo();
            self.logger.error(`Error from pexip. Reason : ${reason}`, reason);
            if (self.errorCount > 3) {
                self.errorService.goToServiceError();
            }
        };

        this.pexipAPI.onDisconnect = function(reason) {
            self.connected = false;
            self.heartbeat.kill();
            self.updateShowVideo();
            self.logger.warn(`Disconnected from pexip. Reason : ${reason}`);
            if (!self.hearing.isPastClosedTime()) {
                self.callbackTimeout = setTimeout(() => {
                    self.call();
                }, self.CALL_TIMEOUT);
            }
        };
    }

    call() {
        console.warn('calling pexip');
        const pexipNode = this.hearing.getConference().pexip_node_uri;
        const conferenceAlias = this.hearing.getConference().participant_uri;
        const displayName = this.participant.tiled_display_name;
        this.logger.debug(`Calling ${pexipNode} - ${conferenceAlias} as ${displayName}`);
        this.pexipAPI.makeCall(pexipNode, conferenceAlias, displayName, this.maxBandwidth);
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

    assignStream(videoElement, stream) {
        if (typeof MediaStream !== 'undefined' && stream instanceof MediaStream) {
            videoElement.srcObject = stream;
        } else {
            videoElement.src = stream;
        }
    }

    handleHeartbeat(self: this) {
        return async function(heartbeat) {
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
}
