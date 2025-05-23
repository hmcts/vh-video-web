import {
    ConferenceStatus,
    ConsultationAnswer,
    EndpointStatus,
    InterpreterType,
    ParticipantStatus,
    Role,
    Supplier,
    TestCallScoreResponse,
    TestScore
} from 'src/app/services/clients/api-client';
import { ConferenceActions } from '../actions/conference.actions';
import {
    VHConference,
    VHConsultationCallStatus,
    VHEndpoint,
    VHParticipant,
    VHPexipConference,
    VHPexipParticipant,
    VHRoom
} from '../models/vh-conference';
import { ConferenceState, conferenceReducer, initialState } from './conference.reducer';
import { HearingRole } from '../../models/hearing-role-model';
import { ParticipantMediaStatus } from 'src/app/shared/models/participant-media-status';
import { TransferDirection } from 'src/app/services/models/hearing-transfer';
import { VideoCallActions } from '../actions/video-call.action';
import { VideoCallHostActions } from '../actions/video-call-host.actions';
import { SelfTestActions } from '../actions/self-test.actions';
import { AuthActions } from '../actions/auth.actions';
import { UserProfile } from '../models/user-profile';
import { AudioRecordingActions } from '../actions/audio-recording.actions';

function deepFreeze(object) {
    if (Object.isFrozen(object)) {
        return object;
    }

    const propNames = Object.getOwnPropertyNames(object);

    for (const name of propNames) {
        const value = object[name];

        object[name] = value && typeof value === 'object' ? deepFreeze(value) : value;
    }

    return Object.freeze(object);
}

