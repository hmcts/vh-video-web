import { ParticipantForUserResponse, ParticipantStatus, UserRole } from 'src/app/services/clients/api-client';

export class ParticipantSummary {
    private participant: ParticipantForUserResponse;

    constructor(participant: ParticipantForUserResponse) {
        if (!(participant instanceof ParticipantForUserResponse)) {
            throw new Error('Object not a ParticipantForUserResponse');
        }
        this.participant = participant;
    }

    get base(): ParticipantForUserResponse {
        return this.participant;
    }

    get username() {
        return this.participant.username;
    }

    get status(): ParticipantStatus {
        return this.participant.status;
    }

    get role(): UserRole {
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
        return this.participant.role === UserRole.Judge;
    }
}
