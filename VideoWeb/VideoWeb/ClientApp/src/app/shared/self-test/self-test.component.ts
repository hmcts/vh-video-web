import { Component, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Guid } from 'guid-typescript';
import { Subject, Subscription } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
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
import { MediaStreamService } from 'src/app/services/media-stream.service';
import { UserMediaService } from 'src/app/services/user-media.service';
import { CallError, CallSetup, ConnectedCall, DisconnectedCall } from 'src/app/waiting-space/models/video-call-models';
import { VideoCallService } from 'src/app/waiting-space/services/video-call.service';

@Component({
    selector: 'app-self-test',
    templateUrl: './self-test.component.html',
    styleUrls: ['./self-test.component.scss']
})
export class SelfTestComponent implements OnInit, OnDestroy {
    private readonly loggerPrefix = '[SelfTest] -';
    @Input() conference: ConferenceResponse;
    @Input() participant: ParticipantResponse;
    @Input() selfTestPexipConfig: SelfTestPexipResponse;

    @Output() testStarted = new EventEmitter();
    @Output() testCompleted = new EventEmitter<TestCallScoreResponse>();

    token: TokenResponse;
    incomingStream: MediaStream | URL;
    outgoingStream: MediaStream | URL;

    preferredMicrophoneStream: MediaStream;

    didTestComplete = false;
    displayFeed = false;

    displayDeviceChangeModal = false;
    hasMultipleDevices = false;

    testCallResult: TestCallScoreResponse = null;
    scoreSent = false;

    selfTestParticipantId: string;
    selfTestPexipNode: string;

    maxBandwidth = 1280;
    subscription: Subscription = new Subscription();
    videoCallSubscription$ = new Subscription();
    private destroyedSubject = new Subject();

    constructor(
        private logger: Logger,
        private videoWebService: VideoWebService,
        private errorService: ErrorService,
        private userMediaService: UserMediaService,
        private mediaStreamService: MediaStreamService,
        private videoCallService: VideoCallService,
        private navigator: Navigator
    ) {}

    ngOnInit() {
        this.logger.debug(`${this.loggerPrefix} Loading self test`);

        this.initialiseData();

        this.userMediaService.connectedDevices$.pipe(take(1)).subscribe({
            next: () => {
                this.displayFeed = false;
                this.displayDeviceChangeModal = false;
                this.scoreSent = false;
                this.setupSubscribers();
                this.setupTestAndCall();
            },
            error: error => {
                this.logger.error(`${this.loggerPrefix} Failed to initialise the self-test`, error, {
                    conference: this.conference?.id,
                    participant: this.selfTestParticipantId
                });
                this.errorService.handlePexipError(new CallError(error.name), this.conference?.id);
            }
        });
    }

    initialiseData(): void {
        if (this.participant) {
            this.selfTestParticipantId = this.participant.id;
        } else {
            this.selfTestParticipantId = Guid.create().toString();
        }
        this.logger.debug(`${this.loggerPrefix} Participant id for test ${this.selfTestParticipantId}`, {
            conference: this.conference?.id,
            participant: this.selfTestParticipantId
        });
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
        this.logger.debug(`${this.loggerPrefix} Setting up pexip client and calling testCall`, {
            conference: this.conference?.id,
            participant: this.selfTestParticipantId
        });
        await this.setupPexipClient();
        try {
            this.token = await this.videoWebService.getSelfTestToken(this.selfTestParticipantId);
            this.logger.debug(`${this.loggerPrefix} Retrieved token for self test`, {
                conference: this.conference?.id,
                participant: this.selfTestParticipantId
            });
            this.call();
        } catch (error) {
            this.errorService.handleApiError(error);
        }
    }

    changeDevices() {
        this.logger.debug(`${this.loggerPrefix} Changing devices`, {
            conference: this.conference?.id,
            participant: this.selfTestParticipantId
        });

        this.disconnect();

        this.displayDeviceChangeModal = true;
    }

    onSelectMediaDeviceShouldClose() {
        this.call();

        this.userMediaService.activeMicrophoneDevice$.pipe(take(1)).subscribe(mic =>
            this.mediaStreamService
                .getStreamForMic(mic)
                .pipe(take(1))
                .subscribe(micStream => (this.preferredMicrophoneStream = micStream))
        );

        this.displayDeviceChangeModal = false;
    }

    setupSubscribers() {
        this.userMediaService.activeMicrophoneDevice$
            .pipe(takeUntil(this.destroyedSubject))
            .subscribe(mic =>
                this.mediaStreamService.getStreamForMic(mic).subscribe(micStream => (this.preferredMicrophoneStream = micStream))
            );

        this.userMediaService
            .hasMultipleDevices()
            .pipe(takeUntil(this.destroyedSubject))
            .subscribe(result => {
                this.hasMultipleDevices = result;
            });
    }

    async setupPexipClient() {
        this.logger.debug(`${this.loggerPrefix} - Setting up pexip client and subscriptions`, {
            conference: this.conference?.id,
            participant: this.selfTestParticipantId
        });

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
        this.logger.debug(`${this.loggerPrefix} Self test call has setup`, {
            conference: this.conference?.id,
            participant: this.selfTestParticipantId
        });
        this.outgoingStream = callSetup.stream;
        this.videoCallService.connect('0000', null);
    }

