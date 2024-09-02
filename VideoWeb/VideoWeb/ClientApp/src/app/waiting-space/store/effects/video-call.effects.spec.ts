import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable, of } from 'rxjs';
import { HttpClientTestingModule } from '@angular/common/http/testing'; // import this

import { ConferenceActions } from '../actions/conference.actions';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { mapParticipantToVHParticipant, mapEndpointToVHEndpoint } from '../models/api-contract-to-state-model-mappers';
import { VideoCallService } from '../../services/video-call.service';
import { ConferenceState } from '../reducers/conference.reducer';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import * as ConferenceSelectors from '../selectors/conference.selectors';
import { VHInterpreterLanguage, VHParticipant, VHPexipParticipant } from '../models/vh-conference';
import { HearingRole } from '../../models/hearing-role-model';
import { VideoCallEffects } from './video-call.effects';
import { InterpreterType } from 'src/app/services/clients/api-client';
import { FEATURE_FLAGS, LaunchDarklyService } from 'src/app/services/launch-darkly.service';

describe('VideoCallEffects', () => {
    let actions$: Observable<any>;
    let effects: VideoCallEffects;
    let videoCallService: jasmine.SpyObj<VideoCallService>;
    let mockConferenceStore: MockStore<ConferenceState>;
    let launchDarklyServiceSpy: jasmine.SpyObj<LaunchDarklyService>;

    beforeEach(() => {
        launchDarklyServiceSpy = jasmine.createSpyObj<LaunchDarklyService>('LaunchDarklyService', ['getFlag']);
        launchDarklyServiceSpy.getFlag.withArgs(FEATURE_FLAGS.interpreterEnhancements).and.returnValue(of(true));
        videoCallService = jasmine.createSpyObj('VideoCallService', ['receiveAudioFromMix', 'sendParticipantAudioToMixes']);
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [
                VideoCallEffects,
                provideMockStore(),
                provideMockActions(() => actions$),
                { provide: VideoCallService, useValue: videoCallService },
                { provide: LaunchDarklyService, useValue: launchDarklyServiceSpy }
            ]
        });

        effects = TestBed.inject(VideoCallEffects);
        mockConferenceStore = TestBed.inject(MockStore);
    });

    afterEach(() => {
        mockConferenceStore.resetSelectors();
    });

    it('should be created', () => {
        expect(effects).toBeTruthy();
    });

    describe('createAudioMixes$', () => {
        describe('interpreter enhancements enabled', () => {
            beforeEach(() => {
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
});
