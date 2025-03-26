import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { cold, hot } from 'jasmine-marbles';
import { Observable, of } from 'rxjs';
import { provideHttpClientTesting } from '@angular/common/http/testing'; // import this

import { ConferenceEffects } from './conference.effects';
import {
    ApiClient,
    ConferenceStatus,
    EndpointStatus,
    LoggedParticipantResponse,
    ParticipantStatus,
    Role,
    UpdateParticipantDisplayNameRequest
} from 'src/app/services/clients/api-client';
import { ConferenceActions } from '../actions/conference.actions';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { mapConferenceToVHConference, mapParticipantToVHParticipant } from '../models/api-contract-to-state-model-mappers';
import { VideoCallService } from '../../services/video-call.service';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { ConferenceState } from '../reducers/conference.reducer';
import * as ConferenceSelectors from '../selectors/conference.selectors';
import { VHParticipant, VHPexipConference, VHPexipParticipant } from '../models/vh-conference';
import { SupplierClientService } from 'src/app/services/api/supplier-client.service';
import { ErrorService } from 'src/app/services/error.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { MockLogger } from 'src/app/testing/mocks/mock-logger';
import { EventsService } from 'src/app/services/events.service';
import { AudioRecordingService } from 'src/app/services/audio-recording.service';
import { audioRecordingServiceSpy } from 'src/app/testing/mocks/mock-audio-recording.service';
import { TransferDirection } from 'src/app/services/models/hearing-transfer';
import { UserMediaStreamServiceV2 } from 'src/app/services/user-media-stream-v2.service';

