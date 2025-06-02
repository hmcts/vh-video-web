import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';

import { SelfTestV2Component } from './self-test-v2.component';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { VHConference, VHParticipant } from 'src/app/waiting-space/store/models/vh-conference';
import { ConferenceState } from 'src/app/waiting-space/store/reducers/conference.reducer';
import { MockComponent, MockDirective, MockPipe } from 'ng-mocks';
import { MicVisualiserComponent } from '../mic-visualiser/mic-visualiser.component';
import { SelectMediaDevicesComponent } from '../select-media-devices/select-media-devices.component';
import { ForcePlayVideoDirective } from '../force-play-video.directive';
import { TranslatePipe } from '@ngx-translate/core';
import { Logger } from 'src/app/services/logging/logger-base';
import { MockLogger } from 'src/app/testing/mocks/mock-logger';
import { UserMediaService } from 'src/app/services/user-media.service';
import { UserMediaStreamServiceV2 } from 'src/app/services/user-media-stream-v2.service';
import { ApiClient, Role, SelfTestPexipResponse, TokenResponse } from 'src/app/services/clients/api-client';
import { ErrorService } from 'src/app/services/error.service';
import { VideoFilterService } from 'src/app/services/video-filter.service';
import { VideoCallService } from 'src/app/waiting-space/services/video-call.service';
import { mapConferenceToVHConference } from 'src/app/waiting-space/store/models/api-contract-to-state-model-mappers';
import { BehaviorSubject, ReplaySubject, Subject, of } from 'rxjs';
import { getSpiedPropertyGetter } from '../jasmine-helpers/property-helpers';
import { UserMediaDevice } from '../models/user-media-device';
import {
    onConnectedSubjectMock,
    onDisconnectedSubjectMock,
    onErrorSubjectMock,
    onSetupSubjectMock,
    videoCallServiceSpy
} from 'src/app/testing/mocks/mock-video-call.service';
import { ElementRef } from '@angular/core';
import * as ConferenceSelectors from '../../waiting-space/store/selectors/conference.selectors';
import { SelfTestActions } from 'src/app/waiting-space/store/actions/self-test.actions';
import { CallError, CallSetup, ConnectedCall, DisconnectedCall } from 'src/app/waiting-space/models/video-call-models';