    handleCallConnected(callConnected: ConnectedCall) {
        this.logger.debug(`${this.loggerPrefix} Self test call has connected`, {
            conference: this.conference?.id,
            participant: this.selfTestParticipantId
        });
        this.incomingStream = callConnected.stream;
        this.displayFeed = true;
        this.testStarted.emit();
    }

    handleCallError(error: CallError) {
        this.displayFeed = false;
        this.logger.error(`${this.loggerPrefix} Error from pexip. Reason : ${error.reason}`, new Error(error.reason), {
            conference: this.conference?.id,
            participant: this.selfTestParticipantId,
            pexipError: error
        });
        this.errorService.handlePexipError(error, this.conference?.id);
    }

    async handleCallDisconnect(reason: DisconnectedCall) {
        this.displayFeed = false;
        this.logger.warn(`${this.loggerPrefix} Disconnected from pexip. Reason : ${reason.reason}`, {
            conference: this.conference?.id,
            participant: this.selfTestParticipantId,
            pexipDisconnectReason: reason
        });
        if (reason.reason === 'Conference terminated by another participant') {
            await this.retrieveSelfTestScore();
        }
    }

    async call() {
        this.logger.debug(`${this.loggerPrefix} Starting self test call`, {
            conference: this.conference?.id,
            participant: this.selfTestParticipantId
        });
        this.didTestComplete = false;
        const conferenceAlias = 'testcall2';
        const tokenOptions = btoa(`${this.token.expires_on};${this.selfTestParticipantId};${this.token.token}`);
        if (this.navigator.userAgent.toLowerCase().indexOf('firefox') !== -1) {
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
        this.logger.debug(`${this.loggerPrefix} Replaying self test video`, {
            conference: this.conference?.id,
            participant: this.selfTestParticipantId
        });
        this.disconnect();
        this.call();
    }

    disconnect() {
        this.logger.debug(`${this.loggerPrefix} Manually disconnecting from self test`, {
            conference: this.conference?.id,
            participant: this.selfTestParticipantId
        });
        try {
            this.videoCallService.disconnectFromCall();
        } catch (error) {
            this.logger.warn(
                `${this.loggerPrefix} Attempted to disconnect from pexip before the client had initialised. Moving on from self-test`
            );
        } finally {
            this.closeMicStreams();
            this.incomingStream = null;
            this.outgoingStream = null;
            this.didTestComplete = true;
            this.displayFeed = false;
        }
    }

    closeMicStreams() {
        this.mediaStreamService.stopStream(this.preferredMicrophoneStream);
        this.preferredMicrophoneStream = null;
    }

    async retrieveSelfTestScore() {
        try {
            if (this.conference && this.participant) {
                this.logger.debug(
                    `${this.loggerPrefix} Retrieving self test score for participant ${this.videoWebService.getObfuscatedName(
                        this.participant.display_name
                    )}`,
                    {
                        conference: this.conference?.id,
                        participant: this.selfTestParticipantId
                    }
                );

                this.testCallResult = await this.videoWebService.getTestCallScore(this.conference.id, this.selfTestParticipantId);
            } else {
                this.logger.debug(`${this.loggerPrefix} Retrieving independent self test score`, {
                    conference: this.conference?.id,
                    participant: this.selfTestParticipantId
                });
                this.testCallResult = await this.videoWebService.getIndependentTestCallScore(this.selfTestParticipantId);
            }

            this.logger.info(`${this.loggerPrefix} Test call score: ${this.testCallResult.score}`, {
                conference: this.conference?.id,
                participant: this.selfTestParticipantId
            });
            if (this.testCallResult.score === TestScore.Bad) {
                await this.raiseFailedSelfTest(SelfTestFailureReason.BadScore);
            }
        } catch (err) {
            this.logger.error(`${this.loggerPrefix} There was a problem retrieving the self test score`, err, {
                conference: this.conference?.id,
                participant: this.selfTestParticipantId,
                error: err
            });
        }
        this.didTestComplete = true;
        this.publishTestResult();
    }

    publishTestResult(): void {
        this.logger.info(`${this.loggerPrefix} Test call completed`, {
            conference: this.conference?.id,
            participant: this.selfTestParticipantId
        });
        this.testCompleted.emit(this.testCallResult);
    }

    @HostListener('window:beforeunload')
    async ngOnDestroy() {
        this.subscription.unsubscribe();
        this.videoCallSubscription$.unsubscribe();
        this.disconnect();

        this.destroyedSubject.next();
        this.destroyedSubject.complete();
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

        this.logger.info(`${this.loggerPrefix} Raising failed self test score event because ${reason}`, {
            conference: this.conference?.id,
            participant: this.selfTestParticipantId
        });
        const request = new AddSelfTestFailureEventRequest({
            self_test_failure_reason: reason
        });
        if (this.conference && this.participant.role !== Role.Judge) {
            try {
                await this.videoWebService.raiseSelfTestFailureEvent(this.conference.id, request);
                this.logger.info(`${this.loggerPrefix} Notified failed self test because of ${reason}`, {
                    conference: this.conference?.id,
                    participant: this.selfTestParticipantId
                });
                this.scoreSent = true;
            } catch (err) {
                this.logger.error(`${this.loggerPrefix} There was a problem raising a failed self test event`, err, {
                    conference: this.conference?.id,
                    participant: this.selfTestParticipantId,
                    error: err
                });
            }
        }
    }
}
