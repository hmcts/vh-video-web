import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, Subject } from 'rxjs';
import { Logger } from 'src/app/services/logging/logger-base';
import { ConferenceState } from 'src/app/waiting-space/store/reducers/conference.reducer';
import * as ConferenceSelectors from '../../waiting-space/store/selectors/conference.selectors';
import { catchError, filter, take, takeUntil } from 'rxjs/operators';
import { VHConference, VHParticipant } from 'src/app/waiting-space/store/models/vh-conference';
import { ApiClient, SelfTestPexipResponse, TokenResponse } from 'src/app/services/clients/api-client';
import { UserMediaService } from 'src/app/services/user-media.service';
import { VideoFilterService } from 'src/app/services/video-filter.service';
import { UserMediaStreamServiceV2 } from 'src/app/services/user-media-stream-v2.service';
import { VideoCallService } from 'src/app/waiting-space/services/video-call.service';
import { Guid } from 'guid-typescript';
import { CallSetup, ConnectedCall, CallError, DisconnectedCall } from 'src/app/waiting-space/models/video-call-models';
import { ErrorService } from 'src/app/services/error.service';
import { SelfTestActions } from 'src/app/waiting-space/store/actions/self-test.actions';

@Component({
    selector: 'app-self-test-v2',
    standalone: false,
    templateUrl: './self-test-v2.component.html',
    styleUrl: './self-test-v2.component.scss'
})
export class SelfTestV2Component implements OnInit, OnDestroy {
    @Input() isIndependentTest = false;

    @Output() testStarted = new EventEmitter();
    @Output() testCompleted = new EventEmitter();

    @ViewChild('selfViewVideo', { static: false }) videoElement: ElementRef<HTMLVideoElement>;
    @ViewChild('incomingVideo', { static: false }) incomingVideoElement: ElementRef<HTMLVideoElement>;

    // used when a part of the journey
    conference: VHConference;
    participant: VHParticipant;
    // used for independent test
    selfTestPexipConfig: SelfTestPexipResponse;

    selfTestParticipantId: string;
    selfTestPexipNode: string;

    testInProgress = false;
    displayDeviceChangeModal = false;
    showChangeDevicesButton = false;

    displayConnecting = false;
    displayFeed = false;
    didTestComplete = false;

    token: TokenResponse;
    incomingStream: MediaStream;
    outgoingStream: MediaStream;
    preferredMicrophoneStream: MediaStream;

    maxBandwidth = 1280;
    testCallDetailsRetrieved: boolean;

    private onDestroy$ = new Subject<void>();
    private hasRefreshedStream = false;
    private streamInitialised: boolean;

    private readonly loggerPrefix = '[SelfTestV2] -';
    private readonly validDisconnectReasons = ['Conference terminated by another participant', 'Test call finished'];

    constructor(
        private userMediaService: UserMediaService,
        private userMediaStreamService: UserMediaStreamServiceV2,
        private videoFilterService: VideoFilterService,
        private apiClient: ApiClient,
        private videoCallService: VideoCallService,
        private conferenceStore: Store<ConferenceState>,
        private errorService: ErrorService,
        private logger: Logger
    ) {}

    get streamsActive() {
        let outgoingActive = true;
        outgoingActive = this.outgoingStream?.active;

        let incomingActive = true;
        if (this.incomingStream instanceof MediaStream) {
            incomingActive = this.incomingStream.active;
        }
        return this.outgoingStream && outgoingActive && this.incomingStream && incomingActive;
    }

    ngOnInit(): void {
        this.userMediaService.initialise();
        this.displayConnecting = true;

        this.userMediaService
            .hasMultipleDevices()
            .pipe(takeUntil(this.onDestroy$))
            .subscribe(result => {
                this.showChangeDevicesButton = result || this.videoFilterService.doesSupportVideoFiltering();
            });

        this.userMediaStreamService.isStreamInitialized$.pipe(takeUntil(this.onDestroy$)).subscribe(hasStreamInitialised => {
            this.logger.debug(`${this.loggerPrefix} Stream initialised: ${hasStreamInitialised}`);
            this.streamInitialised = hasStreamInitialised;
        });
        this.setupPexipSubscribers();

        if (this.isIndependentTest) {
            this.setupIndependentSelfTest();
        } else {
            this.setupSelfTest();
        }
    }

