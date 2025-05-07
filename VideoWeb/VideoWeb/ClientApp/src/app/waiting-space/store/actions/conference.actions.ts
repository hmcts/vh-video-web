import { createActionGroup, props } from '@ngrx/store';
import {
    VHConference,
    VHEndpoint,
    VHInterpreterLanguage,
    VHParticipant,
    VHPexipConference,
    VHPexipParticipant,
    VHRoom
} from '../models/vh-conference';
import {
    ConferenceStatus,
    ConsultationAnswer,
    EndpointStatus,
    HearingLayout,
    ParticipantStatus
} from 'src/app/services/clients/api-client';
import { ParticipantMediaStatus } from 'src/app/shared/models/participant-media-status';
import { TransferDirection } from '../../../services/models/hearing-transfer';
import { WaitingRoomUserRole } from '../../waiting-room-shared/models/waiting-room-user-role';

/* eslint-disable @typescript-eslint/naming-convention */
export const ConferenceActions = createActionGroup({
    source: 'Conference',
    events: {
        'Load Conference': props<{ conferenceId: string }>(), // TOOD: get components to use this action and create a side effect
        'Load Conference Success': props<{ conference: VHConference }>(),
        'Load Conference Failure': props<{ error: Error }>(),

        'Leave Conference': props<{ conferenceId: string }>(),

        'Countdown Complete': props<{ conferenceId: string }>(),

        'Update Active Conference Status': props<{ conferenceId: string; status: ConferenceStatus }>(),
        'Update Participant Status': props<{ conferenceId: string; participantId: string; status: ParticipantStatus; reason: string }>(),
        'Update Endpoint Status': props<{ conferenceId: string; endpointId: string; status: EndpointStatus }>(),

        'Load Logged In Participant': props<{ participantId: string }>(),
        'Load Logged In Participant Success': props<{ participant: VHParticipant }>(),

        'Update Participant List': props<{ conferenceId: string; participants: VHParticipant[] }>(),
        'Add New Endpoints': props<{ conferenceId: string; endpoints: VHEndpoint[] }>(),
        'Update Existing Endpoints': props<{ conferenceId: string; endpoints: VHEndpoint[] }>(),
        'Remove Existing Endpoints': props<{ conferenceId: string; removedEndpointIds: string[] }>(),

        'Upsert Pexip Conference': props<{ pexipConference: VHPexipConference }>(),
        'Create Pexip Participant': props<{ participant: VHPexipParticipant }>(),
        'Upsert Pexip Participant': props<{ participant: VHPexipParticipant }>(),
        'Delete Pexip Participant': props<{ pexipUUID: string }>(),

        'Update Participant Media Status': props<{ participantId: string; conferenceId: string; mediaStatus: ParticipantMediaStatus }>(),
        'Update Participant Remote Mute Status': props<{ participantId: string; conferenceId: string; isRemoteMuted: boolean }>(),
        'Update Participant Local Mute Status': props<{ participantId: string; conferenceId: string; isMuted: boolean }>(),
        'Update Participant Hand Raised': props<{ participantId: string; conferenceId: string; hasHandRaised: boolean }>(),

        'Send Transfer Request': props<{ conferenceId: string; participantId: string; transferDirection: TransferDirection }>(),
        'Update Participant Hearing Transfer Status': props<{
            participantId: string;
            conferenceId: string;
            transferDirection: TransferDirection;
        }>(),

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
        }>(),

        'Upsert Consultation Call Status': props<{
            conferenceId: string;
            participantId: string;
            callStatus: string;
            invitationId: string;
            roomLabel: string;
            requestedBy: string;
            requestedFor: string;
        }>(),

        'Clear Consultation Call Status': props<{
            requestedFor: string;
            invitationId: string;
        }>(),
        'Update Judge Display Name': props<{ participantId: string; displayName: string; conferenceId: string }>(),
        'Update StaffMember Display Name': props<{ participantId: string; displayName: string; conferenceId: string }>(),
        'Update Participant Display Name Success': props<{ participantId: string; displayName: string; conferenceId: string }>(),

        'Update Audio Mix': props<{ participant: VHParticipant; mainCourt: boolean; interpreterLanguage: VHInterpreterLanguage }>(),
        'Enter Waiting Room As NonHost': props<{ userRole: WaitingRoomUserRole }>()
    }
});
