import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { cold, hot } from 'jasmine-marbles';
import { Observable, of } from 'rxjs';
import { HttpClientTestingModule } from '@angular/common/http/testing'; // import this

import { ConferenceEffects } from './conference.effects';
import { ApiClient } from 'src/app/services/clients/api-client';
import { ConferenceActions } from '../actions/conference.actions';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import {
    mapConferenceToVHConference,
    mapParticipantToVHParticipant,
    mapEndpointToVHEndpoint
} from '../models/api-contract-to-state-model-mappers';
import { VideoCallService } from '../../services/video-call.service';
import { ConferenceState } from '../reducers/conference.reducer';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import * as ConferenceSelectors from '../selectors/conference.selectors';
import { VHPexipParticipant } from '../models/vh-conference';
import { HearingRole } from '../../models/hearing-role-model';

describe('ConferenceEffectsEffects', () => {
    let actions$: Observable<any>;
    let effects: ConferenceEffects;
    let apiClient: jasmine.SpyObj<ApiClient>;
    let videoCallService: jasmine.SpyObj<VideoCallService>;
    let mockConferenceStore: MockStore<ConferenceState>;

    beforeEach(() => {
        apiClient = jasmine.createSpyObj('ApiClient', ['getConferenceById']);
        videoCallService = jasmine.createSpyObj('VideoCallService', ['receiveAudioFromMix', 'sendParticipantAudioToMixes']);
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [
                ConferenceEffects,
                provideMockStore(),
                provideMockActions(() => actions$),
                { provide: ApiClient, useValue: apiClient },
                { provide: VideoCallService, useValue: videoCallService }
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

    describe('createAudioMixes$', () => {
        beforeEach(() => {
            videoCallService.receiveAudioFromMix.calls.reset();
            videoCallService.sendParticipantAudioToMixes.calls.reset();
        });

        afterEach(() => {
            mockConferenceStore.resetSelectors();
        });

        it('should not create audio mixes if participant or endpoint is not found', () => {
            // arrange
            mockConferenceStore.overrideSelector(ConferenceSelectors.getParticipants, []);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getEndpoints, []);
            const pexipParticipant: VHPexipParticipant = {
                isRemoteMuted: false,
                isSpotlighted: false,
                handRaised: false,
                pexipDisplayName: '1922_John Doe',
                uuid: 'doesnot_exist',
                isAudioOnlyCall: false,
                isVideoCall: true,
                protocol: 'sip',
                sentAudioMixes: [{ mix_name: 'main', prominent: false }],
                receivingAudioMix: 'main'
            };
            const action = ConferenceActions.createPexipParticipant({ participant: pexipParticipant });

            // act
            actions$ = of(action);

            // assert
            effects.createAudioMixes$.subscribe(() => {
                expect(videoCallService.receiveAudioFromMix).toHaveBeenCalledTimes(0);
            });
        });

        it('should create audio mixes if non-interpreter participant is found and has verbal interpreter language', () => {
            // arrange
            const participants = new ConferenceTestData().getListOfParticipants();
            let participant = mapParticipantToVHParticipant(participants[0]);
            participant = {
                ...participant,
                hearingRole: HearingRole.APPELLANT,
                pexipInfo: {
                    isRemoteMuted: false,
                    isSpotlighted: false,
                    handRaised: false,
                    pexipDisplayName: `1922_${participant.displayName}`,
                    uuid: '1922_John Doe',
                    isAudioOnlyCall: false,
                    isVideoCall: true,
                    protocol: 'sip',
                    sentAudioMixes: [{ mix_name: 'main', prominent: false }],
                    receivingAudioMix: 'main'
                }
            };

            // mock the get participants since override selector does not work with params and the selector get participant by id used the getParticipantsSelector
            mockConferenceStore.overrideSelector(ConferenceSelectors.getParticipants, [participant]);
            const languageDescription = 'Spanish';
            const pexipParticipant: VHPexipParticipant = {
                isRemoteMuted: false,
                isSpotlighted: false,
                handRaised: false,
                pexipDisplayName: `1922_John Doe${participants[0].id}`,
                uuid: '1922_John Doe',
                isAudioOnlyCall: false,
                isVideoCall: true,
                protocol: 'sip',
                sentAudioMixes: [{ mix_name: 'main', prominent: false }],
                receivingAudioMix: 'main'
            };
            const action = ConferenceActions.createPexipParticipant({ participant: pexipParticipant });

            // act
            actions$ = of(action);

            // assert
            effects.createAudioMixes$.subscribe(() => {
                expect(videoCallService.receiveAudioFromMix).toHaveBeenCalledWith(languageDescription, pexipParticipant.uuid);
            });
        });

        it('should create audio mixes and send audio to language mix if interpreter participant is found and has verbal interpreter language', () => {
            // arrange
            const participants = new ConferenceTestData().getListOfParticipants();
            let participant = mapParticipantToVHParticipant(participants[0]);
            participant = {
                ...participant,
                hearingRole: HearingRole.INTERPRETER,
                pexipInfo: {
                    isRemoteMuted: false,
                    isSpotlighted: false,
                    handRaised: false,
                    pexipDisplayName: `1922_${participant.displayName}`,
                    uuid: '1922_John Doe',
                    isAudioOnlyCall: false,
                    isVideoCall: true,
                    protocol: 'sip',
                    sentAudioMixes: [{ mix_name: 'main', prominent: false }],
                    receivingAudioMix: 'main'
                }
            };

            // mock the get participants since override selector does not work with params and the selector get participant by id used the getParticipantsSelector
            mockConferenceStore.overrideSelector(ConferenceSelectors.getParticipants, [participant]);
            const languageDescription = 'Spanish';
            const pexipParticipant: VHPexipParticipant = {
                isRemoteMuted: false,
                isSpotlighted: false,
                handRaised: false,
                pexipDisplayName: `1922_John Doe${participants[0].id}`,
                uuid: '1922_John Doe',
                isAudioOnlyCall: false,
                isVideoCall: true,
                protocol: 'sip',
                sentAudioMixes: [{ mix_name: 'main', prominent: false }],
                receivingAudioMix: 'main'
            };
            const action = ConferenceActions.createPexipParticipant({ participant: pexipParticipant });
            const expectedAudioMixes = [
                {
                    mix_name: 'main',
                    prominent: false
                },
                {
                    mix_name: languageDescription,
                    prominent: true
                }
            ];

            // act
            actions$ = of(action);

            // assert
            effects.createAudioMixes$.subscribe(() => {
                expect(videoCallService.receiveAudioFromMix).toHaveBeenCalledWith(languageDescription, pexipParticipant.uuid);
                expect(videoCallService.sendParticipantAudioToMixes).toHaveBeenCalledWith(expectedAudioMixes, pexipParticipant.uuid);
            });
        });

        it('should create audio mixes if endpoint is found and has verbal interpreter language', () => {
            // act
            const endpoints = new ConferenceTestData().getListOfEndpoints();
            let endpoint = mapEndpointToVHEndpoint(endpoints[0]);
            endpoint = {
                ...endpoint,
                pexipInfo: {
                    isRemoteMuted: false,
                    isSpotlighted: false,
                    handRaised: false,
                    pexipDisplayName: `PTSN;${endpoints[0].display_name};${endpoints[0].id}`,
                    uuid: '1922_John Doe',
                    isAudioOnlyCall: false,
                    isVideoCall: true,
                    protocol: 'sip',
                    sentAudioMixes: [{ mix_name: 'main', prominent: false }],
                    receivingAudioMix: 'main'
                }
            };

            // mock the get endpoints since override selector does not work with params and the selector get endpoint by id used the getEndpointsSelector
            mockConferenceStore.overrideSelector(ConferenceSelectors.getEndpoints, [endpoint]);
            const languageDescription = 'Spanish';
            const pexipParticipant: VHPexipParticipant = {
                isRemoteMuted: false,
                isSpotlighted: false,
                handRaised: false,
                pexipDisplayName: `PTSN;${endpoints[0].display_name};${endpoints[0].id}`,
                uuid: '1922_John Doe',
                isAudioOnlyCall: false,
                isVideoCall: true,
                protocol: 'sip',
                sentAudioMixes: [{ mix_name: 'main', prominent: false }],
                receivingAudioMix: 'main'
            };

            const action = ConferenceActions.createPexipParticipant({ participant: pexipParticipant });

            // act
            actions$ = of(action);

            // assert
            effects.createAudioMixes$.subscribe(() => {
                expect(videoCallService.receiveAudioFromMix).toHaveBeenCalledWith(languageDescription, pexipParticipant.uuid);
            });
        });
    });
});