    ngOnDestroy(): void {
        this.onDestroy$.next();
        this.onDestroy$.complete();
        if (!this.didTestComplete) {
            this.videoCallService.disconnectFromCall();
        }
    }

    setupIndependentSelfTest() {
        this.logger.debug(`${this.loggerPrefix} Is an independent test, retrieving test call details`);
        return this.apiClient
            .getPexipConfig()
            .pipe(
                catchError(error => {
                    this.logger.error(`${this.loggerPrefix} Failed to retrieve pexip config`, error);
                    return [];
                })
            )
            .subscribe(response => {
                this.logger.debug(`${this.loggerPrefix} Pexip test call details retrieved`);
                this.selfTestPexipConfig = response;
                this.testCallDetailsRetrieved = true;
                this.selfTestParticipantId = Guid.create().toString();
                this.selfTestPexipNode = this.selfTestPexipConfig.pexip_self_test_node;
                this.startTestCall();
            });
    }

    setupSelfTest() {
        this.logger.debug(`${this.loggerPrefix} Retrieving conference and participant from store for self test`);
        const activeConference$ = this.conferenceStore.select(ConferenceSelectors.getActiveConference);
        const loggedInParticipant$ = this.conferenceStore.select(ConferenceSelectors.getLoggedInParticipant);
        return combineLatest([activeConference$, loggedInParticipant$])
            .pipe(
                filter(([activeConference, participant]) => !!activeConference && !!participant),
                take(1)
            )
            .subscribe(([conf, participant]) => {
                this.logger.debug(`${this.loggerPrefix} Conference and Participant loaded from store`);
                this.conference = conf;
                this.participant = participant;
                this.selfTestParticipantId = participant.id;
                this.selfTestPexipNode = this.conference.selfTestNodeUri;
                this.testCallDetailsRetrieved = true;
                this.startTestCall();
            });
    }

    async startTestCall() {
        if (!this.streamInitialised) {
            this.userMediaStreamService.createAndPublishStream();
            await this.setupPexipClient();
        }

        const token$ = this.apiClient.getSelfTestToken(this.selfTestParticipantId);
        const currentStream$ = this.userMediaStreamService.currentStream$.pipe(
            filter(stream => !!stream && stream.active),
            take(1)
        );

        combineLatest([token$, currentStream$]).subscribe(([token, stream]) => {
            this.logger.debug(`${this.loggerPrefix} Token and stream retrieved, starting self test call`);
            this.token = token;
            this.outgoingStream = stream;
            this.preferredMicrophoneStream = this.extractAudioFromOutoingStream();
            this.call();
        });
    }

    extractAudioFromOutoingStream(): MediaStream {
        const audioTracks = this.outgoingStream.getAudioTracks();
        return new MediaStream(audioTracks);
    }

    call() {
        this.logger.debug(`${this.loggerPrefix} Starting self test call`, {
            conference: this.conference?.id,
            participant: this.selfTestParticipantId
        });
        this.didTestComplete = false;
        const conferenceAlias = 'testcall2';
        const tokenOptions = btoa(`${this.token.expires_on};${this.selfTestParticipantId};${this.token.token}`);

        this.videoCallService
            .makeCall(
                this.selfTestPexipNode,
                `${conferenceAlias};${tokenOptions}`,
                this.selfTestParticipantId,
                this.maxBandwidth,
                this.conference?.id
            )
            .then(() => {
                this.logger.debug(`${this.loggerPrefix} Self test call made`, {
                    conference: this.conference?.id,
                    participant: this.selfTestParticipantId
                });
                this.displayConnecting = true;
            });
    }

    setupPexipSubscribers() {
        this.logger.debug(`${this.loggerPrefix} - Setting up pexip subscriptions`, {
            conference: this.conference?.id,
            participant: this.selfTestParticipantId
        });

        this.videoCallService
            .onCallSetup()
            .pipe(takeUntil(this.onDestroy$))
            .subscribe(setup => this.handleCallSetup(setup));

        this.videoCallService
            .onCallConnected()
            .pipe(takeUntil(this.onDestroy$))
            .subscribe(callConnected => this.handleCallConnected(callConnected));

        this.videoCallService
            .onError()
            .pipe(takeUntil(this.onDestroy$))
            .subscribe(callError => this.handleCallError(callError));

        this.videoCallService
            .onCallDisconnected()
            .pipe(takeUntil(this.onDestroy$))
            .subscribe(disconnectedCall => this.handleCallDisconnect(disconnectedCall));
    }

