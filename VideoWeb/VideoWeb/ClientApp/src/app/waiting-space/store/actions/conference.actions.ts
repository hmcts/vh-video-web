import { createActionGroup, props } from '@ngrx/store';
import { VHConference, VHEndpoint, VHParticipant, VHPexipParticipant, VHRoom } from '../models/vh-conference';
import { ConferenceStatus, ConsultationAnswer, HearingLayout, ParticipantStatus } from 'src/app/services/clients/api-client';
import { ParticipantMediaStatus } from 'src/app/shared/models/participant-media-status';

export const ConferenceActions = createActionGroup({
    source: 'Conference',
    events: {
        // 'Load Conferences': props<{ conferenceId: string }>(), // TOOD: get components to use this action and create a side effect
        'Load Conferences Success': props<{ data: VHConference }>(),
        'Load Conferences Failure': props<{ error: Error }>(),

        'Update Active Conference Status': props<{ conferenceId: string; status: ConferenceStatus }>(),
        'Update Participant Status': props<{ conferenceId: string; participantId: string; status: ParticipantStatus }>(),

        'Update Participant List': props<{ conferenceId: string; participants: VHParticipant[] }>(),
        'Update Endpoint List': props<{ conferenceId: string; endpoints: VHEndpoint[] }>(),

        'Upsert Pexip Participant': props<{ participant: VHPexipParticipant }>(),

        'Update Participant Media Status': props<{ participantId: string; conferenceId: string; mediaStatus: ParticipantMediaStatus }>(),
        'Update Participant Remote Mute Status': props<{ participantId: string; conferenceId: string; isRemoteMuted: boolean }>(),
        'Update Participant Local Mute Status': props<{ participantId: string; conferenceId: string; isMuted: boolean }>(),
        'Update Participant Hand Raised': props<{ participantId: string; conferenceId: string; hasHandRaised: boolean }>(),

        'Update Room': props<{ room: VHRoom }>(),
        'Update Participant Room': props<{ participantId: string; fromRoom: string; toRoom: string }>(),

        // create side effects for these actions to display toast notifications
        'Hearing Layout Changed': props<{
            conferenceId: string;
            changedById: string;
            newHearingLayout: HearingLayout;
            oldHearingLayout?: HearingLayout;
        }>(),
        'Unlink Participant From Endpoint': props<{ conferenceId: string; endpoint: string }>(),
        'Link Participant To Endpoint': props<{ conferenceId: string; endpoint: string }>(),
        'Close Consultation Between Endpoint And Participant': props<{ conferenceId: string; endpoint: string }>(),

        'Consultation Requested': props<{
            conferenceId: string;
            invitationId: string;
            roomLabel: string;
            requestedBy: string;
            requestedFor: string;
        }>(),

        'Consultation Responded': props<{
            conferenceId: string;
            invitationId: string;
            roomLabel: string;
            requestedFor: string;
            answer: ConsultationAnswer;
            responseInitiatorId: string;
        }>()
    }
});
