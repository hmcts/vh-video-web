import { Component, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Guid } from 'guid-typescript';
import { Subscription } from 'rxjs';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import {
    AddSelfTestFailureEventRequest,
    ConferenceResponse,
    ParticipantResponse,
    Role,
    SelfTestFailureReason,
    SelfTestPexipResponse,
    TestCallScoreResponse,
    TestScore,
    TokenResponse
} from 'src/app/services/clients/api-client';
import { ErrorService } from 'src/app/services/error.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { UserMediaStreamService } from 'src/app/services/user-media-stream.service';
import { UserMediaService } from 'src/app/services/user-media.service';
import { CallError, CallSetup, ConnectedCall, DisconnectedCall } from 'src/app/waiting-space/models/video-call-models';
import { VideoCallService } from 'src/app/waiting-space/services/video-call.service';
import { SelectedUserMediaDevice } from '../models/selected-user-media-device';

@Component({
    selector: 'app-self-test',
    templateUrl: './self-test.component.html',
    styleUrls: ['./self-test.component.scss']
})
export class SelfTestComponent implements OnInit, OnDestroy {
    @Input() conference: ConferenceResponse;
    @Input() participant: ParticipantResponse;
    @Input() selfTestPexipConfig: SelfTestPexipResponse;

    @Output() testStarted = new EventEmitter();
    @Output() testCompleted = new EventEmitter<TestCallScoreResponse>();

    token: TokenResponse;
    incomingStream: MediaStream | URL;
    outgoingStream: MediaStream | URL;

    preferredMicrophoneStream: MediaStream;

    didTestComplete: boolean;
    displayFeed: boolean;

    displayDeviceChangeModal: boolean;
    hasMultipleDevices: boolean;

    testCallResult: TestCallScoreResponse = null;
    scoreSent: boolean;

    selfTestParticipantId: string;
    selfTestPexipNode: string;

    private maxBandwidth = 768;
    subscription: Subscription = new Subscription();
    videoCallSubscription$ = new Subscription();

    constructor(
        private logger: Logger,
        private videoWebService: VideoWebService,
        private errorService: ErrorService,
        private userMediaService: UserMediaService,
        private userMediaStreamService: UserMediaStreamService,
        private videoCallService: VideoCallService
    ) {
        this.didTestComplete = false;
    }

    async ngOnInit() {
        this.logger.debug('loading self test');

        this.initialiseData();

        this.displayFeed = false;
        this.displayDeviceChangeModal = false;
        this.scoreSent = false;
        this.setupSubscribers();
        this.setupTestAndCall();
    }

    initialiseData(): void {
        if (this.participant) {
            this.selfTestParticipantId = this.participant.id;
            this.logger.debug(this.selfTestParticipantId);
        } else {
            this.selfTestParticipantId = Guid.create().toString();
            this.logger.debug(this.selfTestParticipantId);
        }
        if (this.conference) {
            this.selfTestPexipNode = this.conference.pexip_self_test_node_uri;
        } else {
            this.selfTestPexipNode = this.selfTestPexipConfig.pexip_self_test_node;
        }
    }

    get streamsActive() {
        let outgoingActive = true;
        if (this.outgoingStream instanceof MediaStream) {
            outgoingActive = this.outgoingStream.active;
        }
        let incomingActive = true;
        if (this.incomingStream instanceof MediaStream) {
            incomingActive = this.incomingStream.active;
        }
        return this.outgoingStream && outgoingActive && this.incomingStream && incomingActive;
    }

    async setupTestAndCall(): Promise<void> {
        this.logger.debug('setting up pexip client and call');
        await this.setupPexipClient();
        try {
            this.token = await this.videoWebService.getSelfTestToken(this.selfTestParticipantId);
            this.logger.debug('retrieved token for self test');
            this.call();
        } catch (error) {
            this.errorService.handleApiError(error);
        }
    }

    changeDevices() {
        this.disconnect();
        this.userMediaStreamService.stopStream(this.preferredMicrophoneStream);
        this.preferredMicrophoneStream = null;
        this.displayDeviceChangeModal = true;
    }

    onMediaDeviceChangeCancelled() {
        this.displayDeviceChangeModal = false;
        this.call();
    }

    async onMediaDeviceChangeAccepted(selectedMediaDevice: SelectedUserMediaDevice) {
        this.displayDeviceChangeModal = false;
        this.userMediaService.updatePreferredCamera(selectedMediaDevice.selectedCamera);
        this.userMediaService.updatePreferredMicrophone(selectedMediaDevice.selectedMicrophone);
        await this.updatePexipAudioVideoSource();
        this.call();
    }

    setupSubscribers() {
        this.subscription.add(
            this.userMediaService.connectedDevices.subscribe(async () => {
                this.hasMultipleDevices = await this.userMediaService.hasMultipleDevices();
            })
        );
    }

    async setupPexipClient() {
        this.logger.debug('Setting up pexip client...');

        this.videoCallSubscription$.add(this.videoCallService.onCallSetup().subscribe(setup => this.handleCallSetup(setup)));
        this.videoCallSubscription$.add(
            this.videoCallService.onCallConnected().subscribe(callConnected => this.handleCallConnected(callConnected))
        );
        this.videoCallSubscription$.add(this.videoCallService.onError().subscribe(callError => this.handleCallError(callError)));
        this.videoCallSubscription$.add(
            this.videoCallService
                .onCallDisconnected()
                .subscribe(async disconnectedCall => await this.handleCallDisconnect(disconnectedCall))
        );

        await this.videoCallService.setupClient();
        this.updatePexipAudioVideoSource();
    }