    async setupPexipClient() {
        this.logger.debug(`${this.loggerPrefix} Setting up pexip client`, {
            conference: this.conference?.id,
            participant: this.selfTestParticipantId
        });
        await this.videoCallService.setupClient(this.conference?.supplier);
    }

    handleCallSetup(callSetup: CallSetup) {
        this.logger.debug(`${this.loggerPrefix} Self test call has setup`, {
            conference: this.conference?.id,
            participant: this.selfTestParticipantId
        });
        this.outgoingStream = callSetup.stream as MediaStream;
        this.preferredMicrophoneStream = this.extractAudioFromOutoingStream();
        this.updateVideoElementWithStream(this.outgoingStream, this.videoElement);
        this.videoCallService.connect('0000', null);
    }

    handleCallConnected(callConnected: ConnectedCall) {
        this.logger.debug(`${this.loggerPrefix} Self test call has connected`, {
            conference: this.conference?.id,
            participant: this.selfTestParticipantId
        });
        this.incomingStream = callConnected.stream as MediaStream;
        this.displayFeed = true;
        this.displayConnecting = false;
        this.testInProgress = true;
        this.updateVideoElementWithStream(this.incomingStream, this.incomingVideoElement);

        if (!this.hasRefreshedStream && !this.streamInitialised) {
            // this affects FireFox and Safari
            this.logger.debug(`${this.loggerPrefix} Call connected, force stream refresh to trigger video to play.`);
            this.userMediaStreamService.createAndPublishStream();
            this.hasRefreshedStream = true;
        }

        this.testStarted.emit();
    }

    handleCallError(error: CallError) {
        this.displayFeed = false;
        this.logger.error(`${this.loggerPrefix} Error from pexip. Reason : ${error.reason}`, new Error(error.reason), {
            conference: this.conference?.id,
            participant: this.selfTestParticipantId,
            pexipError: error
        });
        this.testInProgress = false;
        this.errorService.handlePexipError(error, this.conference?.id);
    }

    handleCallDisconnect(reason: DisconnectedCall) {
        this.displayFeed = false;
        this.testInProgress = false;
        this.outgoingStream = null;
        this.incomingStream = null;
        this.hasRefreshedStream = false;
        this.logger.warn(`${this.loggerPrefix} Disconnected from pexip. Reason : ${reason.reason}`, {
            conference: this.conference?.id,
            participant: this.selfTestParticipantId,
            pexipDisconnectReason: reason
        });
        if (this.validDisconnectReasons.includes(reason.reason)) {
            this.didTestComplete = true;
            this.retrieveSelfTestScore();
            this.testCompleted.emit();
        }
    }

    updateVideoElementWithStream(stream: MediaStream, videoElement: ElementRef<HTMLVideoElement>) {
        if (videoElement?.nativeElement) {
            this.logger.debug(`${this.loggerPrefix} Updating video element with stream`, { videoElementId: videoElement.nativeElement.id });
            videoElement.nativeElement.srcObject = stream;
            videoElement.nativeElement.addEventListener('loadedmetadata', () => {
                videoElement.nativeElement.play().catch(error => this.logger.error(`${this.loggerPrefix} - Error playing video:`, error));
            });
        } else {
            this.logger.warn(`${this.loggerPrefix} Video element is not available to update with stream`);
        }
    }

    retrieveSelfTestScore() {
        this.logger.debug(`${this.loggerPrefix} Retrieving self test score`, {
            conference: this.conference?.id,
            participant: this.selfTestParticipantId
        });
        this.conferenceStore.dispatch(
            SelfTestActions.retrieveSelfTestScore({
                conferenceId: this.conference?.id,
                participantId: this.selfTestParticipantId,
                independent: this.isIndependentTest
            })
        );
    }

    displayChangeDevices() {
        this.logger.debug(`${this.loggerPrefix} Changing devices`, {
            conference: this.conference?.id,
            participant: this.selfTestParticipantId
        });

        this.displayDeviceChangeModal = true;
    }

    hideChangeDevices() {
        this.displayDeviceChangeModal = false;
    }
}