describe('SelfTestV2Component', () => {
    let component: SelfTestV2Component;
    let fixture: ComponentFixture<SelfTestV2Component>;

    let videoElementRefMock: ElementRef<HTMLVideoElement>;

    const testData = new ConferenceTestData();
    let conference: VHConference;
    let loggedInParticipant: VHParticipant;
    let mockStore: MockStore<ConferenceState>;

    let userMediaService: jasmine.SpyObj<UserMediaService>;
    let connectedDevicesSubject: Subject<UserMediaDevice[]>;
    let currentStreamSubject: Subject<MediaStream>;
    let streamInitialisedSubject: Subject<boolean>;
    let cameraAndMicrophoneStream = new MediaStream();

    let userMediaStreamService: jasmine.SpyObj<UserMediaStreamServiceV2>;
    let videoFilterService: jasmine.SpyObj<VideoFilterService>;
    let apiClient: jasmine.SpyObj<ApiClient>;
    let videoCallService: jasmine.SpyObj<VideoCallService>;
    let errorService: jasmine.SpyObj<ErrorService>;

    const token = new TokenResponse({
        expires_on: '02.06.2020-21:06Z',
        token: '3a9643611de98e66979bf9519c33fc8d28c39100a4cdc29aaf1b6041b9e16e45'
    });

    beforeAll(() => {
        conference = mapConferenceToVHConference(testData.getConferenceDetailNow());
        loggedInParticipant = conference.participants.find(x => x.role === Role.Individual);
        videoElementRefMock = {
            nativeElement: document.createElement('video')
        };

        errorService = jasmine.createSpyObj<ErrorService>(['handleApiError', 'handlePexipError']);

        userMediaService = jasmine.createSpyObj<UserMediaService>(['hasMultipleDevices', 'initialise'], ['connectedDevices$']);
        userMediaService.hasMultipleDevices.and.returnValue(of(true));

        connectedDevicesSubject = new Subject<UserMediaDevice[]>();

        userMediaStreamService = jasmine.createSpyObj<UserMediaStreamServiceV2>(
            ['createAndPublishStream'],
            ['currentStream$', 'isStreamInitialized$']
        );
        currentStreamSubject = new ReplaySubject<MediaStream>(1);
        getSpiedPropertyGetter(userMediaStreamService, 'currentStream$').and.returnValue(currentStreamSubject.asObservable());
        streamInitialisedSubject = new BehaviorSubject<boolean>(false);
        getSpiedPropertyGetter(userMediaStreamService, 'isStreamInitialized$').and.returnValue(streamInitialisedSubject.asObservable());
        userMediaStreamService.createAndPublishStream.and.callFake(() => streamInitialisedSubject.next(true));

        videoCallService = videoCallServiceSpy;
        videoCallService.makeCall.and.resolveTo();

        cameraAndMicrophoneStream = new MediaStream();
        spyOnProperty(cameraAndMicrophoneStream, 'active').and.returnValue(true);

        videoFilterService = jasmine.createSpyObj<VideoFilterService>(['doesSupportVideoFiltering']);
        videoFilterService.doesSupportVideoFiltering.and.returnValue(false);

        apiClient = jasmine.createSpyObj<ApiClient>(['getPexipConfig', 'getSelfTestToken']);

        apiClient.getSelfTestToken.and.returnValue(of(token));
        apiClient.getPexipConfig.and.returnValue(
            of(
                new SelfTestPexipResponse({
                    pexip_self_test_node: 'selftest.vh-video.com'
                })
            )
        );
    });

    beforeEach(async () => {
        currentStreamSubject.next();
        streamInitialisedSubject.next(false);

        await TestBed.configureTestingModule({
            declarations: [
                SelfTestV2Component,
                MockComponent(MicVisualiserComponent),
                MockComponent(SelectMediaDevicesComponent),
                MockDirective(ForcePlayVideoDirective),
                MockPipe(TranslatePipe)
            ],
            providers: [
                { provide: UserMediaService, useValue: userMediaService },
                { provide: UserMediaStreamServiceV2, useValue: userMediaStreamService },
                { provide: VideoFilterService, useValue: videoFilterService },
                { provide: ApiClient, useValue: apiClient },
                { provide: VideoCallService, useValue: videoCallService },
                { provide: ErrorService, useValue: errorService },
                { provide: Logger, useValue: new MockLogger() },
                provideMockStore()
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(SelfTestV2Component);
        component = fixture.componentInstance;
        component.videoElement = videoElementRefMock;

        mockStore = TestBed.inject(MockStore);
    });

    afterEach(() => {
        component.ngOnDestroy();
    });

    afterAll(() => {
        mockStore.resetSelectors();
    });

    describe('onInit', () => {
        beforeEach(() => {
            spyOn(component, 'updateVideoElementWithStream').and.callFake(() => {});

            apiClient.getPexipConfig.calls.reset();
            apiClient.getSelfTestToken.calls.reset();
            videoCallService.setupClient.calls.reset();
            videoCallService.makeCall.calls.reset();

            currentStreamSubject.next(cameraAndMicrophoneStream);
        });

        describe('isIndependentTest true', () => {
            beforeEach(async () => {
                component.isIndependentTest = true;

                fixture.detectChanges();
                await fixture.whenStable();
            });

            it('should retrieve pexip config and start test call', () => {
                expect(apiClient.getPexipConfig).toHaveBeenCalledTimes(1);
                expect(apiClient.getSelfTestToken).toHaveBeenCalledTimes(1);
                expect(videoCallService.setupClient).toHaveBeenCalledTimes(1);
                expect(videoCallService.makeCall).toHaveBeenCalledTimes(1);

                expect(component.conference).toBeUndefined();
                expect(component.participant).toBeUndefined();
            });
        });

        describe('isIndependentTest false', () => {
            beforeEach(async () => {
                component.isIndependentTest = false;
                mockStore.overrideSelector(ConferenceSelectors.getActiveConference, conference);
                mockStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, loggedInParticipant);
                fixture.detectChanges();
                await fixture.whenStable();
            });

            it('should create', () => {
                expect(component.conference).toBeDefined();
                expect(component.participant).toBeDefined();
                expect(apiClient.getSelfTestToken).toHaveBeenCalledTimes(1);
                expect(videoCallService.setupClient).toHaveBeenCalledTimes(1);
                expect(videoCallService.makeCall).toHaveBeenCalledTimes(1);
            });
        });
    });

    describe('Change Devices Modal', () => {
        it('should show the change devices modal', () => {
            component.displayChangeDevices();

            expect(component.displayDeviceChangeModal).toBeTrue();
        });

        it('should hide the change devices modal', () => {
            component.hideChangeDevices();

            expect(component.displayDeviceChangeModal).toBeFalse();
        });
    });

    describe('retrieveSelfTestScore', () => {
        it('should dispatch action to retrieve score', () => {
            component.conference = conference;
            component.participant = loggedInParticipant;
            component.selfTestParticipantId = loggedInParticipant.id;
            component.isIndependentTest = false;

            spyOn(mockStore, 'dispatch');

            component.retrieveSelfTestScore();

            expect(mockStore.dispatch).toHaveBeenCalledWith(
                SelfTestActions.retrieveSelfTestScore({
                    conferenceId: conference.id,
                    participantId: component.selfTestParticipantId,
                    independent: false
                })
            );
        });
    });

    describe('updateVideoElementWithStream', () => {
        it('should set the video element srcObject', () => {
            component.updateVideoElementWithStream(cameraAndMicrophoneStream, component.videoElement);
            videoElementRefMock.nativeElement.dispatchEvent(new Event('loadedmetadata'));
            expect(component.videoElement.nativeElement.srcObject).toBe(cameraAndMicrophoneStream);
        });
    });

    describe('streamsActive', () => {
        it('should return false when no streams are defined', () => {
            component.outgoingStream = undefined;
            component.incomingStream = undefined;
            expect(component.streamsActive).toBeFalsy();
        });

        it('should return false when outoing is undefined and incoming is not active', () => {
            component.outgoingStream = undefined;
            component.incomingStream = new MediaStream();
            expect(component.streamsActive).toBeFalsy();
        });

        it('should return false when outoing is not active and incoming is undefined', () => {
            component.outgoingStream = new MediaStream();
            component.incomingStream = undefined;
            expect(component.streamsActive).toBeFalsy();
        });

        it('should return true when streams are active', () => {
            component.outgoingStream = new MediaStream();
            spyOnProperty(component.outgoingStream, 'active').and.returnValue(true);
            component.incomingStream = new MediaStream();
            spyOnProperty(component.incomingStream, 'active').and.returnValue(true);
            expect(component.streamsActive).toBeTruthy();
        });
    });

    describe('Pexip Callbacks', () => {
        beforeEach(() => {
            component.isIndependentTest = false;
            component.conference = conference;
            component.participant = loggedInParticipant;
            component.selfTestParticipantId = loggedInParticipant.id;

            component.setupPexipSubscribers();
        });

        afterEach(() => {
            component.ngOnDestroy();
            videoCallService.disconnectFromCall();
        });

        it('should connect when pexip call has setup', fakeAsync(() => {
            const callSetup = new CallSetup(new MediaStream([]));
            videoCallService.connect.calls.reset();

            onSetupSubjectMock.next(callSetup);
            tick();

            expect(videoCallService.connect).toHaveBeenCalledTimes(1);
        }));

        it('should capture incoming stream and emit test started when call is connected', fakeAsync(() => {
            const connectedCall = new ConnectedCall(new MediaStream([]));
            spyOn(component.testStarted, 'emit');

            onConnectedSubjectMock.next(connectedCall);
            tick();

            expect(component.incomingStream).toEqual(<MediaStream>connectedCall.stream);
            expect(component.displayFeed).toBeTrue();
            expect(component.displayConnecting).toBeFalse();
            expect(component.testInProgress).toBeTrue();
            expect(component.testStarted.emit).toHaveBeenCalledTimes(1);
        }));

        it('should handle pexip error', fakeAsync(() => {
            errorService.handlePexipError.calls.reset();

            onErrorSubjectMock.next(new CallError('random test failure'));
            tick();

            expect(component.testInProgress).toBeFalse();
            expect(errorService.handlePexipError).toHaveBeenCalledTimes(1);
        }));

        it('should retrieve the self test score when disconnected from pexip with test call finished', fakeAsync(() => {
            const disconnectedCall = new DisconnectedCall('Test call finished');
            spyOn(component, 'retrieveSelfTestScore');

            onDisconnectedSubjectMock.next(disconnectedCall);
            tick();

            expect(component.retrieveSelfTestScore).toHaveBeenCalledTimes(1);
        }));
    });
});
