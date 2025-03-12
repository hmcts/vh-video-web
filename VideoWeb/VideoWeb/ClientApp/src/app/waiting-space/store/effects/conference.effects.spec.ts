import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { cold, hot } from 'jasmine-marbles';
import { Observable, of } from 'rxjs';
import { provideHttpClientTesting } from '@angular/common/http/testing'; // import this

import { ConferenceEffects } from './conference.effects';
import { ApiClient, EndpointStatus, ParticipantStatus } from 'src/app/services/clients/api-client';
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

    beforeEach(() => {
        errorServiceSpy = jasmine.createSpyObj<ErrorService>('ErrorService', ['goToServiceError']);
        apiClient = jasmine.createSpyObj('ApiClient', ['getConferenceById', 'nonHostLeaveHearing']);
        supplierClientService = jasmine.createSpyObj('SupplierClientService', ['loadSupplierScript']);
        pexipClientSpy = jasmine.createSpyObj<PexipClient>('PexipClient', [], { call_tag: 'test-call-tag' });
        videoCallServiceSpy = jasmine.createSpyObj<VideoCallService>('VideoCallService', ['muteAllParticipants', 'muteParticipant'], {
            pexipAPI: pexipClientSpy
        });
        eventsService = jasmine.createSpyObj<EventsService>('EventsService', ['sendTransferRequest']);

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
                { provide: EventsService, useValue: eventsService }
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

    describe('lockConferenceWhenAllInHearingParticipantsMuted$', () => {
        it('should lock the conference when all in hearing participants are remote muted', () => {
            // arrange
            const conference = new ConferenceTestData().getConferenceDetailNow();
            const vhConference = mapConferenceToVHConference(conference);
            const pexipConference: VHPexipConference = {
                guestsMuted: false,
                locked: false,
                started: true
            };
            vhConference.participants.forEach(p => {
                p.status = ParticipantStatus.InHearing;
                return (p.pexipInfo = { isRemoteMuted: true } as VHPexipParticipant);
            });
            vhConference.endpoints.forEach(e => {
                e.status = EndpointStatus.InHearing;
                return (e.pexipInfo = { isRemoteMuted: true } as VHPexipParticipant);
            });

            mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, vhConference);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getPexipConference, pexipConference);

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
            vhConference.participants.forEach(p => {
                p.status = ParticipantStatus.InHearing;
                return (p.pexipInfo = { isRemoteMuted: false } as VHPexipParticipant);
            });
            vhConference.endpoints.forEach(e => {
                e.status = EndpointStatus.InHearing;
                return (e.pexipInfo = { isRemoteMuted: false } as VHPexipParticipant);
            });

            mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, vhConference);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getPexipConference, pexipConference);

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
            vhConference.participants.forEach(p => {
                p.status = ParticipantStatus.InHearing;
                return (p.pexipInfo = { isRemoteMuted: false } as VHPexipParticipant);
            });
            vhConference.endpoints.forEach(e => {
                e.status = EndpointStatus.InHearing;
                return (e.pexipInfo = { isRemoteMuted: false } as VHPexipParticipant);
            });
            vhConference.participants[0].pexipInfo.isRemoteMuted = true;
            vhConference.endpoints[0].pexipInfo.isRemoteMuted = true;

            mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, vhConference);

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
});
