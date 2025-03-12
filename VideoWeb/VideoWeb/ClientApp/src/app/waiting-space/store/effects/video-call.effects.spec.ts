import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable, of } from 'rxjs';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { ConferenceActions } from '../actions/conference.actions';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import {
    mapParticipantToVHParticipant,
    mapEndpointToVHEndpoint,
    mapConferenceToVHConference
} from '../models/api-contract-to-state-model-mappers';
import { VideoCallService } from '../../services/video-call.service';
import { ConferenceState } from '../reducers/conference.reducer';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import * as ConferenceSelectors from '../selectors/conference.selectors';
import { VHConference, VHInterpreterLanguage, VHParticipant, VHPexipParticipant } from '../models/vh-conference';
import { HearingRole } from '../../models/hearing-role-model';
import { VideoCallEffects } from './video-call.effects';
import { ApiClient, InterpreterType, ParticipantStatus, Role, Supplier } from 'src/app/services/clients/api-client';
import { FEATURE_FLAGS, LaunchDarklyService } from 'src/app/services/launch-darkly.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { MockLogger } from 'src/app/testing/mocks/mock-logger';
import { EventsService } from 'src/app/services/events.service';
import { UserMediaService } from 'src/app/services/user-media.service';
import { VideoCallActions } from '../actions/video-call.action';
import { cold, hot } from 'jasmine-marbles';
import { ParticipantMediaStatus } from 'src/app/shared/models/participant-media-status';
import { ConferenceSetting } from 'src/app/shared/models/conference-setting';

