import { ParticipantForUserResponse, ParticipantStatus, Role, ParticipantForJudgeResponse } from 'src/app/services/clients/api-client';
import { ParticipantHeartbeat } from '../../services/models/participant-heartbeat';

export class ParticipantSummary {
    private participant: ParticipantForUserResponse;
    private participantHeartBeat: ParticipantHeartbeat;

    constructor(participant: ParticipantForUserResponse) {
        const isParticipantForUserResponse = participant instanceof ParticipantForUserResponse;
        const isParticipantForJudgeResponse = participant instanceof ParticipantForJudgeResponse;
        if (!(isParticipantForUserResponse || isParticipantForJudgeResponse)) {
            throw new Error('Object not a ParticipantForUserResponse or ParticipantForJudgeResponse');
        }
        this.participant = participant;
    }

    get base(): ParticipantForUserResponse {
        return this.participant;
    }

    get id(): string {
        return this.participant.id;
    }

    get username() {
        return this.participant.username;
    }

    get status(): ParticipantStatus {
        return this.participant.status;
    }

    set status(status: ParticipantStatus) {
        this.participant.status = status;
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

    get caseGroup() {
        return this.participant.case_type_group;
    }

    get isJudge(): boolean {
        return this.participant.role === Role.Judge;
    }

    get participantHertBeatHealth(): ParticipantHeartbeat {
        return this.participantHeartBeat;
    }

    set participantHertBeatHealth(participantHeartBeat: ParticipantHeartbeat) {
        this.participantHeartBeat = participantHeartBeat;
    }
}
