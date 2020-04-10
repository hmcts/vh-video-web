import { Component, EventEmitter, Input, OnInit, Output, OnDestroy, HostListener } from '@angular/core';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import {
    ConferenceResponse,
    ParticipantResponse,
    TokenResponse,
    TestCallScoreResponse,
    TestScore,
    AddSelfTestFailureEventRequest,
    SelfTestFailureReason,
    SelfTestPexipResponse,
    Role
} from 'src/app/services/clients/api-client';
import { ErrorService } from 'src/app/services/error.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { UserMediaStreamService } from 'src/app/services/user-media-stream.service';
import { UserMediaService } from 'src/app/services/user-media.service';
import { SelectedUserMediaDevice } from '../../shared/models/selected-user-media-device';
import { Subscription } from 'rxjs';
import { Guid } from 'guid-typescript';
declare var PexRTC: any;

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
    pexipAPI: any;
    incomingStream: MediaStream;
    outgoingStream: MediaStream;

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

    constructor(
        private logger: Logger,
        private videoWebService: VideoWebService,
        private errorService: ErrorService,
        private userMediaService: UserMediaService,
        private userMediaStreamService: UserMediaStreamService
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
        return this.outgoingStream && this.outgoingStream.active && this.incomingStream && this.incomingStream.active;
    }

    async setupTestAndCall(): Promise<void> {
        this.logger.debug('setting up pexip client and call');
        this.setupPexipClient();
        try {
            this.token = await this.videoWebService.getSelfTestToken(this.selfTestParticipantId);
            this.logger.debug('retrieved token for self test');
            this.call();
        } catch (error) {
            this.errorService.handleApiError(error);
        }
    }

    async changeDevices() {
        this.disconnect();
        this.userMediaStreamService.stopStream(this.preferredMicrophoneStream);
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

    async updatePexipAudioVideoSource() {
        this.hasMultipleDevices = await this.userMediaService.hasMultipleDevices();

        const cam = await this.userMediaService.getPreferredCamera();
        if (cam) {
            this.pexipAPI.video_source = cam.deviceId;
        }

        const mic = await this.userMediaService.getPreferredMicrophone();
        if (mic) {
            this.pexipAPI.audio_source = mic.deviceId;
        }
        this.preferredMicrophoneStream = await this.userMediaStreamService.getStreamForMic(mic);
    }

    setupPexipClient() {
        const self = this;
        this.pexipAPI = new PexRTC();
        this.updatePexipAudioVideoSource();
        this.pexipAPI.onSetup = function (stream, pin_status, conference_extension) {
            self.logger.info('running pexip test call setup');
            self.outgoingStream = stream;
            this.connect('0000', null);
        };

        this.pexipAPI.onConnect = function (stream) {
            self.logger.info('successfully connected');
            self.incomingStream = stream;
            self.displayFeed = true;
            self.testStarted.emit();
        };

        this.pexipAPI.onError = function (reason) {
            self.displayFeed = false;
            self.logger.error('Error from pexip. Reason : ' + reason, reason);
            self.errorService.goToServiceError();
        };

        this.pexipAPI.onDisconnect = function (reason) {
            self.displayFeed = false;
            self.logger.info('Disconnected from pexip. Reason : ' + reason);
            if (reason === 'Conference terminated by another participant') {
                self.retrieveSelfTestScore();
            }
        };
    }

    async call() {
        this.didTestComplete = false;
        const conferenceAlias = 'testcall2';
        const tokenOptions = btoa(`${this.token.expires_on};${this.selfTestParticipantId};${this.token.token}`);
        this.pexipAPI.makeCall(this.selfTestPexipNode, `${conferenceAlias};${tokenOptions}`, this.selfTestParticipantId, this.maxBandwidth);
    }

    replayVideo() {
        this.logger.debug('replaying self test video');
        this.disconnect();
        this.call();
    }

    disconnect() {
        if (this.pexipAPI) {
            this.logger.info('disconnecting from pexip node');
            this.pexipAPI.disconnect();
        }
        this.closeStreams();
        this.incomingStream = null;
        this.outgoingStream = null;
        this.didTestComplete = true;
        this.displayFeed = false;
    }

    closeStreams() {
        if (this.preferredMicrophoneStream) {
            this.userMediaStreamService.stopStream(this.preferredMicrophoneStream);
        }
        this.preferredMicrophoneStream = null;
    }

    async retrieveSelfTestScore() {
        this.logger.debug('retrieving self test score');
        try {
            if (this.conference) {
                this.logger.info(`Self test : ConferenceId : ${this.conference.id} | retrieveSelfTestScore for Participant Id : ${
                    this.participant.id
                }
          | Participant : ${this.videoWebService.getObfuscatedName(this.participant.name)}`);
                this.testCallResult = await this.videoWebService.getTestCallScore(this.conference.id, this.selfTestParticipantId);
            } else {
                this.logger.info(`Self test : retrieveSelfTestScore for Participant Id : ${this.participant.id}
          | Participant : ${this.videoWebService.getObfuscatedName(this.participant.name)}`);
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
    }

    publishTestResult(): void {
        this.logger.info('test call completed');
        if (!this.didTestComplete) {
            this.disconnect();
        }
        this.testCompleted.emit(this.testCallResult);
    }

    @HostListener('window:beforeunload')
    async ngOnDestroy() {
        this.subscription.unsubscribe();
        this.disconnect();

        if (this.conference) {
            let reason: SelfTestFailureReason;
            if (this.testCallResult && this.testCallResult.score === TestScore.Bad) {
                reason = SelfTestFailureReason.BadScore;
            } else if (!this.testCallResult) {
                reason = SelfTestFailureReason.IncompleteTest;
            }

            if (reason) {
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