describe('VideoCallEffects', () => {
    let actions$: Observable<any>;
    let effects: VideoCallEffects;
    let videoCallService: jasmine.SpyObj<VideoCallService>;
    let pexipClient: jasmine.SpyObj<PexipClient>;
    let apiClient: jasmine.SpyObj<ApiClient>;
    let mockConferenceStore: MockStore<ConferenceState>;
    let launchDarklyServiceSpy: jasmine.SpyObj<LaunchDarklyService>;
    let eventsService: jasmine.SpyObj<EventsService>;
    let userMediaService;
    const conferenceTestData = new ConferenceTestData();

    beforeEach(() => {
        launchDarklyServiceSpy = jasmine.createSpyObj<LaunchDarklyService>('LaunchDarklyService', ['getFlag']);
        launchDarklyServiceSpy.getFlag.withArgs(FEATURE_FLAGS.interpreterEnhancements).and.returnValue(of(true));
        pexipClient = jasmine.createSpyObj<PexipClient>('PexipClient', [], { call_tag: 'test-call-tag' });
        videoCallService = jasmine.createSpyObj(
            'VideoCallService',
            ['receiveAudioFromMix', 'sendParticipantAudioToMixes', 'raiseHand', 'lowerHand', 'toggleMute', 'toggleVideo'],
            {
                pexipAPI: pexipClient
            }
        );

        apiClient = jasmine.createSpyObj('ApiClient', ['getConferenceById', 'nonHostLeaveHearing']);
        eventsService = jasmine.createSpyObj<EventsService>('EventsService', ['sendMediaStatus']);
        userMediaService = jasmine.createSpyObj<UserMediaService>('UserMediaService', ['getConferenceSetting']);

        TestBed.configureTestingModule({
            providers: [
                VideoCallEffects,
                provideHttpClientTesting(),
                provideMockStore(),
                provideMockActions(() => actions$),
                { provide: ApiClient, useValue: apiClient },
                { provide: Logger, useValue: new MockLogger() },
                { provide: VideoCallService, useValue: videoCallService },
                { provide: LaunchDarklyService, useValue: launchDarklyServiceSpy },
                { provide: EventsService, useValue: eventsService },
                { provide: UserMediaService, useValue: userMediaService }
            ]
        });

        effects = TestBed.inject(VideoCallEffects);
        mockConferenceStore = TestBed.inject(MockStore);
    });

    afterEach(() => {
        mockConferenceStore.resetSelectors();
    });

    describe('createAudioMixes$', () => {
        describe('interpreter enhancements enabled', () => {
            beforeEach(() => {
                const conference = conferenceTestData.getConferenceDetailNow();
                conference.supplier = Supplier.Vodafone;
                const vhConference = mapConferenceToVHConference(conference);
                mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, vhConference);
                launchDarklyServiceSpy.getFlag.withArgs(FEATURE_FLAGS.interpreterEnhancements).and.returnValue(of(true));
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
                    isVideoMuted: false,
                    pexipDisplayName: '1922_John Doe',
                    uuid: 'doesnot_exist',
                    callTag: 'john-call-tag',
                    isAudioOnlyCall: false,
                    isVideoCall: true,
                    protocol: 'sip',
                    role: 'Guest',
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

            it('should not create audio mixes if participant is found but does not have verbal interpreter language', () => {
                // arrange
                const participants = new ConferenceTestData().getListOfParticipants();
                let participant = mapParticipantToVHParticipant(participants[0]);
                participant = {
                    ...participant,
                    hearingRole: HearingRole.APPELLANT,
                    interpreterLanguage: { code: 'asl', description: 'American Sign Language', type: InterpreterType.Sign },
                    pexipInfo: {
                        isRemoteMuted: false,
                        isSpotlighted: false,
                        handRaised: false,
                        isVideoMuted: false,
                        pexipDisplayName: `1922_${participant.displayName}`,
                        uuid: '1922_John Doe',
                        callTag: 'john-call-tag',
                        isAudioOnlyCall: false,
                        isVideoCall: true,
                        protocol: 'sip',
                        role: 'Guest',
                        sentAudioMixes: [{ mix_name: 'main', prominent: false }],
                        receivingAudioMix: 'main'
                    }
                };

                // mock the get participants since override selector does not work with params and the selector get participant by id used the getParticipantsSelector
                mockConferenceStore.overrideSelector(ConferenceSelectors.getParticipants, [participant]);
                const pexipParticipant: VHPexipParticipant = {
                    isRemoteMuted: false,
                    isSpotlighted: false,
                    handRaised: false,
                    isVideoMuted: false,
                    pexipDisplayName: `1922_John Doe${participants[0].id}`,
                    uuid: '1922_John Doe',
                    callTag: 'john-call-tag',
                    isAudioOnlyCall: false,
                    isVideoCall: true,
                    protocol: 'sip',
                    role: 'Guest',
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

            it('should not create audio mixes if endpoint is found but does not have verbal interpreter language', () => {
                // arrange
                const endpoints = new ConferenceTestData().getListOfEndpoints();
                let endpoint = mapEndpointToVHEndpoint(endpoints[0]);
                endpoint = {
                    ...endpoint,
                    interpreterLanguage: { code: 'asl', description: 'American Sign Language', type: InterpreterType.Sign },
                    pexipInfo: {
                        isRemoteMuted: false,
                        isSpotlighted: false,
                        handRaised: false,
                        isVideoMuted: false,
                        pexipDisplayName: `PTSN;${endpoints[0].display_name};${endpoints[0].id}`,
                        uuid: '1922_John Doe',
                        callTag: 'john-call-tag',
                        isAudioOnlyCall: false,
                        isVideoCall: true,
                        protocol: 'sip',
                        role: 'Guest',
                        sentAudioMixes: [{ mix_name: 'main', prominent: false }],
                        receivingAudioMix: 'main'
                    }
                };

                // mock the get endpoints since override selector does not work with params and the selector get endpoint by id used the getEndpointsSelector
                mockConferenceStore.overrideSelector(ConferenceSelectors.getEndpoints, [endpoint]);
                const pexipParticipant: VHPexipParticipant = {
                    isRemoteMuted: false,
                    isSpotlighted: false,
                    handRaised: false,
                    isVideoMuted: false,
                    pexipDisplayName: `PTSN;${endpoints[0].display_name};${endpoints[0].id}`,
                    uuid: '1922_John Doe',
                    callTag: 'john-call-tag',
                    isAudioOnlyCall: false,
                    isVideoCall: true,
                    protocol: 'sip',
                    role: 'Guest',
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
                const interpretationLanguage: VHInterpreterLanguage = {
                    code: 'spa',
                    description: 'Spanish',
                    type: InterpreterType.Verbal
                };
                let participant = mapParticipantToVHParticipant(participants[0]);
                participant = {
                    ...participant,
                    hearingRole: HearingRole.APPELLANT,
                    interpreterLanguage: interpretationLanguage,
                    pexipInfo: {
                        isRemoteMuted: false,
                        isSpotlighted: false,
                        isVideoMuted: false,
                        handRaised: false,
                        pexipDisplayName: `1922_${participant.displayName}`,
                        uuid: '1922_John Doe',
                        callTag: 'john-call-tag',
                        isAudioOnlyCall: false,
                        isVideoCall: true,
                        protocol: 'sip',
                        role: 'Guest',
                        sentAudioMixes: [{ mix_name: 'main', prominent: false }],
                        receivingAudioMix: 'main'
                    }
                };

                // mock the get participants since override selector does not work with params and the selector get participant by id used the getParticipantsSelector
                mockConferenceStore.overrideSelector(ConferenceSelectors.getParticipants, [participant]);
                const pexipParticipant: VHPexipParticipant = {
                    isRemoteMuted: false,
                    isSpotlighted: false,
                    isVideoMuted: false,
                    handRaised: false,
                    pexipDisplayName: `1922_John Doe${participants[0].id}`,
                    uuid: '1922_John Doe',
                    callTag: 'john-call-tag',
                    isAudioOnlyCall: false,
                    isVideoCall: true,
                    protocol: 'sip',
                    role: 'Guest',
                    sentAudioMixes: [{ mix_name: 'main', prominent: false }],
                    receivingAudioMix: 'main'
                };
                const action = ConferenceActions.createPexipParticipant({ participant: pexipParticipant });

                // act
                actions$ = of(action);

                // assert
                effects.createAudioMixes$.subscribe(() => {
                    expect(videoCallService.receiveAudioFromMix).toHaveBeenCalledWith('main.spanish', pexipParticipant.uuid);
                });
            });

            it('should create audio mixes and send audio to language mix if interpreter participant is found and has verbal interpreter language', () => {
                // arrange
                const interpretationLanguage: VHInterpreterLanguage = {
                    code: 'spa',
                    description: 'Spanish',
                    type: InterpreterType.Verbal
                };
                const participants = new ConferenceTestData().getListOfParticipants();
                let participant = mapParticipantToVHParticipant(participants[0]);
                participant = {
                    ...participant,
                    hearingRole: HearingRole.INTERPRETER,
                    interpreterLanguage: interpretationLanguage,
                    pexipInfo: {
                        isRemoteMuted: false,
                        isSpotlighted: false,
                        isVideoMuted: false,
                        handRaised: false,
                        pexipDisplayName: `1922_${participant.displayName}`,
                        uuid: '1922_John Doe',
                        callTag: 'john-call-tag',
                        isAudioOnlyCall: false,
                        isVideoCall: true,
                        protocol: 'sip',
                        role: 'Guest',
                        sentAudioMixes: [{ mix_name: 'main', prominent: false }],
                        receivingAudioMix: 'main'
                    }
                };

                // mock the get participants since override selector does not work with params and the selector get participant by id used the getParticipantsSelector
                mockConferenceStore.overrideSelector(ConferenceSelectors.getParticipants, [participant]);
                const pexipParticipant: VHPexipParticipant = {
                    isRemoteMuted: false,
                    isSpotlighted: false,
                    handRaised: false,
                    isVideoMuted: false,
                    pexipDisplayName: `1922_John Doe${participants[0].id}`,
                    uuid: '1922_John Doe',
                    callTag: 'john-call-tag',
                    isAudioOnlyCall: false,
                    isVideoCall: true,
                    protocol: 'sip',
                    role: 'Guest',
                    sentAudioMixes: [{ mix_name: 'main', prominent: false }],
                    receivingAudioMix: 'main'
                };
                const action = ConferenceActions.createPexipParticipant({ participant: pexipParticipant });
                const expectedAudioMixes = [
                    {
                        mix_name: 'main',
                        prominent: true
                    },
                    {
                        mix_name: 'main.spanish',
                        prominent: false
                    }
                ];

                // act
                actions$ = of(action);

                // assert
                effects.createAudioMixes$.subscribe(() => {
                    expect(videoCallService.receiveAudioFromMix).toHaveBeenCalledWith('main', pexipParticipant.uuid);
                    expect(videoCallService.sendParticipantAudioToMixes).toHaveBeenCalledWith(expectedAudioMixes, pexipParticipant.uuid);
                });
            });

            it('should create audio mixes if endpoint is found and has verbal interpreter language', () => {
                // act
                const interpretationLanguage: VHInterpreterLanguage = {
                    code: 'spa',
                    description: 'Spanish',
                    type: InterpreterType.Verbal
                };
                const endpoints = new ConferenceTestData().getListOfEndpoints();
                let endpoint = mapEndpointToVHEndpoint(endpoints[0]);
                endpoint = {
                    ...endpoint,
                    interpreterLanguage: interpretationLanguage,
                    pexipInfo: {
                        isRemoteMuted: false,
                        isSpotlighted: false,
                        isVideoMuted: false,
                        handRaised: false,
                        pexipDisplayName: `PTSN;${endpoints[0].display_name};${endpoints[0].id}`,
                        uuid: '1922_John Doe',
                        callTag: 'john-call-tag',
                        isAudioOnlyCall: false,
                        isVideoCall: true,
                        protocol: 'sip',
                        role: 'Guest',
                        sentAudioMixes: [{ mix_name: 'main', prominent: false }],
                        receivingAudioMix: 'main'
                    }
                };

                // mock the get endpoints since override selector does not work with params and the selector get endpoint by id used the getEndpointsSelector
                mockConferenceStore.overrideSelector(ConferenceSelectors.getEndpoints, [endpoint]);
                const pexipParticipant: VHPexipParticipant = {
                    isRemoteMuted: false,
                    isSpotlighted: false,
                    isVideoMuted: false,
                    handRaised: false,
                    pexipDisplayName: `PTSN;${endpoints[0].display_name};${endpoints[0].id}`,
                    uuid: '1922_John Doe',
                    callTag: 'john-call-tag',
                    isAudioOnlyCall: false,
                    isVideoCall: true,
                    protocol: 'sip',
                    sentAudioMixes: [{ mix_name: 'main', prominent: false }],
                    receivingAudioMix: 'main',
                    role: 'Guest'
                };

                const action = ConferenceActions.createPexipParticipant({ participant: pexipParticipant });

                // act
                actions$ = of(action);

                // assert
                effects.createAudioMixes$.subscribe(() => {
                    expect(videoCallService.receiveAudioFromMix).toHaveBeenCalledWith('main.spanish', pexipParticipant.uuid);
                });
            });
        });
    });

    describe('updateAudioMixes$', () => {
        describe('interpreter enhancements enabled', () => {
            let participants: VHParticipant[];
            let participant: VHParticipant;
            beforeEach(() => {
                launchDarklyServiceSpy.getFlag.withArgs(FEATURE_FLAGS.interpreterEnhancements).and.returnValue(of(true));
                videoCallService.receiveAudioFromMix.calls.reset();
                videoCallService.sendParticipantAudioToMixes.calls.reset();

                const participantsResponse = new ConferenceTestData().getListOfParticipants();
                participants = participantsResponse.map(mapParticipantToVHParticipant);
                participants.forEach(p => {
                    p.pexipInfo = {
                        isRemoteMuted: false,
                        isSpotlighted: false,
                        handRaised: false,
                        pexipDisplayName: '1922_John Doe',
                        uuid: '1922_John Doe',
                        isAudioOnlyCall: false,
                        isVideoCall: true,
                        protocol: 'sip',
                        sentAudioMixes: [{ mix_name: 'main', prominent: false }],
                        receivingAudioMix: 'main'
                    } as VHPexipParticipant;
                });
                participant = participants[0];
            });

            afterEach(() => {
                mockConferenceStore.resetSelectors();
            });

            it('should not update audio mixes if participant is not found', () => {
                // arrange
                mockConferenceStore.overrideSelector(ConferenceSelectors.getParticipants, []);
                const action = ConferenceActions.updateAudioMix({
                    interpreterLanguage: undefined,
                    mainCourt: true,
                    participant: participant
                });

                // act
                actions$ = of(action);

                // assert
                effects.updateAudioMixes$.subscribe(() => {
                    expect(videoCallService.sendParticipantAudioToMixes).toHaveBeenCalledTimes(0);
                });
            });

            it('should not update audio mixes if participant is found but is not an interpreter', () => {
                // arrange
                participant = {
                    ...participant,
                    hearingRole: HearingRole.APPELLANT,
                    interpreterLanguage: { code: 'asl', description: 'American Sign Language', type: InterpreterType.Sign }
                };
                mockConferenceStore.overrideSelector(ConferenceSelectors.getParticipants, [participant]);
                const action = ConferenceActions.updateAudioMix({
                    interpreterLanguage: undefined,
                    mainCourt: true,
                    participant: participant
                });

                // act
                actions$ = of(action);

                // assert
                effects.updateAudioMixes$.subscribe(() => {
                    expect(videoCallService.sendParticipantAudioToMixes).toHaveBeenCalledTimes(0);
                });
            });

            it('should update audio mixes to main if participant is found and is an interpreter', () => {
                // arrange
                participant = {
                    ...participant,
                    hearingRole: HearingRole.INTERPRETER,
                    interpreterLanguage: { code: 'spa', description: 'Spanish', type: InterpreterType.Verbal }
                };
                mockConferenceStore.overrideSelector(ConferenceSelectors.getParticipants, [participant]);
                const action = ConferenceActions.updateAudioMix({
                    interpreterLanguage: undefined,
                    mainCourt: true,
                    participant: participant
                });
                const expectedAudioMixes = [
                    {
                        mix_name: 'main',
                        prominent: true
                    },
                    {
                        mix_name: 'main.spanish',
                        prominent: false
                    }
                ];

                // act
                actions$ = of(action);

                // assert
                effects.updateAudioMixes$.subscribe(() => {
                    expect(videoCallService.sendParticipantAudioToMixes).toHaveBeenCalledWith(
                        expectedAudioMixes,
                        participant.pexipInfo.uuid
                    );
                });
            });

            it('should update audio mixes to main and main.<language> if participant is found and is an interpreter', () => {
                // arrange
                participant = {
                    ...participant,
                    hearingRole: HearingRole.INTERPRETER,
                    interpreterLanguage: { code: 'spa', description: 'Spanish', type: InterpreterType.Verbal }
                };
                mockConferenceStore.overrideSelector(ConferenceSelectors.getParticipants, [participant]);
                const action = ConferenceActions.updateAudioMix({
                    interpreterLanguage: participant.interpreterLanguage,
                    mainCourt: false,
                    participant: participant
                });
                const expectedAudioMixes = [
                    {
                        mix_name: 'main',
                        prominent: false
                    },
                    {
                        mix_name: 'main.spanish',
                        prominent: true
                    }
                ];

                // act
                actions$ = of(action);

                // assert
                effects.updateAudioMixes$.subscribe(() => {
                    expect(videoCallService.sendParticipantAudioToMixes).toHaveBeenCalledWith(
                        expectedAudioMixes,
                        participant.pexipInfo.uuid
                    );
                });
            });
        });
    });

    describe('raiseHand$', () => {
        const conference = conferenceTestData.getConferenceDetailNow();
        let vhConference: VHConference;
        let participant: VHParticipant;
        beforeEach(() => {
            vhConference = mapConferenceToVHConference(conference);
            participant = vhConference.participants.find(x => x.role === Role.Individual);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, vhConference);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, participant);
            videoCallService.raiseHand.calls.reset();
        });

        it('should invoke raise hand on video call service', () => {
            // arrange
            const action = VideoCallActions.raiseHand();

            // act
            actions$ = of(action);

            // assert
            effects.raiseHand$.subscribe(() => {
                expect(videoCallService.raiseHand).toHaveBeenCalledWith(vhConference.id, participant.id);
            });
        });
    });

    describe('lowerHand$', () => {
        const conference = conferenceTestData.getConferenceDetailNow();
        let vhConference: VHConference;
        let participant: VHParticipant;
        beforeEach(() => {
            vhConference = mapConferenceToVHConference(conference);
            participant = vhConference.participants.find(x => x.role === Role.Individual);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, vhConference);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, participant);
            videoCallService.lowerHand.calls.reset();
        });

        it('should invoke lower hand on video call service', () => {
            // arrange
            const action = VideoCallActions.lowerHand();

            // act
            actions$ = of(action);

            // assert
            effects.lowerHand$.subscribe(() => {
                expect(videoCallService.lowerHand).toHaveBeenCalledWith(vhConference.id, participant.id);
            });
        });
    });

    describe('toggleAudioMute$', () => {
        const conference = conferenceTestData.getConferenceDetailNow();
        let vhConference: VHConference;
        let participant: VHParticipant;
        beforeEach(() => {
            vhConference = mapConferenceToVHConference(conference);
            participant = vhConference.participants.find(x => x.role === Role.Individual);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, vhConference);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, participant);
            videoCallService.toggleMute.calls.reset();
        });

        it('should invoke toggle mute on video call service', () => {
            // arrange
            videoCallService.toggleMute.and.returnValue(true);

            // act
            const action = VideoCallActions.toggleAudioMute();
            actions$ = hot('-a', { a: action });

            // assert
            const expectedAction = VideoCallActions.toggleAudioMuteSuccess({ participantId: participant.id, isMuted: true });
            const expected = cold('-b', { b: expectedAction });
            expect(effects.toggleAudioMute$).toBeObservable(expected);

            expect(videoCallService.toggleMute).toHaveBeenCalledWith(vhConference.id, participant.id);
        });
    });

    describe('toggleOutgoingVideo$', () => {
        const conference = conferenceTestData.getConferenceDetailNow();
        let vhConference: VHConference;
        let participant: VHParticipant;
        beforeEach(() => {
            vhConference = mapConferenceToVHConference(conference);
            participant = vhConference.participants.find(x => x.role === Role.Individual);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, vhConference);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, participant);
            videoCallService.toggleVideo.calls.reset();
        });

        it('should invoke toggle video on video call service', () => {
            // arrange
            videoCallService.toggleVideo.and.returnValue(true);

            // act
            const action = VideoCallActions.toggleOutgoingVideo();
            actions$ = hot('-a', { a: action });

            // assert
            const expectedAction = VideoCallActions.toggleOutgoingVideoSuccess({ participantId: participant.id, isVideoOn: false });
            const expected = cold('-b', { b: expectedAction });
            expect(effects.toggleOutgoingVideo$).toBeObservable(expected);

            expect(videoCallService.toggleVideo).toHaveBeenCalledWith(vhConference.id, participant.id);
        });
    });

    describe('publishOnAudioOrVideoToggle$', () => {
        const conference = conferenceTestData.getConferenceDetailNow();
        let vhConference: VHConference;
        let participant: VHParticipant;
        beforeEach(() => {
            vhConference = mapConferenceToVHConference(conference);
            participant = vhConference.participants.find(x => x.role === Role.Individual);
            participant.localMediaStatus = { isCameraOff: false, isMicrophoneMuted: true };
            mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, vhConference);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, participant);
            videoCallService.toggleVideo.calls.reset();
        });

        it('should dispatch publishParticipantMediaDeviceStatus when video is toggled', () => {
            // arrange

            // act
            const action = VideoCallActions.toggleOutgoingVideoSuccess({ isVideoOn: false, participantId: participant.id });
            actions$ = hot('-a', { a: action });

            // assert
            const expectedAction = VideoCallActions.publishParticipantMediaDeviceStatus({
                participantId: participant.id,
                conferenceId: vhConference.id,
                mediaStatus: { isLocalAudioMuted: true, isLocalVideoMuted: false }
            });
            const expected = cold('-b', { b: expectedAction });
            expect(effects.publishOnAudioOrVideoToggle$).toBeObservable(expected);
        });

        it('should dispatch publishParticipantMediaDeviceStatus when audio is toggled', () => {
            // arrange

            // act
            const action = VideoCallActions.toggleAudioMuteSuccess({ isMuted: true, participantId: participant.id });
            actions$ = hot('-a', { a: action });

            // assert
            const expectedAction = VideoCallActions.publishParticipantMediaDeviceStatus({
                participantId: participant.id,
                conferenceId: vhConference.id,
                mediaStatus: { isLocalAudioMuted: true, isLocalVideoMuted: false }
            });
            const expected = cold('-b', { b: expectedAction });
            expect(effects.publishOnAudioOrVideoToggle$).toBeObservable(expected);
        });
    });

    describe('participantLeaveHearingRoom$', () => {
        afterEach(() => {
            mockConferenceStore.resetSelectors();
        });

        it('should call the leave hearing', () => {
            // arrange
            const conference = new ConferenceTestData().getConferenceDetailNow();
            const participants = conference.participants;
            const vhParticipant = mapParticipantToVHParticipant(participants[0]);
            apiClient.nonHostLeaveHearing.and.returnValue(of(void 0));

            mockConferenceStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, vhParticipant);

            // act
            const action = VideoCallActions.participantLeaveHearingRoom({ conferenceId: conference.id });
            actions$ = hot('-a', { a: action });

            // assert
            const expected = cold('-b', {
                b: VideoCallActions.participantLeaveHearingRoomSuccess({ conferenceId: conference.id, participant: vhParticipant })
            });
            expect(effects.participantLeaveHearingRoom$).toBeObservable(expected);
            expect(apiClient.nonHostLeaveHearing).toHaveBeenCalled();
        });

        it('should  dispatch error action when leave hearing fails', () => {
            // arrange
            const participants = new ConferenceTestData().getListOfParticipants();
            const vhParticipant = mapParticipantToVHParticipant(participants[0]);
            const error = new Error('failed to leave hearing');
            apiClient.nonHostLeaveHearing.and.returnValue(cold('#', {}, error));

            mockConferenceStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, vhParticipant);

            // act
            const action = VideoCallActions.participantLeaveHearingRoom({ conferenceId: '123' });
            actions$ = hot('-a', { a: action });

            // assert
            const expected = cold('-b', { b: VideoCallActions.participantLeaveHearingRoomFailure({ error }) });
            expect(effects.participantLeaveHearingRoom$).toBeObservable(expected);
            expect(apiClient.nonHostLeaveHearing).toHaveBeenCalled();
        });
    });

    describe('publishParticipantMediaDeviceStatus$', () => {
        it('should call events service to send media status', () => {
            // arrange
            const conference = new ConferenceTestData().getConferenceDetailNow();
            const participants = conference.participants;
            const vhParticipant = mapParticipantToVHParticipant(participants[0]);
            const vhMediaStatus = { isLocalAudioMuted: true, isLocalVideoMuted: false };
            const medisStatus = new ParticipantMediaStatus(vhMediaStatus.isLocalAudioMuted, vhMediaStatus.isLocalVideoMuted);

            // act
            const action = VideoCallActions.publishParticipantMediaDeviceStatus({
                conferenceId: conference.id,
                participantId: vhParticipant.id,
                mediaStatus: vhMediaStatus
            });
            actions$ = hot('-a', { a: action });

            // assert
            effects.publishParticipantMediaDeviceStatus$.subscribe(() => {
                expect(eventsService.sendMediaStatus).toHaveBeenCalledWith(conference.id, vhParticipant.id, medisStatus);
            });
        });
    });

    describe('unmuteParticipantOnTransferToConsultationRoom$', () => {
        const conference = conferenceTestData.getConferenceDetailNow();
        let vhConference: VHConference;
        let participant: VHParticipant;
        beforeEach(() => {
            vhConference = mapConferenceToVHConference(conference);
            participant = vhConference.participants.find(x => x.role === Role.Individual);
            participant.status = ParticipantStatus.InConsultation;
            mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, vhConference);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, participant);
        });

        it('should unmute participants when in a consultation room', () => {
            // arrange
            pexipClient.call = { ...pexipClient.call, mutedAudio: true };
            // act
            const action = ConferenceActions.updateParticipantStatus({
                conferenceId: conference.id,
                participantId: participant.id,
                reason: 'ConsultationRoomTransfer',
                status: ParticipantStatus.InConsultation
            });
            actions$ = hot('-a', { a: action });

            // assert
            const expectedAction = VideoCallActions.toggleAudioMute();
            const expected = cold('-b', { b: expectedAction });
            expect(effects.unmuteParticipantOnTransferToConsultationRoom$).toBeObservable(expected);
        });

        it('should not toggle the audio mute when a participant is in a consultation room and already unmuted', () => {
            // arrange
            pexipClient.call = { ...pexipClient.call, mutedAudio: false };
            // act
            const action = ConferenceActions.updateParticipantStatus({
                conferenceId: conference.id,
                participantId: participant.id,
                reason: 'ConsultationRoomTransfer',
                status: ParticipantStatus.InConsultation
            });
            actions$ = hot('-a', { a: action });

            // assert
            const expected = cold('-');
            expect(effects.unmuteParticipantOnTransferToConsultationRoom$).toBeObservable(expected);
        });
    });

    describe('muteParticipantOnTransferToHearingRoom$', () => {
        const conference = conferenceTestData.getConferenceDetailNow();
        let vhConference: VHConference;
        let participant: VHParticipant;
        beforeEach(() => {
            vhConference = mapConferenceToVHConference(conference);
            participant = vhConference.participants.find(x => x.role === Role.Individual);
            participant.status = ParticipantStatus.InHearing;
            mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, vhConference);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, participant);
        });

        it('should toggle mute when a participant is in a hearing room but not locally muted', () => {
            // arrange
            pexipClient.call = { ...pexipClient.call, mutedAudio: false };
            // act
            const action = ConferenceActions.updateParticipantStatus({
                conferenceId: conference.id,
                participantId: participant.id,
                reason: 'HearingRoomTransfer',
                status: ParticipantStatus.InHearing
            });
            actions$ = hot('-a', { a: action });

            // assert
            const expectedAction = VideoCallActions.toggleAudioMute();
            const expected = cold('-b', { b: expectedAction });
            expect(effects.muteParticipantOnTransferToHearingRoom$).toBeObservable(expected);
        });

        it('should not toggle mute when a participant is in a hearing room and already muted', () => {
            // arrange
            pexipClient.call = { ...pexipClient.call, mutedAudio: true };
            // act
            const action = ConferenceActions.updateParticipantStatus({
                conferenceId: conference.id,
                participantId: participant.id,
                reason: 'HearingRoomTransfer',
                status: ParticipantStatus.InHearing
            });
            actions$ = hot('-a', { a: action });

            // assert
            const expected = cold('-');
            expect(effects.muteParticipantOnTransferToHearingRoom$).toBeObservable(expected);
        });
    });

    describe('localMuteParticipantOnRemoteMute$', () => {
        const conference = conferenceTestData.getConferenceDetailNow();
        let vhConference: VHConference;
        let participant: VHParticipant;
        beforeEach(() => {
            vhConference = mapConferenceToVHConference(conference);
            participant = vhConference.participants.find(x => x.role === Role.Individual);
            participant.status = ParticipantStatus.InHearing;
            participant.pexipInfo = { ...participant.pexipInfo, uuid: '1234', isRemoteMuted: false };
            participant.localMediaStatus = { isCameraOff: false, isMicrophoneMuted: false };
            mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, vhConference);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, participant);
        });

        it('should toggle mute when a participant is remotely muted but it not locally muted', () => {
            // arrange
            pexipClient.call = { ...pexipClient.call, mutedAudio: true };
            // act
            const action = ConferenceActions.upsertPexipParticipant({
                participant: { ...participant.pexipInfo, isRemoteMuted: true }
            });
            actions$ = hot('-a', { a: action });

            // assert
            const expectedAction = VideoCallActions.toggleAudioMute();
            const expected = cold('-b', { b: expectedAction });
            expect(effects.localMuteParticipantOnRemoteMute$).toBeObservable(expected);
        });

        it('should not toggle mute when a participant is not remotely muted', () => {
            // arrange
            pexipClient.call = { ...pexipClient.call, mutedAudio: false };
            // act
            const action = ConferenceActions.updateParticipantStatus({
                conferenceId: conference.id,
                participantId: participant.id,
                reason: 'RemoteMute',
                status: ParticipantStatus.InHearing
            });
            actions$ = hot('-a', { a: action });

            // assert
            const expected = cold('-');
            expect(effects.localMuteParticipantOnRemoteMute$).toBeObservable(expected);
        });
    });

    describe('publishParticipantMediaDeviceStatusOnCountdownComplete$', () => {
        const conference = conferenceTestData.getConferenceDetailNow();
        let vhConference: VHConference;
        let participant: VHParticipant;
        beforeEach(() => {
            vhConference = mapConferenceToVHConference(conference);
            participant = vhConference.participants.find(x => x.role === Role.Individual);
            participant.localMediaStatus = { isCameraOff: true, isMicrophoneMuted: false };
            participant.status = ParticipantStatus.InHearing;
            mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, vhConference);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, participant);
        });

        it('should publish participant media status when countdown completes', () => {
            // arrange
            const mediaStatus = { isLocalAudioMuted: false, isLocalVideoMuted: true };
            const action = ConferenceActions.countdownComplete({ conferenceId: vhConference.id });
            actions$ = hot('-a', { a: action });

            // act
            const expectedAction = VideoCallActions.publishParticipantMediaDeviceStatus({
                conferenceId: vhConference.id,
                participantId: participant.id,
                mediaStatus: mediaStatus
            });
            const expected = cold('-b', { b: expectedAction });
            expect(effects.publishParticipantMediaDeviceStatusOnCountdownComplete$).toBeObservable(expected);
        });
    });

    describe('restoreHostMutePreferenceOnCountdownComplete$', () => {
        const conference = conferenceTestData.getConferenceDetailNow();
        let vhConference: VHConference;
        let participant: VHParticipant;
        beforeEach(() => {
            vhConference = mapConferenceToVHConference(conference);
            participant = vhConference.participants.find(x => x.role === Role.Judge);
            participant.status = ParticipantStatus.InHearing;
            participant.localMediaStatus = { isCameraOff: true, isMicrophoneMuted: false };
            mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, vhConference);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, participant);
        });

        it('should toggle mute when judge is unmuted but preference is to be muted when countdown completes', () => {
            // arrange
            const startWithAudioMuted = true;
            const conferenceSetting = new ConferenceSetting(vhConference.id, startWithAudioMuted);
            userMediaService.getConferenceSetting.and.returnValue(conferenceSetting);
            pexipClient.call = { ...pexipClient.call, mutedAudio: false };

            const action = ConferenceActions.countdownComplete({ conferenceId: vhConference.id });
            actions$ = hot('-a', { a: action });

            // act
            const expectedAction = VideoCallActions.toggleAudioMute();
            const expected = cold('-b', { b: expectedAction });
            expect(effects.restoreHostMutePreferenceOnCountdownComplete$).toBeObservable(expected);
        });

        it('should toggle mute when judge is muted but preference is to be unmuted when countdown completes', () => {
            // arrange
            const startWithAudioMuted = false;
            const conferenceSetting = new ConferenceSetting(vhConference.id, startWithAudioMuted);
            userMediaService.getConferenceSetting.and.returnValue(conferenceSetting);
            pexipClient.call = { ...pexipClient.call, mutedAudio: true };

            const action = ConferenceActions.countdownComplete({ conferenceId: vhConference.id });
            actions$ = hot('-a', { a: action });

            // act
            const expectedAction = VideoCallActions.toggleAudioMute();
            const expected = cold('-b', { b: expectedAction });
            expect(effects.restoreHostMutePreferenceOnCountdownComplete$).toBeObservable(expected);
        });

        it('should not take action when the mute preference matches current state', () => {
            // arrange
            const startWithAudioMuted = false;
            const conferenceSetting = new ConferenceSetting(vhConference.id, startWithAudioMuted);
            userMediaService.getConferenceSetting.and.returnValue(conferenceSetting);
            pexipClient.call = { ...pexipClient.call, mutedAudio: false };

            const action = ConferenceActions.countdownComplete({ conferenceId: vhConference.id });
            actions$ = hot('-a', { a: action });

            // act
            const expected = cold('-');
            expect(effects.restoreHostMutePreferenceOnCountdownComplete$).toBeObservable(expected);
        });

        it('should toggle mute when staff member is unmuted but preference is to be muted when countdown completes', () => {
            // arrange
            participant.role = Role.StaffMember;
            mockConferenceStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, participant);
            const startWithAudioMuted = true;
            const conferenceSetting = new ConferenceSetting(vhConference.id, startWithAudioMuted);
            userMediaService.getConferenceSetting.and.returnValue(conferenceSetting);
            pexipClient.call = { ...pexipClient.call, mutedAudio: false };

            const action = ConferenceActions.countdownComplete({ conferenceId: vhConference.id });
            actions$ = hot('-a', { a: action });

            // act
            const expectedAction = VideoCallActions.toggleAudioMute();
            const expected = cold('-b', { b: expectedAction });
            expect(effects.restoreHostMutePreferenceOnCountdownComplete$).toBeObservable(expected);
        });
    });

    describe('updateParticipantLocalMuteStatus$', () => {
        const conference = conferenceTestData.getConferenceDetailNow();
        let vhConference: VHConference;
        let participant: VHParticipant;
        beforeEach(() => {
            vhConference = mapConferenceToVHConference(conference);
            participant = vhConference.participants.find(x => x.role === Role.Individual);
            participant.localMediaStatus = { isCameraOff: true, isMicrophoneMuted: false };
            participant.status = ParticipantStatus.InHearing;
            mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, vhConference);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, participant);
        });

        it('should update local mute status when participant is locally muted', () => {
            // arrange
            const action = ConferenceActions.updateParticipantLocalMuteStatus({
                conferenceId: conference.id,
                participantId: participant.id,
                isMuted: true
            });
            actions$ = hot('-a', { a: action });

            // act
            const expectedAction = VideoCallActions.toggleAudioMute();
            const expected = cold('-b', { b: expectedAction });
            expect(effects.updateParticipantLocalMuteStatus$).toBeObservable(expected);
        });

        it('should not take actions when the requested mute status matches the current mute status', () => {
            // arrange
            const action = ConferenceActions.updateParticipantLocalMuteStatus({
                conferenceId: conference.id,
                participantId: participant.id,
                isMuted: false
            });
            actions$ = hot('-a', { a: action });

            // act
            const expected = cold('-');
            expect(effects.updateParticipantLocalMuteStatus$).toBeObservable(expected);
        });
    });
});
