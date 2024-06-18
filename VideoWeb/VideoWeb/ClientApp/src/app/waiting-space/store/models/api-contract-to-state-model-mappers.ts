import { ConferenceResponse, ParticipantResponse, RoomSummaryResponse, VideoEndpointResponse } from '../../../services/clients/api-client';
import { VHConference, VHEndpoint, VHParticipant, VHPexipParticipant, VHRoom } from './vh-conference';
import { ParticipantUpdated } from '../../models/video-call-models';

export function mapConferenceToVHConference(conference: ConferenceResponse): VHConference {
    return {
        id: conference.id,
        scheduledDateTime: conference.scheduled_date_time,
        endDateTime: conference.closed_date_time,
        duration: conference.scheduled_duration,
        caseNumber: conference.case_number,
        caseName: conference.case_name,
        status: conference.status,
        isVenueScottish: conference.hearing_venue_is_scottish,
        participants: conference.participants.map(p => mapParticipantToVHParticipant(p)),
        endpoints: conference.endpoints.map(e => mapEndpointToVHEndpoint(e))
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
        linkedParticipants:
            participant?.linked_participants.map(lp => ({
                linkedId: lp.linked_id,
                linkedType: lp.link_type
            })) ?? []
    };
}

export function mapEndpointToVHEndpoint(endpoint: VideoEndpointResponse): VHEndpoint {
    return {
        id: endpoint.id,
        displayName: endpoint.display_name,
        status: endpoint.status,
        defenceAdvocate: endpoint.defence_advocate_username,
        room: endpoint.current_room ? mapRoomToVHRoom(endpoint.current_room) : null
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
