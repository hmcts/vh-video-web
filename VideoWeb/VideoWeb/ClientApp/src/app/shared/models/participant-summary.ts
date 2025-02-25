import { ParticipantForUserResponse, ParticipantStatus, Role } from 'src/app/services/clients/api-client';
import { ParticipantHeartbeat } from '../../services/models/participant-heartbeat';
import { HearingRoleHelper } from '../helpers/hearing-role-helper';

export class ParticipantSummary {
    protected participant: ParticipantForUserResponse;
    protected participantHeartBeat: ParticipantHeartbeat;

    constructor(participant: ParticipantForUserResponse) {
        this.participant = participant;
    }

    get base(): ParticipantForUserResponse {
        return this.participant;
    }

    get id(): string {
        return this.participant.id;
    }

    get firstName(): string {
        return this.participant.first_name;
    }

    get lastName(): string {
        return this.participant.last_name;
    }

    get status(): ParticipantStatus {
        return this.participant.status;
    }

    get role(): Role {
        return this.participant.role;
    }

    get displayName(): string {
        return this.participant.display_name;
    }

    get representee(): string {
        return this.participant.representee;
    }

    get isJudge(): boolean {
        return this.participant.role === Role.Judge;
    }

    get hearingRole(): string {
        return this.participant.hearing_role;
    }

    get isParticipantPanelMember(): boolean {
        return HearingRoleHelper.isPanelMember(this.participant.hearing_role);
    }

    get participantHertBeatHealth(): ParticipantHeartbeat {
        return this.participantHeartBeat;
    }

    set status(status: ParticipantStatus) {
        this.participant.status = status;
    }

    set participantHertBeatHealth(participantHeartBeat: ParticipantHeartbeat) {
        this.participantHeartBeat = participantHeartBeat;
    }
}