describe('ConferenceEffects', () => {
    let actions$: Observable<any>;
    let effects: ConferenceEffects;
    let apiClient: jasmine.SpyObj<ApiClient>;
    let mockConferenceStore: MockStore<ConferenceState>;

    let errorServiceSpy: jasmine.SpyObj<ErrorService>;
    let supplierClientService: jasmine.SpyObj<SupplierClientService>;
    let videoCallServiceSpy: jasmine.SpyObj<VideoCallService>;
    let pexipClientSpy: jasmine.SpyObj<PexipClient>;
    let eventsService: jasmine.SpyObj<EventsService>;
    let userMediaStreamService: jasmine.SpyObj<UserMediaStreamServiceV2>;

    beforeEach(() => {
        errorServiceSpy = jasmine.createSpyObj<ErrorService>('ErrorService', ['goToServiceError', 'handleApiError']);
        apiClient = jasmine.createSpyObj('ApiClient', [
            'getConferenceById',
            'nonHostLeaveHearing',
            'updateParticipantDisplayName',
            'getCurrentParticipant'
        ]);
        supplierClientService = jasmine.createSpyObj('SupplierClientService', ['loadSupplierScript']);
        pexipClientSpy = jasmine.createSpyObj<PexipClient>('PexipClient', [], { call_tag: 'test-call-tag' });
        videoCallServiceSpy = jasmine.createSpyObj<VideoCallService>(
            'VideoCallService',
            ['muteAllParticipants', 'muteParticipant', 'setParticipantOverlayText'],
            {
                pexipAPI: pexipClientSpy
            }
        );
        eventsService = jasmine.createSpyObj<EventsService>('EventsService', ['sendTransferRequest']);
        userMediaStreamService = jasmine.createSpyObj<UserMediaStreamServiceV2>('UserMediaStreamServiceV2', ['closeCurrentStream']);

        TestBed.configureTestingModule({
            providers: [
                ConferenceEffects,
                provideHttpClientTesting(),
                provideMockStore(),
                provideMockActions(() => actions$),
                { provide: ApiClient, useValue: apiClient },
                { provide: Logger, useValue: new MockLogger() },
                { provide: SupplierClientService, useValue: supplierClientService },
                { provide: VideoCallService, useValue: videoCallServiceSpy },
                { provide: ErrorService, useValue: errorServiceSpy },
                { provide: UserMediaStreamServiceV2, useValue: userMediaStreamService },

                { provide: EventsService, useValue: eventsService },
                { provide: AudioRecordingService, useValue: audioRecordingServiceSpy }
            ]
        });

        effects = TestBed.inject(ConferenceEffects);
        mockConferenceStore = TestBed.inject(MockStore);
    });

    afterEach(() => {
        mockConferenceStore.resetSelectors();
    });

    it('should be created', () => {
        expect(effects).toBeTruthy();
    });

    describe('loadConference$', () => {
        it('should call getConferenceById and expect load conference action to be dispatched on success', () => {
            // arrange
            const conferenceId = '123';
            const conferenceResponse = new ConferenceTestData().getConferenceDetailNow();
            const vhConference = mapConferenceToVHConference(conferenceResponse);
            apiClient.getConferenceById.and.returnValue(of(conferenceResponse));

            // act
            const action = ConferenceActions.loadConference({ conferenceId });
            actions$ = hot('-a', { a: action });

            // assert
            const expected = cold('-b', { b: ConferenceActions.loadConferenceSuccess({ conference: vhConference }) });
            expect(effects.loadConference$).toBeObservable(expected);
            expect(apiClient.getConferenceById).toHaveBeenCalledWith(conferenceId);
        });

        it('should call getConferenceById and expect load conference failure action to be dispatched on error', () => {
            // arrange
            const conferenceId = '123';
            const error = new Error('failed to load conference');
            apiClient.getConferenceById.and.returnValue(cold('#', {}, error)); // error observable

            // act
            const action = ConferenceActions.loadConference({ conferenceId });
            actions$ = hot('-a', { a: action });

            // assert
            const expected = cold('-b', { b: ConferenceActions.loadConferenceFailure({ error }) });
            expect(effects.loadConference$).toBeObservable(expected);
            expect(apiClient.getConferenceById).toHaveBeenCalledWith(conferenceId);
        });
    });

    describe('loadLoggedInParticipantOnConferenceLoadSuccess$', () => {
        it('should disptach the loadLoggedInParticipant when a conference has loaded successfully', () => {
            // arrange
            const conference = mapConferenceToVHConference(new ConferenceTestData().getConferenceDetailNow());
            const loggedInParticipant = conference.participants[0];
            apiClient.getCurrentParticipant.and.returnValue(
                of(
                    new LoggedParticipantResponse({
                        participant_id: loggedInParticipant.id,
                        display_name: loggedInParticipant.displayName,
                        role: loggedInParticipant.role
                    })
                )
            );

            // act
            const action = ConferenceActions.loadConferenceSuccess({ conference });
            actions$ = hot('-a', { a: action });

            // assert
            const expectedAction = ConferenceActions.loadLoggedInParticipant({ participantId: loggedInParticipant.id });
            const expected = cold('-b', { b: expectedAction });
            expect(effects.loadLoggedInParticipantOnConferenceLoadSuccess$).toBeObservable(expected);
        });
    });

    describe('loadConferenceFailure$', () => {
        it('should call error service on load conference failure', () => {
            // arrange
            const error = new Error('failed to load conference');
            const action = ConferenceActions.loadConferenceFailure({ error });

            actions$ = of(action);

            // act
            effects.loadConferenceFailure$.subscribe();

            // assert
            expect(errorServiceSpy.handleApiError).toHaveBeenCalled();
        });
    });

    describe('loadLoggedInParticipant$', () => {
        it('should call getParticipants and expect load logged in participant action to be dispatched on success', () => {
            // arrange
            const participants = new ConferenceTestData().getListOfParticipants();
            const vhParticipants: VHParticipant[] = participants.map(mapParticipantToVHParticipant);
            const participantId = vhParticipants[0].id;
            mockConferenceStore.overrideSelector(ConferenceSelectors.getParticipants, vhParticipants);

            // act
            const action = ConferenceActions.loadLoggedInParticipant({ participantId });
            actions$ = hot('-a', { a: action });

            // assert
            const expected = cold('-b', { b: ConferenceActions.loadLoggedInParticipantSuccess({ participant: vhParticipants[0] }) });
            expect(effects.loadLoggedInParticipant$).toBeObservable(expected);
        });
    });

    describe('loadSupplierScript$', () => {
        it('should call loadSupplierScript with the correct supplier when loadConferenceSuccess action is dispatched', () => {
            // arrange
            const conference = new ConferenceTestData().getConferenceDetailNow();
            const action = ConferenceActions.loadConferenceSuccess({ conference: mapConferenceToVHConference(conference) });

            actions$ = hot('-a', { a: action });

            // act
            effects.loadConferenceSuccess$.subscribe(() => {
                // assert
                expect(supplierClientService.loadSupplierScript).toHaveBeenCalledWith(conference.supplier);
            });
        });
    });

    describe('updateHostDisplayName$', () => {
        it('should call api to change display name and dispatch action on success', () => {
            // arrange
            const conference = new ConferenceTestData().getConferenceDetailNow();
            const vhConference = mapConferenceToVHConference(conference);
            const judge = vhConference.participants.find(x => x.role === Role.Judge);
            const displayName = 'new display name';
            const action = ConferenceActions.updateJudgeDisplayName({
                conferenceId: vhConference.id,
                participantId: judge.id,
                displayName
            });
            const expectedAction = ConferenceActions.updateParticipantDisplayNameSuccess({
                conferenceId: vhConference.id,
                participantId: judge.id,
                displayName
            });
            apiClient.updateParticipantDisplayName.and.returnValue(of(void 0));

            // act
            actions$ = hot('-a', { a: action });
            const expected = cold('-b', { b: expectedAction });
            expect(effects.updateHostDisplayName$).toBeObservable(expected);

            expect(apiClient.updateParticipantDisplayName).toHaveBeenCalledWith(
                conference.id,
                judge.id,
                new UpdateParticipantDisplayNameRequest({ display_name: displayName })
            );
        });
    });

    describe('releaseMediaStreamOnLeaveConference$', () => {
        it('should call closeCurrentStream when leave conference action is dispatched', () => {
            // arrange
            const conference = new ConferenceTestData().getConferenceDetailNow();
            const action = ConferenceActions.leaveConference({ conferenceId: conference.id });

            actions$ = hot('-a', { a: action });

            // act
            effects.releaseMediaStreamOnLeaveConference$.subscribe(() => {
                // assert
                expect(userMediaStreamService.closeCurrentStream).toHaveBeenCalled();
            });
        });
    });

    describe('participantDisconnect$', () => {
        afterEach(() => {
            mockConferenceStore.resetSelectors();
        });

        it('should navigate to logout page if participant is disconnected because they connected on another device', () => {
            // arrange
            const conference = new ConferenceTestData().getConferenceDetailNow();
            const participants = conference.participants;
            const vhParticipant = mapParticipantToVHParticipant(participants[0]);

            mockConferenceStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, vhParticipant);

            const action = ConferenceActions.updateParticipantStatus({
                participantId: vhParticipant.id,
                conferenceId: conference.id,
                status: ParticipantStatus.Disconnected,
                reason: 'connected on another device test-call-tag'
            });

            actions$ = of(action);

            // act
            effects.participantDisconnect$.subscribe();

            // assert
            expect(errorServiceSpy.goToServiceError).toHaveBeenCalled();
        });

        it('should navigate to error page if participant is disconnected due to heartbeat related issues', () => {
            // arrange
            const conference = new ConferenceTestData().getConferenceDetailNow();
            const participants = conference.participants;
            const vhParticipant = mapParticipantToVHParticipant(participants[0]);

            mockConferenceStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, vhParticipant);

            const action = ConferenceActions.updateParticipantStatus({
                participantId: vhParticipant.id,
                conferenceId: conference.id,
                status: ParticipantStatus.Disconnected,
                reason: 'Bad or no heartbeat received due to temporary network disruption'
            });

            actions$ = of(action);

            // act
            effects.participantDisconnect$.subscribe();

            // assert
            expect(errorServiceSpy.goToServiceError).toHaveBeenCalled();
        });

        it('should ignore if the status is not disconnected', () => {
            // arrange
            const conference = new ConferenceTestData().getConferenceDetailNow();
            const participants = conference.participants;
            const vhParticipant = mapParticipantToVHParticipant(participants[0]);

            mockConferenceStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, vhParticipant);

            const action = ConferenceActions.updateParticipantStatus({
                participantId: vhParticipant.id,
                conferenceId: conference.id,
                status: ParticipantStatus.Available,
                reason: 'connected'
            });

            actions$ = of(action);

            // act
            effects.participantDisconnect$.subscribe();

            // assert
            expect(errorServiceSpy.goToServiceError).not.toHaveBeenCalled();
        });

        it('should not navigate to logout page if participant is disconnected and reason does not include connected on another device', () => {
            // arrange
            const conference = new ConferenceTestData().getConferenceDetailNow();
            const participants = conference.participants;
            const vhParticipant = mapParticipantToVHParticipant(participants[0]);

            mockConferenceStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, vhParticipant);

            const action = ConferenceActions.updateParticipantStatus({
                participantId: vhParticipant.id,
                conferenceId: conference.id,
                status: ParticipantStatus.Disconnected,
                reason: 'some other reason'
            });

            actions$ = of(action);

            // act
            effects.participantDisconnect$.subscribe();

            // assert
            expect(errorServiceSpy.goToServiceError).not.toHaveBeenCalled();
        });

        it('should not navigate to logout page if participant is not the logged in participant', () => {
            // arrange
            const conference = new ConferenceTestData().getConferenceDetailNow();
            const participants = conference.participants;
            const vhParticipant = mapParticipantToVHParticipant(participants[0]);

            mockConferenceStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, vhParticipant);

            const action = ConferenceActions.updateParticipantStatus({
                participantId: '123',
                conferenceId: conference.id,
                status: ParticipantStatus.Disconnected,
                reason: 'connected on another device test-call-tag'
            });

            actions$ = of(action);

            // act
            effects.participantDisconnect$.subscribe();

            // assert
            expect(errorServiceSpy.goToServiceError).not.toHaveBeenCalled();
        });
    });

    describe('sendTransferRequest$', () => {
        it('should publish the transfer request via events service', () => {
            // arrange
            const conference = new ConferenceTestData().getConferenceDetailNow();
            const participants = conference.participants;
            const vhParticipant = mapParticipantToVHParticipant(participants[0]);

            mockConferenceStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, vhParticipant);

            const action = ConferenceActions.sendTransferRequest({
                conferenceId: conference.id,
                participantId: vhParticipant.id,
                transferDirection: TransferDirection.In
            });

            actions$ = of(action);

            // act
            effects.sendTransferRequest$.subscribe();

            // assert
            expect(eventsService.sendTransferRequest).toHaveBeenCalledWith(conference.id, vhParticipant.id, TransferDirection.In);
        });
    });

    describe('lockConferenceWhenAllInHearingParticipantsMuted$', () => {
        it('should lock the conference when all in hearing participants are remote muted', () => {
            // arrange
            const conference = new ConferenceTestData().getConferenceDetailNow();
            const vhConference = mapConferenceToVHConference(conference);
            const loggedInParticipant = vhConference.participants[0];
            loggedInParticipant.status = ParticipantStatus.InHearing;
            loggedInParticipant.pexipInfo = {
                role: 'chair'
            } as VHPexipParticipant;

            const pexipConference: VHPexipConference = {
                guestsMuted: false,
                locked: false,
                started: true
            };
            vhConference.participants.forEach(p => {
                p.status = ParticipantStatus.InHearing;
                return (p.pexipInfo = { ...p.pexipInfo, isRemoteMuted: true } as VHPexipParticipant);
            });
            vhConference.endpoints.forEach(e => {
                e.status = EndpointStatus.InHearing;
                return (e.pexipInfo = { isRemoteMuted: true } as VHPexipParticipant);
            });

            mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, vhConference);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getPexipConference, pexipConference);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, loggedInParticipant);

            const action = ConferenceActions.upsertPexipParticipant({ participant: vhConference.participants[0].pexipInfo });

            actions$ = of(action);

            // act
            effects.lockConferenceWhenAllInHearingParticipantsMuted$.subscribe();

            // assert
            expect(videoCallServiceSpy.muteAllParticipants).toHaveBeenCalledWith(true, conference.id);
        });
    });

    describe('unlockConferenceWhenAllInHearingParticipantsUnmuted$', () => {
        it('should unlock the conference when all in hearing participants are remote unmuted', () => {
            // arrange
            const pexipConference: VHPexipConference = {
                guestsMuted: true,
                locked: false,
                started: true
            };
            const conference = new ConferenceTestData().getConferenceDetailNow();
            const vhConference = mapConferenceToVHConference(conference);
            vhConference.countdownComplete = true;
            const loggedInParticipant = vhConference.participants[0];
            loggedInParticipant.status = ParticipantStatus.InHearing;
            loggedInParticipant.pexipInfo = {
                role: 'chair'
            } as VHPexipParticipant;

            vhConference.participants.forEach(p => {
                p.status = ParticipantStatus.InHearing;
                return (p.pexipInfo = { ...p.pexipInfo, isRemoteMuted: false } as VHPexipParticipant);
            });
            vhConference.endpoints.forEach(e => {
                e.status = EndpointStatus.InHearing;
                return (e.pexipInfo = { isRemoteMuted: false } as VHPexipParticipant);
            });

            mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, vhConference);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getPexipConference, pexipConference);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, loggedInParticipant);

            const action = ConferenceActions.upsertPexipParticipant({ participant: vhConference.participants[0].pexipInfo });

            actions$ = of(action);

            // act
            effects.unlockConferenceWhenAllInHearingParticipantsUnmuted$.subscribe();

            // assert
            expect(videoCallServiceSpy.muteAllParticipants).toHaveBeenCalledWith(false, conference.id);
        });
    });

    describe('unlockAnyRemoteMutedParticipantsWhenConferenceGuestAreRemoteUnmuted$', () => {
        it('should unlock any remote muted participants when conference remote unmuted', () => {
            // arrange
            const conference = new ConferenceTestData().getConferenceDetailNow();
            const vhConference = mapConferenceToVHConference(conference);

            const loggedInParticipant = vhConference.participants.find(x => x.role === Role.Judge);
            loggedInParticipant.status = ParticipantStatus.InHearing;
            loggedInParticipant.pexipInfo = {
                role: 'chair'
            } as VHPexipParticipant;

            vhConference.participants.forEach(p => {
                p.status = ParticipantStatus.InHearing;
                return (p.pexipInfo = { ...p.pexipInfo, isRemoteMuted: false } as VHPexipParticipant);
            });
            vhConference.endpoints.forEach(e => {
                e.status = EndpointStatus.InHearing;
                return (e.pexipInfo = { isRemoteMuted: false } as VHPexipParticipant);
            });
            vhConference.participants[0].pexipInfo.isRemoteMuted = true;
            vhConference.endpoints[0].pexipInfo.isRemoteMuted = true;

            mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, vhConference);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, loggedInParticipant);

            const action = ConferenceActions.upsertPexipConference({
                pexipConference: {
                    guestsMuted: false,
                    locked: false,
                    started: true
                }
            });

            actions$ = of(action);

            // act
            effects.unlockAnyRemoteMutedParticipantsWhenConferenceGuestAreRemoteUnmuted$.subscribe();

            // assert
            const participant = vhConference.participants[0];
            expect(videoCallServiceSpy.muteParticipant).toHaveBeenCalledWith(
                participant.pexipInfo.uuid,
                false,
                conference.id,
                participant.id
            );
        });
    });

    describe('pauseAudioRecordingOnPauseOrSuspend$', () => {
        it('should pause the audio recording when a conference is paused', () => {
            // arrange
            const conference = new ConferenceTestData().getConferenceDetailNow();
            const vhConference = mapConferenceToVHConference(conference);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, vhConference);
            const action = ConferenceActions.updateActiveConferenceStatus({
                conferenceId: vhConference.id,
                status: ConferenceStatus.Paused
            });

            actions$ = of(action);

            // act
            effects.pauseAudioRecordingOnPauseOrSuspend$.subscribe(() => {
                // assert
                expect(audioRecordingServiceSpy.cleanupDialOutConnections).toHaveBeenCalled();
            });
        });

        it('should pause the audio recording when a conference is suspended', () => {
            // arrange
            const conference = new ConferenceTestData().getConferenceDetailNow();
            const vhConference = mapConferenceToVHConference(conference);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, vhConference);
            const action = ConferenceActions.updateActiveConferenceStatus({
                conferenceId: vhConference.id,
                status: ConferenceStatus.Suspended
            });

            actions$ = of(action);

            // act
            effects.pauseAudioRecordingOnPauseOrSuspend$.subscribe(() => {
                // assert
                expect(audioRecordingServiceSpy.cleanupDialOutConnections).toHaveBeenCalled();
            });
        });
    });

    describe('refreshConferenceOnClose$', () => {
        it('should dispatch LoadConference action to retrieve actual close time', () => {
            // arrange
            const conferenceResponse = new ConferenceTestData().getConferenceDetailNow();
            const vhConference = mapConferenceToVHConference(conferenceResponse);
            vhConference.status = ConferenceStatus.Closed;
            apiClient.getConferenceById.and.returnValue(of(conferenceResponse));
            mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, vhConference);

            // act
            const action = ConferenceActions.updateActiveConferenceStatus({
                conferenceId: vhConference.id,
                status: ConferenceStatus.Closed
            });
            actions$ = hot('-a', { a: action });

            // assert
            const expected = cold('-b', { b: ConferenceActions.loadConference({ conferenceId: vhConference.id }) });
            expect(effects.refreshConferenceOnClose$).toBeObservable(expected);
        });
    });
});
