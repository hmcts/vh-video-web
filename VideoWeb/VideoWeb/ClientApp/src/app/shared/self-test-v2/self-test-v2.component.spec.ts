import { ComponentFixture, TestBed } from '@angular/core/testing';

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
import { Subject, of } from 'rxjs';
import { getSpiedPropertyGetter } from '../jasmine-helpers/property-helpers';
import { UserMediaDevice } from '../models/user-media-device';

fdescribe('SelfTestV2Component', () => {
    let component: SelfTestV2Component;
    let fixture: ComponentFixture<SelfTestV2Component>;

    const testData = new ConferenceTestData();
    let conference: VHConference;
    let loggedInParticipant: VHParticipant;
    let mockStore: MockStore<ConferenceState>;

    let userMediaService: jasmine.SpyObj<UserMediaService>;
    let connectedDevicesSubject: Subject<UserMediaDevice[]>;
    let currentStreamSubject: Subject<MediaStream>;

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

        errorService = jasmine.createSpyObj<ErrorService>(['handleApiError', 'handlePexipError']);

        userMediaService = jasmine.createSpyObj<UserMediaService>(['hasMultipleDevices', 'initialise'], ['connectedDevices$']);
        userMediaService.hasMultipleDevices.and.returnValue(of(true));

        connectedDevicesSubject = new Subject<UserMediaDevice[]>();
        currentStreamSubject = new Subject<MediaStream>();
        getSpiedPropertyGetter(userMediaService, 'connectedDevices$').and.returnValue(connectedDevicesSubject.asObservable());

        userMediaStreamService = jasmine.createSpyObj<UserMediaStreamServiceV2>(
            ['createAndPublishStream', 'closeCurrentStream'],
            ['currentStream$']
        );
        getSpiedPropertyGetter(userMediaStreamService, 'currentStream$').and.returnValue(currentStreamSubject.asObservable());

        videoCallService = jasmine.createSpyObj<VideoCallService>([
            'onCallConnected',
            'onCallDisconnected',
            'onCallSetup',
            'onError',
            'setupClient',
            'connect',
            'enableH264',
            'makeCall',
            'disconnectFromCall'
        ]);

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
    });

    describe('isIndependentTest true', () => {
        beforeEach(() => {
            component.isIndependentTest = true;
            fixture.detectChanges();
        });

        it('should retrieve pexip config and start test call', () => {
            expect(apiClient.getPexipConfig).toHaveBeenCalledTimes(1);
            expect(apiClient.getSelfTestToken).toHaveBeenCalledTimes(1);
            expect(videoCallService.setupClient).toHaveBeenCalledTimes(1);
            expect(videoCallService.connect).toHaveBeenCalledTimes(1);
            expect(videoCallService.makeCall).toHaveBeenCalledTimes(1);
        });
    });

    describe('isIndependentTest false', () => {
        beforeEach(() => {
            component.isIndependentTest = false;
            fixture.detectChanges();
        });

        it('should create', () => {
            expect(component).toBeTruthy();
        });
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