describe('Conference Reducer', () => {
    let conferenceTestData: VHConference;
    let existingInitialState: ConferenceState;
    let originalRoom: VHRoom;

    beforeEach(() => {
        originalRoom = {
            label: 'Room 999',
            locked: false
        };

        conferenceTestData = {
            id: '123',
            caseName: 'Test Case',
            caseNumber: '123456',
            duration: 60,
            scheduledDateTime: new Date('2021-01-01T12:00:00Z'),
            status: ConferenceStatus.NotStarted,
            isVenueScottish: true,
            countdownComplete: false,
            audioRecordingIngestUrl: 'http://an-audio-recording-url',
            audioRecordingRequired: true,
            caseType: 'Generic',
            hearingVenueName: 'Birmingham Civil and Family Justice Centre',
            conferenceAlias: 'Test Alias',
            pexipNodeUri: 'pexip.node.uri',
            selfTestNodeUri: 'self.test.node.uri',
            participants: [
                {
                    id: '0f497ffa-802c-4dfb-a3f2-208de0c10df7',
                    externalReferenceId: 'john-external-ref-123',
                    name: 'Mr John Doe',
                    username: 'john.doe@test.com',
                    status: ParticipantStatus.InConsultation,
                    tiledDisplayName: 'CIVILIAN;NO_HEARTBEAT;Mr John Doe;0f497ffa-802c-4dfb-a3f2-208de0c10df7',
                    room: originalRoom,
                    representee: '',
                    displayName: 'John Doe',
                    firstName: 'John',
                    lastName: 'Doe',
                    hearingRole: HearingRole.REPRESENTATIVE,
                    pexipInfo: undefined,
                    role: Role.Representative,
                    linkedParticipants: [],
                    localMediaStatus: undefined,
                    transferDirection: undefined,
                    protectedFrom: []
                },
                {
                    id: '7b875df1-bf37-4f5a-9d23-d3493f319a08',
                    externalReferenceId: 'judge-external-ref-123',
                    name: 'Judge Fudge',
                    username: 'judge.fudge@test.com',
                    status: ParticipantStatus.Available,
                    tiledDisplayName: 'JUDGE;HEARTBEAT;Judge Fudge;7b875df1-bf37-4f5a-9d23-d3493f319a08',
                    displayName: 'Judge Fudge',
                    firstName: 'Judge',
                    lastName: 'Fudge',
                    hearingRole: HearingRole.JUDGE,
                    pexipInfo: undefined,
                    role: Role.Judge,
                    linkedParticipants: [],
                    localMediaStatus: undefined,
                    transferDirection: undefined,
                    protectedFrom: []
                },
                {
                    id: '729ae52a-f894-4680-af4b-4d9fcc6ffdaf',
                    externalReferenceId: 'chris-external-ref-123',
                    name: 'Mr Chris Green',
                    username: 'chris.green@test.com',
                    status: ParticipantStatus.InConsultation,
                    tiledDisplayName: 'CIVILIAN;NO_HEARTBEAT;Mr Chris Green;729ae52a-f894-4680-af4b-4d9fcc6ffdaf',
                    room: originalRoom,
                    representee: '',
                    displayName: 'Chris Green',
                    firstName: 'Chris',
                    lastName: 'Green',
                    hearingRole: HearingRole.REPRESENTATIVE,
                    pexipInfo: undefined,
                    role: Role.Representative,
                    linkedParticipants: [],
                    localMediaStatus: undefined,
                    transferDirection: undefined,
                    protectedFrom: []
                },
                {
                    id: '52a88d2c-960d-4ee2-ad50-1fa0cd0e04ec',
                    externalReferenceId: 'jane-external-ref-123',
                    name: 'Ms Jane Doe',
                    username: 'jane.doe@test.com',
                    status: ParticipantStatus.InConsultation,
                    tiledDisplayName: 'CIVILIAN;NO_HEARTBEAT;Ms Jane Doe;52a88d2c-960d-4ee2-ad50-1fa0cd0e04ec',
                    room: originalRoom,
                    representee: '',
                    displayName: 'Jane Doe',
                    firstName: 'Jane',
                    lastName: 'Doe',
                    hearingRole: HearingRole.APPELLANT,
                    pexipInfo: undefined,
                    role: Role.Individual,
                    linkedParticipants: [],
                    localMediaStatus: undefined,
                    transferDirection: undefined,
                    protectedFrom: []
                },
                {
                    id: 'Xf497ffa-802c-4dfb-a3f2-208de0c12345',
                    name: 'wowza',
                    username: 'vh-wowza',
                    status: ParticipantStatus.InConsultation,
                    tiledDisplayName: 'CIVILIAN;NO_HEARTBEAT;Mr John Doe;0f497ffa-802c-4dfb-a3f2-208de0c10df7',
                    room: originalRoom,
                    representee: '',
                    displayName: 'vh-wowza',
                    firstName: undefined,
                    lastName: undefined,
                    hearingRole: undefined,
                    pexipInfo: undefined,
                    role: undefined,
                    linkedParticipants: [],
                    localMediaStatus: undefined,
                    transferDirection: undefined,
                    protectedFrom: []
                }
            ],
            endpoints: [
                {
                    id: '197ced60-3cae-4214-8ba1-4465cffe4b5e',
                    externalReferenceId: 'endpoint1-external-ref-123',
                    displayName: 'Endpoint 1',
                    status: EndpointStatus.InConsultation,
                    participantsLinked: ['john.doe@test.com'],
                    room: originalRoom,
                    pexipInfo: undefined,
                    transferDirection: undefined,
                    protectedFrom: []
                },
                {
                    id: '197ced60-3cae-4214-8ba1-4465cffe4b5d',
                    externalReferenceId: 'endpoint2-external-ref-123',
                    displayName: 'Endpoint 2',
                    status: EndpointStatus.NotYetJoined,
                    participantsLinked: null,
                    room: null,
                    pexipInfo: undefined,
                    transferDirection: undefined,
                    protectedFrom: []
                }
            ],
            supplier: Supplier.Vodafone
        };
        existingInitialState = {
            currentConference: conferenceTestData,
            availableRooms: [originalRoom],
            consultationStatuses: []
        };
        deepFreeze(existingInitialState);
    });

    describe('an unknown action', () => {
        it('should return the previous state', () => {
            const action = {} as any;

            const result = conferenceReducer(initialState, action);

            expect(result).toBe(initialState);
        });
    });

    describe('loadConferenceSuccess action', () => {
        it('should set the current conference', () => {
            const result = conferenceReducer(initialState, ConferenceActions.loadConferenceSuccess({ conference: conferenceTestData }));
            expect(result.currentConference).toEqual(conferenceTestData);
        });

        it('should replace the existing conference with the new conference and maintain pexip info', () => {
            const conferenceWithPexipInfo: VHConference = {
                ...conferenceTestData,
                participants: [
                    {
                        ...conferenceTestData.participants[0],
                        pexipInfo: {
                            isRemoteMuted: false,
                            isSpotlighted: false,
                            isVideoMuted: false,
                            handRaised: false,
                            pexipDisplayName: '1922_John Doe',
                            uuid: '1922_John Doe',
                            callTag: 'john-cal-tag',
                            isAudioOnlyCall: false,
                            isVideoCall: true,
                            protocol: 'sip',
                            role: 'Guest',
                            sentAudioMixes: [{ mix_name: 'main', prominent: false }],
                            receivingAudioMix: 'main'
                        },
                        localMediaStatus: {
                            isCameraOff: true,
                            isMicrophoneMuted: true
                        }
                    },
                    conferenceTestData.participants[1]
                ]
            };

            const initialStateWithPexipInfo: ConferenceState = { ...initialState, currentConference: conferenceWithPexipInfo };

            const conferenceWithoutPexipInfo: VHConference = { ...existingInitialState.currentConference, caseName: 'Updating conference' };
            const result = conferenceReducer(
                initialStateWithPexipInfo,
                ConferenceActions.loadConferenceSuccess({ conference: conferenceWithoutPexipInfo })
            );

            expect(result.currentConference.caseName).toEqual('Updating conference');
            expect(result.currentConference.participants[0].pexipInfo).toBeTruthy();
            expect(result.currentConference.participants[0].localMediaStatus.isCameraOff).toBeTrue();
            expect(result.currentConference.participants[0].localMediaStatus.isMicrophoneMuted).toBeTrue();
        });

        it('should replace the existing conference with the new conference and maintain pexip info for endpoints', () => {
            const conferenceWithPexipInfo: VHConference = {
                ...conferenceTestData,
                endpoints: [
                    {
                        ...conferenceTestData.endpoints[0],
                        pexipInfo: {
                            isRemoteMuted: false,
                            isSpotlighted: false,
                            isVideoMuted: false,
                            handRaised: false,
                            pexipDisplayName: '1922_John Doe',
                            uuid: '1922_John Doe',
                            callTag: 'john-cal-tag',
                            isAudioOnlyCall: false,
                            isVideoCall: true,
                            protocol: 'sip',
                            role: 'Guest',
                            sentAudioMixes: [{ mix_name: 'main', prominent: false }],
                            receivingAudioMix: 'main'
                        }
                    },
                    conferenceTestData.endpoints[1]
                ]
            };

            const initialStateWithPexipInfo: ConferenceState = { ...initialState, currentConference: conferenceWithPexipInfo };

            const conferenceWithoutPexipInfo: VHConference = { ...existingInitialState.currentConference, caseName: 'Updating conference' };
            const result = conferenceReducer(
                initialStateWithPexipInfo,
                ConferenceActions.loadConferenceSuccess({ conference: conferenceWithoutPexipInfo })
            );

            expect(result.currentConference.caseName).toEqual('Updating conference');
            expect(result.currentConference.endpoints[0].pexipInfo).toBeTruthy();
        });

        it('should ignore the conference if the id does not match the active conference id', () => {
            const conferenceWithDifferentId: VHConference = { ...conferenceTestData, id: 'different-id' };
            const result = conferenceReducer(
                existingInitialState,
                ConferenceActions.loadConferenceSuccess({ conference: conferenceWithDifferentId })
            );
            expect(result).toEqual(existingInitialState);
        });
    });

    describe('leaveConference action', () => {
        it('should reset the conference state', () => {
            const result = conferenceReducer(
                existingInitialState,
                ConferenceActions.leaveConference({ conferenceId: conferenceTestData.id })
            );
            expect(result).toEqual(initialState);
        });
    });

    describe('upsertPexipConference', () => {
        it('should set the pexip conference', () => {
            const pexipConference = {
                guestsMuted: true,
                locked: false,
                started: true
            } as VHPexipConference;
            const result = conferenceReducer(initialState, ConferenceActions.upsertPexipConference({ pexipConference }));

            expect(result.pexipConference).toEqual(pexipConference);
        });
    });

    describe('updateActiveConferenceStatus action', () => {
        it('should return the previous state if the conference does not exist', () => {
            const updatedStatus = ConferenceStatus.InSession;
            const result = conferenceReducer(
                initialState,
                ConferenceActions.updateActiveConferenceStatus({ conferenceId: conferenceTestData.id, status: updatedStatus })
            );

            expect(result).toEqual(initialState);
        });

        it('should return the previous state if the conference id does not match', () => {
            const updatedStatus = ConferenceStatus.InSession;
            const result = conferenceReducer(
                existingInitialState,
                ConferenceActions.updateActiveConferenceStatus({ conferenceId: 'unknown', status: updatedStatus })
            );

            expect(result).toBe(existingInitialState);
        });

        it('should update the status of the current conference', () => {
            const updatedStatus = ConferenceStatus.InSession;
            const updatedResult = conferenceReducer(
                existingInitialState,
                ConferenceActions.updateActiveConferenceStatus({ conferenceId: conferenceTestData.id, status: updatedStatus })
            );

            expect(updatedResult.currentConference.status).toBe(updatedStatus);
        });

        it('should reset the transfer direction of all participants when the status paused', () => {
            const conferenceWithTransferDirection: VHConference = {
                ...conferenceTestData,
                participants: [
                    {
                        ...conferenceTestData.participants[0],
                        transferDirection: TransferDirection.In
                    },
                    conferenceTestData.participants[1]
                ]
            };
            const initialStateWithTransferDirection: ConferenceState = {
                ...initialState,
                currentConference: conferenceWithTransferDirection
            };

            const updatedResult = conferenceReducer(
                initialStateWithTransferDirection,
                ConferenceActions.updateActiveConferenceStatus({ conferenceId: conferenceTestData.id, status: ConferenceStatus.Paused })
            );

            expect(updatedResult.currentConference.participants.every(p => p.transferDirection === undefined)).toBeTrue();
        });

        it('should reset the transfer direction of all participants when the status suspended', () => {
            const conferenceWithTransferDirection: VHConference = {
                ...conferenceTestData,
                participants: [
                    {
                        ...conferenceTestData.participants[0],
                        transferDirection: TransferDirection.In
                    },
                    conferenceTestData.participants[1]
                ]
            };
            const initialStateWithTransferDirection: ConferenceState = {
                ...initialState,
                currentConference: conferenceWithTransferDirection
            };

            const updatedResult = conferenceReducer(
                initialStateWithTransferDirection,
                ConferenceActions.updateActiveConferenceStatus({ conferenceId: conferenceTestData.id, status: ConferenceStatus.Suspended })
            );

            expect(updatedResult.currentConference.participants.every(p => p.transferDirection === undefined)).toBeTrue();
        });
    });

    describe('updateParticipantStatus action', () => {
        it('should return the previous state if the conference does not exist', () => {
            const updatedStatus = ParticipantStatus.Available;
            const result = conferenceReducer(
                initialState,
                ConferenceActions.updateParticipantStatus({
                    conferenceId: conferenceTestData.id,
                    participantId: conferenceTestData.participants[0].id,
                    status: updatedStatus,
                    reason: undefined
                })
            );

            expect(result).toBe(initialState);
        });

        it('should return the previous state if the conference id does not match', () => {
            const updatedStatus = ParticipantStatus.Available;
            const result = conferenceReducer(
                existingInitialState,
                ConferenceActions.updateParticipantStatus({
                    conferenceId: 'unknown',
                    participantId: conferenceTestData.participants[0].id,
                    status: updatedStatus,
                    reason: undefined
                })
            );

            expect(result).toBe(existingInitialState);
        });

        it('should return the previous state if the participant does not exist', () => {
            const updatedStatus = ParticipantStatus.InHearing; // no participant has this status in existing initial state
            const result = conferenceReducer(
                existingInitialState,
                ConferenceActions.updateParticipantStatus({
                    conferenceId: conferenceTestData.id,
                    participantId: 'unknown',
                    status: updatedStatus,
                    reason: undefined
                })
            );

            expect(result.currentConference.participants.some(p => p.status === updatedStatus)).toBeFalse();
        });

        it('should update the status of the participant', () => {
            const updatedStatus = ParticipantStatus.Available;
            const updatedResult = conferenceReducer(
                existingInitialState,
                ConferenceActions.updateParticipantStatus({
                    conferenceId: conferenceTestData.id,
                    participantId: conferenceTestData.participants[0].id,
                    status: updatedStatus,
                    reason: undefined
                })
            );

            expect(updatedResult.currentConference.participants[0].status).toBe(updatedStatus);
        });

        it('should update the room of the participant to null when status is Disconnected', () => {
            const updatedStatus = ParticipantStatus.Disconnected;
            const updatedResult = conferenceReducer(
                existingInitialState,
                ConferenceActions.updateParticipantStatus({
                    conferenceId: conferenceTestData.id,
                    participantId: conferenceTestData.participants[0].id,
                    status: updatedStatus,
                    reason: undefined
                })
            );

            expect(updatedResult.currentConference.participants[0].status).toBe(updatedStatus);
            expect(updatedResult.currentConference.participants[0].room).toBeNull();
            expect(updatedResult.currentConference.participants[0].pexipInfo).toBeNull();
        });

        it('should remove the participant from pending consultationStatuses they are requested for on status change', () => {
            const updatedStatus = ParticipantStatus.Available;
            const updatedResult = conferenceReducer(
                {
                    ...existingInitialState,
                    consultationStatuses: [
                        {
                            callStatus: 'Transferring...',
                            participantId: conferenceTestData.participants[0].id,
                            invitationId: '1234',
                            requestedBy: conferenceTestData.participants[1].id,
                            requestedFor: conferenceTestData.participants[0].id,
                            roomLabel: 'Room 1'
                        }
                    ]
                },
                ConferenceActions.updateParticipantStatus({
                    conferenceId: conferenceTestData.id,
                    participantId: conferenceTestData.participants[0].id,
                    status: updatedStatus,
                    reason: undefined
                })
            );

            expect(updatedResult.consultationStatuses).toEqual([]);
        });

        it('should not remove the participant from pending consultationStatuses they are not requested for on status change', () => {
            const updatedStatus = ParticipantStatus.Available;
            const updatedResult = conferenceReducer(
                {
                    ...existingInitialState,
                    consultationStatuses: [
                        {
                            callStatus: 'Transferring...',
                            participantId: conferenceTestData.participants[1].id,
                            invitationId: '1234',
                            requestedBy: conferenceTestData.participants[0].id,
                            requestedFor: conferenceTestData.participants[1].id,
                            roomLabel: 'Room 1'
                        }
                    ]
                },
                ConferenceActions.updateParticipantStatus({
                    conferenceId: conferenceTestData.id,
                    participantId: conferenceTestData.participants[0].id,
                    status: updatedStatus,
                    reason: undefined
                })
            );

            expect(updatedResult.consultationStatuses).toEqual([
                {
                    callStatus: 'Transferring...',
                    participantId: conferenceTestData.participants[1].id,
                    invitationId: '1234',
                    requestedBy: conferenceTestData.participants[0].id,
                    requestedFor: conferenceTestData.participants[1].id,
                    roomLabel: 'Room 1'
                }
            ]);
        });
    });

    describe('updateEndpointStatus action', () => {
        it('should return the previous state if the conference does not exist', () => {
            const updatedStatus = EndpointStatus.Connected;
            const result = conferenceReducer(
                initialState,
                ConferenceActions.updateEndpointStatus({
                    conferenceId: conferenceTestData.id,
                    endpointId: conferenceTestData.endpoints[0].id,
                    status: updatedStatus
                })
            );

            expect(result).toBe(initialState);
        });

        it('should return the previous state if the conference id does not match', () => {
            const updatedStatus = EndpointStatus.Connected;
            const result = conferenceReducer(
                existingInitialState,
                ConferenceActions.updateEndpointStatus({
                    conferenceId: 'unknown',
                    endpointId: conferenceTestData.endpoints[0].id,
                    status: updatedStatus
                })
            );

            expect(result).toBe(existingInitialState);
        });

        it('should return the previous state if the endpoint does not exist', () => {
            const updatedStatus = EndpointStatus.Connected;
            const result = conferenceReducer(
                existingInitialState,
                ConferenceActions.updateEndpointStatus({
                    conferenceId: conferenceTestData.id,
                    endpointId: 'unknown',
                    status: updatedStatus
                })
            );

            expect(result.currentConference.endpoints.some(e => e.status === updatedStatus)).toBeFalse();
        });

        it('should update the status of the endpoint', () => {
            const updatedStatus = EndpointStatus.Connected;
            const updatedResult = conferenceReducer(
                existingInitialState,
                ConferenceActions.updateEndpointStatus({
                    conferenceId: conferenceTestData.id,
                    endpointId: conferenceTestData.endpoints[0].id,
                    status: updatedStatus
                })
            );

            expect(updatedResult.currentConference.endpoints[0].status).toBe(updatedStatus);
        });

        it('should update the room of the endpoint to null when status is Disconnected', () => {
            const updatedStatus = EndpointStatus.Disconnected;
            const updatedResult = conferenceReducer(
                existingInitialState,
                ConferenceActions.updateEndpointStatus({
                    conferenceId: conferenceTestData.id,
                    endpointId: conferenceTestData.endpoints[0].id,
                    status: updatedStatus
                })
            );

            expect(updatedResult.currentConference.endpoints[0].status).toBe(updatedStatus);
            expect(updatedResult.currentConference.endpoints[0].room).toBeNull();
        });

        it('should update the room of the endpoint to null when status is Disconnected', () => {
            const updatedStatus = EndpointStatus.Disconnected;
            const updatedResult = conferenceReducer(
                existingInitialState,
                ConferenceActions.updateEndpointStatus({
                    conferenceId: conferenceTestData.id,
                    endpointId: conferenceTestData.endpoints[0].id,
                    status: updatedStatus
                })
            );

            expect(updatedResult.currentConference.endpoints[0].status).toBe(updatedStatus);
            expect(updatedResult.currentConference.endpoints[0].room).toBeNull();
            expect(updatedResult.currentConference.endpoints[0].pexipInfo).toBeNull();
        });
    });

    describe('updateParticipantHearingTransferStatus', () => {
        it('should return the previous state if the conference id does not match', () => {
            const result = conferenceReducer(
                existingInitialState,
                ConferenceActions.updateParticipantHearingTransferStatus({
                    conferenceId: 'unknown',
                    participantId: conferenceTestData.participants[0].id,
                    transferDirection: TransferDirection.In
                })
            );

            expect(result).toBe(existingInitialState);
        });

        it('should update the transfer status of a participant', () => {
            const updatedResult = conferenceReducer(
                existingInitialState,
                ConferenceActions.updateParticipantHearingTransferStatus({
                    conferenceId: conferenceTestData.id,
                    participantId: conferenceTestData.participants[0].id,
                    transferDirection: TransferDirection.In
                })
            );

            expect(updatedResult.currentConference.participants[0].transferDirection).toBe(TransferDirection.In);
        });

        it('should update the transfer status of an endpoint', () => {
            const updatedResult = conferenceReducer(
                existingInitialState,
                ConferenceActions.updateParticipantHearingTransferStatus({
                    conferenceId: conferenceTestData.id,
                    participantId: conferenceTestData.endpoints[0].id,
                    transferDirection: TransferDirection.In
                })
            );

            expect(updatedResult.currentConference.endpoints[0].transferDirection).toBe(TransferDirection.In);
        });
    });

    describe('updateParticipantMediaStatus', () => {
        it('should return the previous state if the conference id does not match', () => {
            const result = conferenceReducer(
                existingInitialState,
                ConferenceActions.updateParticipantMediaStatus({
                    conferenceId: 'unknown',
                    participantId: conferenceTestData.participants[0].id,
                    mediaStatus: {
                        is_local_audio_muted: false,
                        is_local_video_muted: false
                    }
                })
            );

            expect(result).toBe(existingInitialState);
        });

        it('should update the media status of a participant', () => {
            const mediaStatus: ParticipantMediaStatus = {
                is_local_audio_muted: true,
                is_local_video_muted: false
            };
            const result = conferenceReducer(
                existingInitialState,
                ConferenceActions.updateParticipantMediaStatus({
                    conferenceId: conferenceTestData.id,
                    participantId: conferenceTestData.participants[0].id,
                    mediaStatus
                })
            );

            const updatedParticipant = result.currentConference.participants[0];
            expect(updatedParticipant.localMediaStatus.isCameraOff).toBeFalse();
            expect(updatedParticipant.localMediaStatus.isMicrophoneMuted).toBeTrue();
        });
    });

    describe('updateParticipantList action', () => {
        it('should return the previous state if the conference does not exist', () => {
            const result = conferenceReducer(
                initialState,
                ConferenceActions.updateParticipantList({
                    conferenceId: conferenceTestData.id,
                    participants: conferenceTestData.participants
                })
            );

            expect(result).toBe(initialState);
        });

        it('should return the previous state if the conference id does not match', () => {
            const result = conferenceReducer(
                existingInitialState,
                ConferenceActions.updateParticipantList({
                    conferenceId: 'unknown',
                    participants: conferenceTestData.participants
                })
            );

            expect(result).toBe(existingInitialState);
        });

        it('should return the previous state if the conference id does not match', () => {
            const result = conferenceReducer(
                existingInitialState,
                ConferenceActions.updateParticipantList({
                    conferenceId: 'unknown',
                    participants: conferenceTestData.participants
                })
            );

            expect(result).toBe(existingInitialState);
        });

        it('should update the participant list', () => {
            const newParticipantsList: VHParticipant[] = [
                {
                    id: '0f497ffa-802c-4dfb-a3f2-208de0c10df7',
                    name: 'Mr John Doe',
                    username: 'john.doe@test.com',
                    status: ParticipantStatus.InConsultation,
                    tiledDisplayName: 'CIVILIAN;NO_HEARTBEAT;Mr John Doe;0f497ffa-802c-4dfb-a3f2-208de0c10df7',
                    room: { label: 'Room 1', locked: false },
                    representee: '',
                    displayName: 'John Doe',
                    firstName: 'John',
                    lastName: 'Doe',
                    hearingRole: HearingRole.REPRESENTATIVE,
                    role: Role.Representative,
                    linkedParticipants: []
                },
                {
                    id: '7b875df1-bf37-4f5a-9d23-d3493f319a08',
                    name: 'Judge New',
                    username: 'judge.new@test.com',
                    status: ParticipantStatus.NotSignedIn,
                    tiledDisplayName: 'JUDGE;HEARTBEAT;Judge New;7b875df1-bf37-4f5a-9d23-d3493f319a08',
                    displayName: 'Judge Fudge',
                    firstName: 'Judge',
                    lastName: 'Fudge',
                    hearingRole: HearingRole.JUDGE,
                    role: Role.Judge,
                    linkedParticipants: []
                }
            ];
            const result = conferenceReducer(
                existingInitialState,
                ConferenceActions.updateParticipantList({
                    conferenceId: conferenceTestData.id,
                    participants: newParticipantsList
                })
            );

            // john doe remains but in a room, new judge and chris green is removed
            expect(result.currentConference.participants.length).toEqual(2);
            expect(result.currentConference.participants[0].name).toEqual('Mr John Doe');
            expect(result.currentConference.participants[0].room.label).toEqual('Room 1');
            expect(result.currentConference.participants[0].status).toEqual(ParticipantStatus.InConsultation);
            expect(result.currentConference.participants[1].name).toEqual('Judge New');
            expect(result.currentConference.participants.some(p => p.name === 'Mr Chris Green')).toBeFalse();

            expect(result.availableRooms.length).toEqual(1);
            expect(result.availableRooms[0].label).toEqual('Room 1');
        });
    });

    describe('updateExistingEndpoints actions', () => {
        it('should return the previous state if the conference does not exist', () => {
            const result = conferenceReducer(
                initialState,
                ConferenceActions.updateExistingEndpoints({
                    conferenceId: conferenceTestData.id,
                    endpoints: conferenceTestData.endpoints
                })
            );

            expect(result).toBe(initialState);
        });

        it('should return the previous state if the conference id does not match', () => {
            const result = conferenceReducer(
                existingInitialState,
                ConferenceActions.updateExistingEndpoints({
                    conferenceId: 'unknown',
                    endpoints: conferenceTestData.endpoints
                })
            );

            expect(result).toBe(existingInitialState);
        });

        it('should update the existing endpoints', () => {
            const newEndpointsList = [
                {
                    id: conferenceTestData.endpoints[0].id,
                    displayName: 'Endpoint 1 Updated',
                    status: EndpointStatus.InConsultation,
                    participantsLinked: null,
                    room: { label: 'Room 1', locked: false }
                } as VHEndpoint
            ];
            const result = conferenceReducer(
                existingInitialState,
                ConferenceActions.updateExistingEndpoints({
                    conferenceId: conferenceTestData.id,
                    endpoints: newEndpointsList
                })
            );

            expect(result.currentConference.endpoints.length).toEqual(2);
            expect(result.currentConference.endpoints[0].displayName).toEqual('Endpoint 1 Updated');
            expect(result.currentConference.endpoints[0].status).toEqual(EndpointStatus.InConsultation);
            expect(result.currentConference.endpoints[0].participantsLinked).toEqual(null);
            expect(result.currentConference.endpoints[0].room.label).toEqual('Room 1');
            expect(result.currentConference.endpoints[1]).toEqual(conferenceTestData.endpoints[1]);

            expect(result.availableRooms.length).toEqual(1);
            expect(result.availableRooms[0].label).toEqual('Room 1');
        });
    });

    describe('removeExistingEndpoints actions', () => {
        it('should return the previous state if the conference does not exist', () => {
            const result = conferenceReducer(
                initialState,
                ConferenceActions.removeExistingEndpoints({
                    conferenceId: conferenceTestData.id,
                    removedEndpointIds: [conferenceTestData.endpoints[0].id]
                })
            );

            expect(result).toBe(initialState);
        });

        it('should return the previous state if the conference id does not match', () => {
            const result = conferenceReducer(
                existingInitialState,
                ConferenceActions.removeExistingEndpoints({
                    conferenceId: 'unknown',
                    removedEndpointIds: [conferenceTestData.endpoints[0].id]
                })
            );

            expect(result).toBe(existingInitialState);
        });

        it('should remove the existing endpoints', () => {
            const result = conferenceReducer(
                existingInitialState,
                ConferenceActions.removeExistingEndpoints({
                    conferenceId: conferenceTestData.id,
                    removedEndpointIds: [conferenceTestData.endpoints[0].id]
                })
            );

            expect(result.currentConference.endpoints.length).toEqual(1);
            expect(result.currentConference.endpoints[0]).toEqual(conferenceTestData.endpoints[1]);
        });
    });

    describe('addNewEndpoints actions', () => {
        it('should return the previous state if the conference does not exist', () => {
            const result = conferenceReducer(
                initialState,
                ConferenceActions.addNewEndpoints({
                    conferenceId: conferenceTestData.id,
                    endpoints: conferenceTestData.endpoints
                })
            );

            expect(result).toBe(initialState);
        });

        it('should return the previous state if the conference id does not match', () => {
            const result = conferenceReducer(
                existingInitialState,
                ConferenceActions.addNewEndpoints({
                    conferenceId: 'unknown',
                    endpoints: conferenceTestData.endpoints
                })
            );

            expect(result).toBe(existingInitialState);
        });

        it('should add the new endpoints', () => {
            const newEndpointsList: VHEndpoint[] = [
                {
                    id: conferenceTestData.endpoints[0].id,
                    displayName: 'Endpoint 1 Updated',
                    status: EndpointStatus.Connected,
                    participantsLinked: null,
                    room: null
                },
                {
                    id: '0f497ffa-802c-4dfb-a3f2-208de0c10df1',
                    displayName: 'Endpoint New',
                    status: EndpointStatus.Connected,
                    participantsLinked: ['chris.green@test.com'],
                    room: null
                }
            ];
            const result = conferenceReducer(
                existingInitialState,
                ConferenceActions.addNewEndpoints({
                    conferenceId: conferenceTestData.id,
                    endpoints: newEndpointsList
                })
            );

            // should ignore the first endpoint as it already exists
            expect(result.currentConference.endpoints.length).toEqual(3);
            expect(result.currentConference.endpoints[0]).toEqual(conferenceTestData.endpoints[0]);
            expect(result.currentConference.endpoints[1]).toEqual(conferenceTestData.endpoints[1]);

            // should add the new endpoint
            expect(result.currentConference.endpoints[2].displayName).toEqual('Endpoint New');
            expect(result.currentConference.endpoints[2].status).toEqual(EndpointStatus.Connected);
            expect(result.currentConference.endpoints[2].participantsLinked).toContain('chris.green@test.com');
        });
    });

    describe('upsertPexipParticipant action', () => {
        it('should add pexip info to the participant', () => {
            existingInitialState = { ...existingInitialState, loggedInParticipant: conferenceTestData.participants[0] };

            const pexipParticipant = {
                isRemoteMuted: false,
                isSpotlighted: false,
                handRaised: false,
                isVideoMuted: false,
                pexipDisplayName: `1922_John Doe${conferenceTestData.participants[0].id}`,
                uuid: '1922_John Doe',
                callTag: 'john-call-tag',
                isAudioOnlyCall: false,
                isVideoCall: true,
                protocol: 'sip',
                sentAudioMixes: [{ mix_name: 'main', prominent: false }],
                receivingAudioMix: 'main',
                role: 'Guest'
            };
            const result = conferenceReducer(
                existingInitialState,
                ConferenceActions.upsertPexipParticipant({ participant: pexipParticipant })
            );

            expect(result.currentConference.participants[0].pexipInfo).toEqual(pexipParticipant);
            expect(result.loggedInParticipant.pexipInfo).toEqual(pexipParticipant);
        });

        it('should update-wowza participant', () => {
            const pexipParticipant = {
                isRemoteMuted: false,
                isSpotlighted: false,
                handRaised: false,
                isVideoMuted: false,
                pexipDisplayName: 'vh-wowza',
                uuid: 'wowza12345',
                callTag: 'wowza',
                isAudioOnlyCall: true,
                isVideoCall: false,
                protocol: 'sip',
                sentAudioMixes: [{ mix_name: 'main', prominent: false }],
                receivingAudioMix: 'main',
                role: 'Guest'
            };
            const result = conferenceReducer(
                existingInitialState,
                ConferenceActions.upsertPexipParticipant({ participant: pexipParticipant })
            );

            expect(result.wowzaParticipant?.uuid).toEqual(pexipParticipant.uuid);
        });

        it('should add pexip info to the endpoint', () => {
            const pexipParticipant = {
                isRemoteMuted: false,
                isSpotlighted: false,
                isVideoMuted: false,
                handRaised: false,
                pexipDisplayName: `PTSN;${conferenceTestData.endpoints[0].displayName};${conferenceTestData.endpoints[0].id}`,
                uuid: '1922_John Doe',
                callTag: 'john-call-tag',
                isAudioOnlyCall: false,
                isVideoCall: true,
                protocol: 'sip',
                sentAudioMixes: [{ mix_name: 'main', prominent: false }],
                receivingAudioMix: 'main',
                role: 'Guest'
            };
            const result = conferenceReducer(
                existingInitialState,
                ConferenceActions.upsertPexipParticipant({ participant: pexipParticipant })
            );

            expect(result.currentConference.endpoints[0].pexipInfo).toEqual(pexipParticipant);
        });

        it('should ignore pexip info to if participant is not on the list', () => {
            const pexipParticipant = {
                isRemoteMuted: false,
                isSpotlighted: false,
                handRaised: false,
                isVideoMuted: false,
                pexipDisplayName: '1922_John Doe_unknown',
                uuid: '1922_John Doe',
                callTag: 'john-call-tag',
                isAudioOnlyCall: false,
                isVideoCall: true,
                protocol: 'sip',
                sentAudioMixes: [{ mix_name: 'main', prominent: false }],
                receivingAudioMix: 'main',
                role: 'Guest'
            };
            const result = conferenceReducer(
                existingInitialState,
                ConferenceActions.upsertPexipParticipant({ participant: pexipParticipant })
            );

            expect(result.currentConference.participants[0].pexipInfo).toBeFalsy();
        });
    });

    describe('deletePexipParticipant action', () => {
        it('should remove wowza participant', () => {
            const initialStateWithPexipInfo = {
                ...existingInitialState,
                currentConference: {
                    ...existingInitialState.currentConference,
                    participants: [
                        {
                            ...existingInitialState.currentConference.participants[0],
                            pexipInfo: {
                                isRemoteMuted: false,
                                isSpotlighted: false,
                                handRaised: false,
                                isVideoMuted: false,
                                pexipDisplayName: 'vh-wowza',
                                uuid: 'wowza',
                                callTag: 'wowza',
                                isAudioOnlyCall: true,
                                isVideoCall: false,
                                protocol: 'sip',
                                sentAudioMixes: [{ mix_name: 'main', prominent: false }],
                                receivingAudioMix: 'main',
                                role: 'Guest'
                            }
                        }
                    ]
                }
            };
            const result = conferenceReducer(
                initialStateWithPexipInfo,
                ConferenceActions.deletePexipParticipant({ pexipUUID: 'vh-wowza' })
            );

            expect(result.wowzaParticipant).toBeFalsy();
        });

        it('should remove pexip info from the endpoint', () => {
            const initialStateWithPexipInfo: ConferenceState = {
                ...existingInitialState,
                currentConference: {
                    ...existingInitialState.currentConference,
                    endpoints: [
                        {
                            ...existingInitialState.currentConference.endpoints[0],
                            pexipInfo: {
                                isRemoteMuted: false,
                                isSpotlighted: false,
                                isVideoMuted: false,
                                handRaised: false,
                                pexipDisplayName: `1922_John Doe${conferenceTestData.endpoints[0].id}`,
                                uuid: '1922_John Doe',
                                callTag: 'john-call-tag',
                                isAudioOnlyCall: false,
                                isVideoCall: true,
                                protocol: 'sip',
                                sentAudioMixes: [{ mix_name: 'main', prominent: false }],
                                receivingAudioMix: 'main',
                                role: 'Guest'
                            }
                        }
                    ]
                }
            };
            const result = conferenceReducer(
                initialStateWithPexipInfo,
                ConferenceActions.deletePexipParticipant({ pexipUUID: '1922_John Doe' })
            );

            expect(result.currentConference.endpoints[0].pexipInfo).toBeFalsy();
        });

        it('should ignore pexip info to if participant is not on the list', () => {
            const initialStateWithPexipInfo = {
                ...existingInitialState,
                currentConference: {
                    ...existingInitialState.currentConference,
                    participants: [
                        {
                            ...existingInitialState.currentConference.participants[0],
                            pexipInfo: {
                                isRemoteMuted: false,
                                isSpotlighted: false,
                                handRaised: false,
                                isVideoMuted: false,
                                pexipDisplayName: `1922_John Doe${conferenceTestData.participants[0].id}`,
                                uuid: '1922_John Doe',
                                callTag: 'john-call-tag',
                                isAudioOnlyCall: false,
                                isVideoCall: true,
                                protocol: 'sip',
                                role: 'Guest',
                                sentAudioMixes: [{ mix_name: 'main', prominent: false }],
                                receivingAudioMix: 'main'
                            }
                        }
                    ]
                }
            };
            const result = conferenceReducer(initialStateWithPexipInfo, ConferenceActions.deletePexipParticipant({ pexipUUID: 'unknown' }));

            expect(result.currentConference.participants[0].pexipInfo).toBeTruthy();
        });

        it('should update wowza participant if pexip dispaly name contains wowza keyword', () => {
            const initialStateWithPexipInfo = {
                ...existingInitialState,
                currentConference: {
                    ...existingInitialState.currentConference,
                    participants: [
                        {
                            ...existingInitialState.currentConference.participants[0],
                            pexipInfo: {
                                isRemoteMuted: false,
                                isSpotlighted: false,
                                handRaised: false,
                                pexipDisplayName: `vh-wowza-${conferenceTestData.participants[0].id}`,
                                uuid: '1922_John Doe',
                                callTag: 'john-call-tag',
                                isAudioOnlyCall: false,
                                isVideoCall: true,
                                role: 'Guest',
                                protocol: 'sip',
                                sentAudioMixes: [{ mix_name: 'main', prominent: false }],
                                receivingAudioMix: 'main'
                            } as VHPexipParticipant
                        }
                    ]
                }
            };
            const result = conferenceReducer(
                initialStateWithPexipInfo,
                ConferenceActions.deletePexipParticipant({ pexipUUID: '1922_John Doe' })
            );

            expect(result.currentConference.participants[0].pexipInfo).toBeFalsy();
        });
    });

    describe('updateRoom action', () => {
        it('should update the room in the available rooms list', () => {
            const updatedRoom = {
                label: 'Room 999',
                locked: true
            };
            const result = conferenceReducer(existingInitialState, ConferenceActions.updateRoom({ room: updatedRoom }));

            expect(result.availableRooms.length).toEqual(1);
            expect(result.availableRooms[0].label).toEqual('Room 999');
            expect(result.availableRooms[0].locked).toBeTrue();

            // John Doe
            expect(result.currentConference.participants[0].room).toEqual(updatedRoom);
            // Chris Green
            expect(result.currentConference.participants[2].room).toEqual(updatedRoom);
            // Endpoint 1
            expect(result.currentConference.endpoints[0].room).toEqual(updatedRoom);
        });

        it('should add the room to the available rooms list', () => {
            const newRoom: VHRoom = {
                label: 'Room 998',
                locked: false
            };
            const result = conferenceReducer(existingInitialState, ConferenceActions.updateRoom({ room: newRoom }));

            expect(result.availableRooms.length).toEqual(2);
            expect(result.availableRooms[1].label).toEqual('Room 998');
        });
    });

    describe('updateParticipantRoom action', () => {
        it('should return the previous state if the conference does not exist', () => {
            const result = conferenceReducer(
                initialState,
                ConferenceActions.updateParticipantRoom({
                    participantId: conferenceTestData.participants[0].id,
                    fromRoom: 'Room 999',
                    toRoom: 'Room 998'
                })
            );

            expect(result).toBe(initialState);
        });

        it('should return the previous state if the participant id does not match participant or an endpoint', () => {
            const result = conferenceReducer(
                existingInitialState,
                ConferenceActions.updateParticipantRoom({
                    participantId: 'unknown',
                    fromRoom: 'Room 999',
                    toRoom: 'Room 998'
                })
            );

            expect(result).toBe(existingInitialState);
        });

        it('should update the participant room and set current room when room is a consultation room', () => {
            const result = conferenceReducer(
                existingInitialState,
                ConferenceActions.updateParticipantRoom({
                    participantId: conferenceTestData.participants[0].id,
                    fromRoom: 'Room 999',
                    toRoom: 'Consultation Room 1'
                })
            );

            expect(result.currentConference.participants[0].room.label).toEqual('Consultation Room 1');
            expect(result.currentConference.participants[0].room.locked).toBeFalse();

            expect(result.availableRooms.length).toEqual(2);
        });

        it('should update the participant room and set current room when room is a hearing room', () => {
            const result = conferenceReducer(
                existingInitialState,
                ConferenceActions.updateParticipantRoom({
                    participantId: conferenceTestData.participants[0].id,
                    fromRoom: 'Room 999',
                    toRoom: 'Hearing Room 1'
                })
            );

            expect(result.currentConference.participants[0].room).toBeNull();
        });

        it('should update the endpoint room and set the current room when room is a consultation room', () => {
            const result = conferenceReducer(
                existingInitialState,
                ConferenceActions.updateParticipantRoom({
                    participantId: conferenceTestData.endpoints[0].id,
                    fromRoom: 'Room 999',
                    toRoom: 'Consultation Room 1'
                })
            );

            expect(result.currentConference.endpoints[0].room.label).toEqual('Consultation Room 1');
            expect(result.currentConference.endpoints[0].room.locked).toBeFalse();
        });

        it('should update the endpoint room and set the current room when room is a hearing room', () => {
            const result = conferenceReducer(
                existingInitialState,
                ConferenceActions.updateParticipantRoom({
                    participantId: conferenceTestData.endpoints[0].id,
                    fromRoom: 'Room 999',
                    toRoom: 'Hearing Room 1'
                })
            );

            expect(result.currentConference.endpoints[0].room).toBeNull();
        });

        it('should update the conference state, after host changes their display name', () => {
            const result = conferenceReducer(
                existingInitialState,
                ConferenceActions.updateParticipantDisplayNameSuccess({
                    participantId: conferenceTestData.participants[0].id,
                    displayName: 'New Name',
                    conferenceId: conferenceTestData.id
                })
            );

            expect(result.currentConference.participants[0].displayName).toBe('New Name');
        });
    });

    describe('loadLoggedInParticipantSuccess action', () => {
        it('should set the logged in participant', () => {
            const participant = conferenceTestData.participants[0];
            const result = conferenceReducer(
                existingInitialState,
                ConferenceActions.loadLoggedInParticipantSuccess({ participant: participant })
            );

            expect(result.loggedInParticipant).toEqual(participant);
        });
    });

    describe('updateAudioMix action', () => {
        it('should update the audio mix of the participant to main court', () => {
            const result = conferenceReducer(
                existingInitialState,
                ConferenceActions.updateAudioMix({
                    participant: conferenceTestData.participants[0],
                    mainCourt: true,
                    interpreterLanguage: undefined
                })
            );

            expect(result.currentConference.participants[0].currentAudioMix).toEqual('main');
        });

        it('should update the audio mix of the participant to a specific language', () => {
            const result = conferenceReducer(
                existingInitialState,
                ConferenceActions.updateAudioMix({
                    participant: conferenceTestData.participants[0],
                    mainCourt: false,
                    interpreterLanguage: { code: 'en', description: 'English', type: InterpreterType.Verbal }
                })
            );

            expect(result.currentConference.participants[0].currentAudioMix).toEqual('en');
        });
    });

    describe('countdownComplete action', () => {
        it('should update the count down complete conference state', () => {
            const result = conferenceReducer(
                existingInitialState,
                ConferenceActions.countdownComplete({
                    conferenceId: conferenceTestData.id
                })
            );
            expect(result.currentConference.countdownComplete).toEqual(true);
        });

        it('should return current state if conference id does not match', () => {
            const result = conferenceReducer(
                existingInitialState,
                ConferenceActions.countdownComplete({
                    conferenceId: 'unknown'
                })
            );
            expect(result).toEqual(existingInitialState);
        });
    });

    describe('upsertConsultationCallStatus action', () => {
        it('should add the consultation call status to the list', () => {
            const expectedConsultationStatus: VHConsultationCallStatus = {
                callStatus: 'Transferring...',
                participantId: conferenceTestData.participants[0].id,
                invitationId: '1234',
                requestedBy: conferenceTestData.participants[1].id,
                requestedFor: conferenceTestData.participants[0].id,
                roomLabel: 'Room 1'
            };
            const result = conferenceReducer(
                existingInitialState,
                ConferenceActions.upsertConsultationCallStatus({
                    callStatus: 'Transferring...',
                    participantId: conferenceTestData.participants[0].id,
                    invitationId: '1234',
                    requestedBy: conferenceTestData.participants[1].id,
                    requestedFor: conferenceTestData.participants[0].id,
                    conferenceId: conferenceTestData.id,
                    roomLabel: 'Room 1'
                })
            );

            expect(result.consultationStatuses.length).toEqual(1);
            expect(result.consultationStatuses[0]).toEqual(expectedConsultationStatus);
        });

        it('should update the consultation call status in the list', () => {
            const consultationStatus: VHConsultationCallStatus = {
                callStatus: 'Calling...',
                participantId: conferenceTestData.participants[0].id,
                invitationId: '1234',
                requestedBy: conferenceTestData.participants[1].id,
                requestedFor: conferenceTestData.participants[0].id,
                roomLabel: 'Room 1'
            };
            const result = conferenceReducer(
                {
                    ...existingInitialState,
                    consultationStatuses: [consultationStatus]
                },
                ConferenceActions.upsertConsultationCallStatus({
                    callStatus: 'Transferring...',
                    participantId: conferenceTestData.participants[0].id,
                    invitationId: '1234',
                    requestedBy: conferenceTestData.participants[1].id,
                    requestedFor: conferenceTestData.participants[0].id,
                    conferenceId: conferenceTestData.id,
                    roomLabel: 'Room 1'
                })
            );

            expect(result.consultationStatuses.length).toEqual(1);
            expect(result.consultationStatuses[0].callStatus).toEqual('Transferring...');
        });

        it('should upsert the consultation call status and apply "Protected" status to that of participants protected from the participant', () => {
            let participant = conferenceTestData.participants.find(x => x.role === Role.Individual);
            const protectedParticipant = conferenceTestData.participants.find(x => x.role === Role.Representative);

            const judge = conferenceTestData.participants.find(x => x.role === Role.Judge);
            participant = { ...participant, protectedFrom: [protectedParticipant.externalReferenceId] };
            participant.protectedFrom = [protectedParticipant.externalReferenceId];

            const conferenceWithScreening: VHConference = {
                ...conferenceTestData,
                participants: [participant, judge, protectedParticipant]
            };

            const initialStateWithScreening: ConferenceState = {
                ...initialState,
                currentConference: conferenceWithScreening
            };

            const expectedConsultationStatus: VHConsultationCallStatus[] = [
                {
                    callStatus: 'Protected',
                    participantId: protectedParticipant.id
                } as VHConsultationCallStatus,

                {
                    callStatus: 'Calling...',
                    participantId: participant.id,
                    invitationId: '1234',
                    requestedBy: judge.id,
                    requestedFor: participant.id,
                    roomLabel: 'Room 1'
                }
            ];
            const result = conferenceReducer(
                {
                    ...initialStateWithScreening,
                    consultationStatuses: []
                },
                ConferenceActions.upsertConsultationCallStatus({
                    callStatus: 'Calling...',
                    participantId: participant.id,
                    invitationId: '1234',
                    requestedBy: judge.id,
                    requestedFor: participant.id,
                    conferenceId: conferenceTestData.id,
                    roomLabel: 'Room 1'
                })
            );

            expect(result.consultationStatuses).toEqual(expectedConsultationStatus);
        });
    });

    describe('consultationResponded action', () => {
        it('should update the consultation call status in the list', () => {
            const invitationId = '1234';
            const roomLabel = 'Room 1';
            const participant = conferenceTestData.participants.find(x => x.role === Role.Individual);
            const representative = conferenceTestData.participants.find(x => x.role === Role.Representative);

            const consultationStatus: VHConsultationCallStatus = {
                callStatus: 'Calling...',
                participantId: participant.id,
                invitationId,
                requestedBy: representative.id,
                requestedFor: participant.id,
                roomLabel
            };
            const result = conferenceReducer(
                {
                    ...existingInitialState,
                    consultationStatuses: [consultationStatus]
                },
                ConferenceActions.consultationResponded({
                    invitationId,
                    answer: ConsultationAnswer.Accepted,
                    conferenceId: conferenceTestData.id,
                    requestedFor: participant.id,
                    responseInitiatorId: participant.id,
                    roomLabel
                })
            );

            const expectedConsultationStatus: VHConsultationCallStatus = {
                callStatus: 'Accepted',
                participantId: participant.id,
                invitationId,
                requestedBy: representative.id,
                requestedFor: participant.id,
                roomLabel
            };
            expect(result.consultationStatuses).toEqual([expectedConsultationStatus]);
        });

        it('should ignore update the consultation call status for an invitation id that does not exist', () => {
            const invitationId = '1234';
            const roomLabel = 'Room 1';
            const participant = conferenceTestData.participants.find(x => x.role === Role.Judge);
            const judge = conferenceTestData.participants.find(x => x.role === Role.Judge);
            const representative = conferenceTestData.participants.find(x => x.role === Role.Representative);

            const consultationStatus: VHConsultationCallStatus = {
                callStatus: 'Calling...',
                participantId: participant.id,
                invitationId,
                requestedBy: representative.id,
                requestedFor: participant.id,
                roomLabel
            };
            const result = conferenceReducer(
                {
                    ...existingInitialState,
                    consultationStatuses: [consultationStatus]
                },
                ConferenceActions.consultationResponded({
                    invitationId: '3456',
                    answer: ConsultationAnswer.Accepted,
                    conferenceId: conferenceTestData.id,
                    requestedFor: judge.id,
                    responseInitiatorId: participant.id,
                    roomLabel
                })
            );

            const expectedConsultationStatus: VHConsultationCallStatus = {
                callStatus: 'Calling...',
                participantId: participant.id,
                invitationId,
                requestedBy: representative.id,
                requestedFor: participant.id,
                roomLabel
            };
            expect(result.consultationStatuses).toEqual([expectedConsultationStatus]);
        });
    });

    describe('clearConsultationCallStatus action', () => {
        it('should remove the consultation call status from the list', () => {
            const invitationId = '1234';
            const roomLabel = 'Room 1';
            const participant = conferenceTestData.participants.find(x => x.role === Role.Individual);
            const representative = conferenceTestData.participants.find(x => x.role === Role.Representative);

            const consultationStatus: VHConsultationCallStatus = {
                callStatus: 'Calling...',
                participantId: participant.id,
                invitationId,
                requestedBy: representative.id,
                requestedFor: participant.id,
                roomLabel
            };
            const result = conferenceReducer(
                {
                    ...existingInitialState,
                    consultationStatuses: [consultationStatus]
                },
                ConferenceActions.clearConsultationCallStatus({
                    invitationId,
                    requestedFor: participant.id
                })
            );

            expect(result.consultationStatuses.length).toEqual(0);
        });
    });

    describe('toggleAudioMuteSuccess action', () => {
        it('should update the audio mute status of the participant', () => {
            const participant = conferenceTestData.participants[0];
            const result = conferenceReducer(
                existingInitialState,
                VideoCallActions.toggleAudioMuteSuccess({
                    participantId: participant.id,
                    isMuted: true
                })
            );

            expect(result.currentConference.participants[0].localMediaStatus.isMicrophoneMuted).toBeTrue();
        });
    });

    describe('toggleOutgoingVideoSuccess action', () => {
        it('should update the video mute status of the participant', () => {
            const participant = conferenceTestData.participants[0];
            const result = conferenceReducer(
                existingInitialState,
                VideoCallActions.toggleOutgoingVideoSuccess({
                    participantId: participant.id,
                    isVideoOn: true
                })
            );

            expect(result.currentConference.participants[0].localMediaStatus.isCameraOff).toBeFalse();
        });
    });

    describe('admitParticipantFailure action', () => {
        it('should update the participant transfer direction to undefined', () => {
            const participant = conferenceTestData.participants[0];
            const initialStateWithTransferDirection: ConferenceState = {
                ...existingInitialState,
                currentConference: {
                    ...existingInitialState.currentConference,
                    participants: [
                        {
                            ...participant,
                            transferDirection: TransferDirection.In
                        }
                    ]
                }
            };
            const result = conferenceReducer(
                initialStateWithTransferDirection,
                VideoCallHostActions.admitParticipantFailure({
                    conferenceId: conferenceTestData.id,
                    participantId: participant.id,
                    error: new Error('Failed to admit participant')
                })
            );

            expect(result.currentConference.participants[0].transferDirection).toBeUndefined();
        });
    });

    describe('retrieveSelfTestScoreSuccess', () => {
        it('should update the self test score of the participant', () => {
            const participant = conferenceTestData.participants[0];
            const selfTestScore = new TestCallScoreResponse({
                score: TestScore.Okay,
                passed: true
            });
            const result = conferenceReducer(
                existingInitialState,
                SelfTestActions.retrieveSelfTestScoreSuccess({
                    participantId: participant.id,
                    score: selfTestScore
                })
            );

            expect(result.selfTestScore).toEqual(selfTestScore);
        });
    });

    describe('loadUserProfileSuccess', () => {
        it('should update the user profile', () => {
            const userProfile: UserProfile = {
                roles: [Role.Individual],
                displayName: 'Chris Green',
                firstName: 'Chris',
                lastName: 'Green',
                name: 'Chris Green',
                username: 'chris@green.com'
            };

            const result = conferenceReducer(
                existingInitialState,
                AuthActions.loadUserProfileSuccess({
                    userProfile: userProfile
                })
            );

            expect(result.userProfile).toEqual(userProfile);
        });
    });

    describe('startHearing', () => {
        it('should ignore action for another conference', () => {
            const initialAudioRecordingState: ConferenceState = {
                ...existingInitialState,
                audioRecordingState: {
                    restartInProgress: true,
                    continueWithoutRecording: false,
                    recordingPaused: false,
                    wowzaConnectedAsAudioOnly: false,
                    restartNotificationDisplayed: false
                }
            };
            const result = conferenceReducer(
                initialAudioRecordingState,
                VideoCallHostActions.startHearing({
                    conferenceId: 'unknown'
                })
            );

            expect(result.audioRecordingState.restartInProgress).toBeTrue();
        });

        it('should reset audio recording restart in progress to false when hearing starts', () => {
            const initialAudioRecordingState: ConferenceState = {
                ...existingInitialState,
                audioRecordingState: {
                    restartInProgress: true,
                    continueWithoutRecording: false,
                    recordingPaused: false,
                    wowzaConnectedAsAudioOnly: false,
                    restartNotificationDisplayed: false
                }
            };
            const result = conferenceReducer(
                initialAudioRecordingState,
                VideoCallHostActions.startHearing({
                    conferenceId: conferenceTestData.id
                })
            );

            expect(result.audioRecordingState.restartInProgress).toBeFalse();
        });
    });

    describe('pauseAudioRecordingSuccess', () => {
        it('should ignore action for another conference', () => {
            const initialAudioRecordingState: ConferenceState = {
                ...existingInitialState,
                audioRecordingState: {
                    restartInProgress: true,
                    continueWithoutRecording: false,
                    recordingPaused: false,
                    wowzaConnectedAsAudioOnly: false,
                    restartNotificationDisplayed: false
                }
            };
            const result = conferenceReducer(
                initialAudioRecordingState,
                AudioRecordingActions.pauseAudioRecordingSuccess({
                    conferenceId: 'unknown'
                })
            );

            expect(result.audioRecordingState.recordingPaused).toBeFalse();
            expect(result.audioRecordingState.restartInProgress).toBeTrue();
        });

        it('should set the audio recording state to paused', () => {
            const initialAudioRecordingState: ConferenceState = {
                ...existingInitialState,
                audioRecordingState: {
                    restartInProgress: true,
                    continueWithoutRecording: false,
                    recordingPaused: false,
                    wowzaConnectedAsAudioOnly: false,
                    restartNotificationDisplayed: false
                }
            };
            const result = conferenceReducer(
                initialAudioRecordingState,
                AudioRecordingActions.pauseAudioRecordingSuccess({
                    conferenceId: conferenceTestData.id
                })
            );

            expect(result.audioRecordingState.recordingPaused).toBeTrue();
            expect(result.audioRecordingState.restartInProgress).toBeFalse();
        });
    });

    describe('resumeAudioRecording', () => {
        it('should ignore action for another conference', () => {
            const initialAudioRecordingState: ConferenceState = {
                ...existingInitialState,
                audioRecordingState: {
                    restartInProgress: false,
                    continueWithoutRecording: false,
                    recordingPaused: false,
                    wowzaConnectedAsAudioOnly: false,
                    restartNotificationDisplayed: false
                }
            };
            const result = conferenceReducer(
                initialAudioRecordingState,
                AudioRecordingActions.resumeAudioRecording({
                    conferenceId: 'unknown'
                })
            );

            expect(result.audioRecordingState.restartInProgress).toBeFalse();
        });

        it('should set the audio recording state to resumed', () => {
            const initialAudioRecordingState: ConferenceState = {
                ...existingInitialState,
                audioRecordingState: {
                    restartInProgress: false,
                    continueWithoutRecording: false,
                    recordingPaused: true,
                    wowzaConnectedAsAudioOnly: false,
                    restartNotificationDisplayed: false
                }
            };
            const result = conferenceReducer(
                initialAudioRecordingState,
                AudioRecordingActions.resumeAudioRecording({
                    conferenceId: conferenceTestData.id
                })
            );

            expect(result.audioRecordingState.restartInProgress).toBeTrue();
        });
    });

    describe('audioRecordingRestarted', () => {
        it('should ignore action for another conference', () => {
            const initialAudioRecordingState: ConferenceState = {
                ...existingInitialState,
                audioRecordingState: {
                    restartInProgress: false,
                    continueWithoutRecording: false,
                    recordingPaused: false,
                    wowzaConnectedAsAudioOnly: false,
                    restartNotificationDisplayed: false
                }
            };
            const result = conferenceReducer(
                initialAudioRecordingState,
                AudioRecordingActions.audioRecordingRestarted({
                    conferenceId: 'unknown'
                })
            );

            expect(result.audioRecordingState.restartInProgress).toBeFalse();
        });

        it('should set the audio recording state to restarted', () => {
            const initialAudioRecordingState: ConferenceState = {
                ...existingInitialState,
                audioRecordingState: {
                    restartInProgress: false,
                    continueWithoutRecording: false,
                    recordingPaused: true,
                    wowzaConnectedAsAudioOnly: false,
                    restartNotificationDisplayed: false
                }
            };
            const result = conferenceReducer(
                initialAudioRecordingState,
                AudioRecordingActions.audioRecordingRestarted({
                    conferenceId: conferenceTestData.id
                })
            );

            expect(result.audioRecordingState.restartInProgress).toBeTrue();
        });
    });

    describe('resumeAudioRecordingSuccess', () => {
        it('should ignore action for another conference', () => {
            const initialAudioRecordingState: ConferenceState = {
                ...existingInitialState,
                audioRecordingState: {
                    restartInProgress: true,
                    continueWithoutRecording: false,
                    recordingPaused: true,
                    wowzaConnectedAsAudioOnly: false,
                    restartNotificationDisplayed: false
                }
            };
            const result = conferenceReducer(
                initialAudioRecordingState,
                AudioRecordingActions.resumeAudioRecordingSuccess({
                    conferenceId: 'unknown'
                })
            );

            expect(result.audioRecordingState.recordingPaused).toBeTrue();
            expect(result.audioRecordingState.restartInProgress).toBeTrue();
        });

        it('should set the audio recording state to resumed', () => {
            const initialAudioRecordingState: ConferenceState = {
                ...existingInitialState,
                audioRecordingState: {
                    restartInProgress: true,
                    continueWithoutRecording: false,
                    recordingPaused: true,
                    wowzaConnectedAsAudioOnly: false,
                    restartNotificationDisplayed: false
                }
            };
            const result = conferenceReducer(
                initialAudioRecordingState,
                AudioRecordingActions.resumeAudioRecordingSuccess({
                    conferenceId: conferenceTestData.id
                })
            );

            expect(result.audioRecordingState.restartInProgress).toBeFalse();
            expect(result.audioRecordingState.recordingPaused).toBeFalse();
        });
    });
});
