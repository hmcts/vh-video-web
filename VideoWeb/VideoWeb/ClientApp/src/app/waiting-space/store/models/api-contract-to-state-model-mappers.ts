import {
    ConferenceResponse,
    InterpreterLanguageResponse,
    ParticipantResponse,
    RoomSummaryResponse,
    VideoEndpointResponse
} from '../../../services/clients/api-client';
import {
    VHConference,
    VHEndpoint,
    VHInterpreterLanguage,
    VHParticipant,
    VHPexipConference,
    VHPexipParticipant,
    VHRoom
} from './vh-conference';
import { ConferenceUpdated, ParticipantUpdated } from '../../models/video-call-models';

export function mapConferenceToVHConference(conference: ConferenceResponse): VHConference {
    return {
        id: conference.id,
        scheduledDateTime: conference.scheduled_date_time,
        endDateTime: conference.closed_date_time,
        countdownComplete: conference.countdown_completed,
        duration: conference.scheduled_duration,
        caseNumber: conference.case_number,
        caseName: conference.case_name,
        caseType: conference.case_type,
        status: conference.status,
        isVenueScottish: conference.hearing_venue_is_scottish,
        participants: conference.participants.map(p => mapParticipantToVHParticipant(p)),
        endpoints: conference.endpoints.map(e => mapEndpointToVHEndpoint(e)),
        supplier: conference.supplier,
        audioRecordingIngestUrl: conference.ingest_url,
        audioRecordingRequired: conference.audio_recording_required,
        hearingVenueName: conference.hearing_venue_name,
        conferenceAlias: conference.participant_uri,
        pexipNodeUri: conference.pexip_node_uri,
        selfTestNodeUri: conference.pexip_self_test_node_uri
    };
}

export function mapParticipantToVHParticipant(participant: ParticipantResponse): VHParticipant {
    return {
        id: participant.id,
        name: participant.name,
        firstName: participant.first_name,
        lastName: participant.last_name,
        username: participant.user_name,
        status: participant.status,
        displayName: participant.display_name,
        tiledDisplayName: participant.tiled_display_name,
        role: participant.role,
        hearingRole: participant.hearing_role,
        representee: participant.representee,
        pexipInfo: null,
        room: participant.current_room ? mapRoomToVHRoom(participant.current_room) : null,
        interpreterLanguage: participant.interpreter_language
            ? mapInterpeterLanguageToVHInterpreterLanguage(participant.interpreter_language)
            : null,
        linkedParticipants:
            participant?.linked_participants?.map(lp => ({
                linkedId: lp.linked_id,
                linkedType: lp.link_type
            })) ?? [],
        externalReferenceId: participant.external_reference_id,
        protectedFrom: participant.protect_from ?? []
    };
}

export function mapEndpointToVHEndpoint(endpoint: VideoEndpointResponse): VHEndpoint {
    return {
        id: endpoint.id,
        displayName: endpoint.display_name,
        status: endpoint.status,
        participantsLinked: endpoint.participants_linked ?? [],
        room: endpoint.current_room ? mapRoomToVHRoom(endpoint.current_room) : null,
        interpreterLanguage: endpoint.interpreter_language
            ? mapInterpeterLanguageToVHInterpreterLanguage(endpoint.interpreter_language)
            : null,
        externalReferenceId: endpoint.external_reference_id,
        protectedFrom: endpoint.protect_from ?? []
    };
}

export function mapRoomToVHRoom(room: RoomSummaryResponse): VHRoom {
    return {
        label: room.label,
        locked: room.locked
    };
}

export function mapPexipParticipantToVHPexipParticipant(pexipParticipant: ParticipantUpdated) {
    return {
        ...pexipParticipant
    } as VHPexipParticipant;
}

export function mapPexipConferenceToVhPexipConference(pexipConference: ConferenceUpdated) {
    return {
        guestsMuted: pexipConference.guestedMuted,
        locked: pexipConference.locked,
        started: pexipConference.started
    } as VHPexipConference;
}

export function mapInterpeterLanguageToVHInterpreterLanguage(interpreterLanguage: InterpreterLanguageResponse): VHInterpreterLanguage {
    return {
        code: interpreterLanguage.code,
        description: interpreterLanguage.description,
        type: interpreterLanguage.type
    };
}