    handleCallSetup(callSetup: CallSetup) {
        this.logger.info('running pexip test call setup');
        this.outgoingStream = callSetup.stream;
        this.videoCallService.connect('0000', null);
    }

    handleCallConnected(callConnected: ConnectedCall) {
        this.logger.info('successfully connected');
        this.incomingStream = callConnected.stream;
        this.displayFeed = true;
        this.testStarted.emit();
    }

    handleCallError(error: CallError) {
        this.displayFeed = false;
        this.logger.error('Error from pexip. Reason : ' + error.reason, error.reason);
        this.errorService.goToServiceError('Your connection was lost');
    }

    async handleCallDisconnect(reason: DisconnectedCall) {
        this.displayFeed = false;
        this.logger.info('Disconnected from pexip. Reason : ' + reason);
        if (reason.reason === 'Conference terminated by another participant') {
            await this.retrieveSelfTestScore();
        }
    }

    async updatePexipAudioVideoSource() {
        this.hasMultipleDevices = await this.userMediaService.hasMultipleDevices();

        const cam = await this.userMediaService.getPreferredCamera();
        if (cam) {
            this.videoCallService.updateCameraForCall(cam);
        }

        const mic = await this.userMediaService.getPreferredMicrophone();
        if (mic) {
            this.videoCallService.updateMicrophoneForCall(mic);
        }
        this.preferredMicrophoneStream = await this.userMediaStreamService.getStreamForMic(mic);
    }

    async call() {
        this.didTestComplete = false;
        const conferenceAlias = 'testcall2';
        const tokenOptions = btoa(`${this.token.expires_on};${this.selfTestParticipantId};${this.token.token}`);
        if (navigator.userAgent.toLowerCase().indexOf('firefox') !== -1) {
            this.videoCallService.enableH264(false);
        }
        this.videoCallService.makeCall(
            this.selfTestPexipNode,
            `${conferenceAlias};${tokenOptions}`,
            this.selfTestParticipantId,
            this.maxBandwidth
        );
    }

    replayVideo() {
        this.logger.debug('replaying self test video');
        this.disconnect();
        this.updatePexipAudioVideoSource();
        this.call();
    }

    disconnect() {
        this.videoCallService.disconnectFromCall();
        this.closeStreams();
        this.incomingStream = null;
        this.outgoingStream = null;
        this.didTestComplete = true;
        this.displayFeed = false;
    }

    closeStreams() {
        if (this.preferredMicrophoneStream) {
            this.userMediaStreamService.stopStream(this.preferredMicrophoneStream);
            this.preferredMicrophoneStream = null;
        }
        this.preferredMicrophoneStream = null;
    }

    async retrieveSelfTestScore() {
        this.logger.debug('retrieving self test score');
        try {
            if (this.conference && this.participant) {
                this.logger.info(`Self test : ConferenceId : ${this.conference.id} | retrieveSelfTestScore for Participant Id :
        ${this.participant.id}
          | Participant : ${this.videoWebService.getObfuscatedName(this.participant.display_name)}`);
                this.testCallResult = await this.videoWebService.getTestCallScore(this.conference.id, this.selfTestParticipantId);
            } else {
                this.logger.info(`Self test : independent retrieveSelfTestScore for Participant Id : ${this.selfTestParticipantId}`);
                this.testCallResult = await this.videoWebService.getIndependentTestCallScore(this.selfTestParticipantId);
            }

            this.logger.info(`test call score: ${this.testCallResult.score}`);
            if (this.testCallResult.score === TestScore.Bad) {
                await this.raiseFailedSelfTest(SelfTestFailureReason.BadScore);
            }
        } catch (err) {
            this.logger.error('there was a problem retrieving the self test score', err);
        }
        this.didTestComplete = true;
        this.publishTestResult();
    }

    publishTestResult(): void {
        this.logger.info('test call completed');
        this.testCompleted.emit(this.testCallResult);
    }

    @HostListener('window:beforeunload')
    async ngOnDestroy() {
        this.subscription.unsubscribe();
        this.videoCallSubscription$.unsubscribe();
        this.disconnect();

        if (this.conference) {
            let reason: SelfTestFailureReason;
            if (this.testCallResult && this.testCallResult.score === TestScore.Bad) {
                reason = SelfTestFailureReason.BadScore;
                await this.raiseFailedSelfTest(reason);
            }
        }
    }

    async raiseFailedSelfTest(reason: SelfTestFailureReason) {
        if (this.scoreSent) {
            return;
        }

        const request = new AddSelfTestFailureEventRequest({
            self_test_failure_reason: reason
        });
        if (this.conference && this.participant.role !== Role.Judge) {
            try {
                await this.videoWebService.raiseSelfTestFailureEvent(this.conference.id, request);
                this.logger.info(`Notified failed self test because of ${reason}`);
                this.scoreSent = true;
            } catch (err) {
                this.logger.error('There was a problem raising a failed self test event', err);
            }
        }
    }
}
