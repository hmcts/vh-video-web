import { ActivatedRoute, Router } from '@angular/router';
import { AdalService } from 'adal-angular4';
import { Subscription } from 'rxjs';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import {
    ConferenceResponse,
    ConferenceStatus,
    ConsultationAnswer,
    ParticipantResponse,
    ParticipantStatus,
    TokenResponse
} from 'src/app/services/clients/api-client';
import { DeviceTypeService } from 'src/app/services/device-type.service';
import { ErrorService } from 'src/app/services/error.service';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { ConferenceStatusMessage } from 'src/app/services/models/conference-status-message';
import { ParticipantStatusMessage } from 'src/app/services/models/participant-status-message';
import { HeartbeatModelMapper } from 'src/app/shared/mappers/heartbeat-model-mapper';
import { Hearing } from 'src/app/shared/models/hearing';
import { CallError, CallSetup, ConnectedCall, DisconnectedCall } from '../models/video-call-models';
import { VideoCallService } from '../services/video-call.service';

declare var HeartbeatFactory: any;

export abstract class WaitingRoomBaseComponent {
    protected maxBandwidth = 768;

    loadingData: boolean;
    errorCount: number;
    hearing: Hearing;
    participant: ParticipantResponse;
    conference: ConferenceResponse;
    token: TokenResponse;

    eventHubSubscription$ = new Subscription();
    videoCallSubscription$ = new Subscription();
    heartbeat: any;

    stream: MediaStream | URL;
    connected: boolean;
    outgoingStream: MediaStream | URL;

    showVideo: boolean;
    isAdminConsultation: boolean;
    showConsultationControls: boolean;

    CALL_TIMEOUT = 31000; // 31 seconds
    callbackTimeout: NodeJS.Timer;

    protected constructor(
        protected route: ActivatedRoute,
        protected videoWebService: VideoWebService,
        protected eventService: EventsService,
        protected adalService: AdalService,
        protected logger: Logger,
        protected errorService: ErrorService,
        protected heartbeatMapper: HeartbeatModelMapper,
        protected videoCallService: VideoCallService,
        protected deviceTypeService: DeviceTypeService,
        protected router: Router
    ) {
        this.isAdminConsultation = false;
        this.loadingData = true;
        this.showVideo = false;
        this.showConsultationControls = false;
    }

    abstract updateShowVideo(): void;

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

    get isSupportedBrowserForNetworkHealth(): boolean {
        if (!this.deviceTypeService.isSupportedBrowser()) {
            return false;
        }
        const unsupportedBrowsers = ['Safari', 'MS-Edge'];
        const browser = this.deviceTypeService.getBrowserName();
        return unsupportedBrowsers.findIndex(x => x.toUpperCase() === browser.toUpperCase()) < 0;
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

    disconnect() {
        this.videoCallService.disconnectFromCall();
        this.stream = null;
        this.outgoingStream = null;
        this.connected = false;
        this.showVideo = false;
    }

    assignStream(videoElement, stream) {
        if (typeof MediaStream !== 'undefined' && stream instanceof MediaStream) {
            videoElement.srcObject = stream;
        } else {
            videoElement.src = stream;
        }
    }

    handleCallSetup(callSetup: CallSetup) {
        this.logger.info('running pexip setup');
        this.videoCallService.connect('', null);
        this.outgoingStream = callSetup.stream;
    }

    handleCallConnected(callConnected: ConnectedCall): void {
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

    handleCallError(error: CallError): void {
        this.heartbeat.kill();
        this.errorCount++;
        this.connected = false;
        this.updateShowVideo();
        this.logger.error(`Error from pexip. Reason : ${error.reason}`, error.reason);
        if (this.errorCount > 3) {
            this.errorService.goToServiceError('Your connection was lost');
        }
    }

    handleCallDisconnect(reason: DisconnectedCall): void {
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

    handleConferenceStatusChange(message: ConferenceStatusMessage) {
        if (!this.validateIsForConference(message.conferenceId)) {
            return;
        }
        this.hearing.getConference().status = message.status;
        this.conference.status = message.status;
        this.logger.info(
            `Participant waiting room : Conference : ${this.conference.id}, Case name : ${this.conference.case_name}, Conference status : ${message.status}`
        );
        if (message.status === ConferenceStatus.Closed) {
            this.getConferenceClosedTime(this.hearing.id);
        }
    }

    handleParticipantStatusChange(message: ParticipantStatusMessage): void {
        if (!this.validateIsForConference(message.conferenceId)) {
            return;
        }
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

    private validateIsForConference(conferenceId: string): boolean {
        if (conferenceId !== this.hearing.id) {
            this.logger.info('message not for current conference');
            return false;
        }
        return true;
    }
}
