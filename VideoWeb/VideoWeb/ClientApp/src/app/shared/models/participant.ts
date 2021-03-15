import { ParticipantResponse, ParticipantStatus, Role, ParticipantResponseVho } from 'src/app/services/clients/api-client';
import { HearingRole } from 'src/app/waiting-space/models/hearing-role-model';

export class Participant {
    private participant: ParticipantResponseVho;

    constructor(participant: ParticipantResponseVho) {
        const isVhResponse = participant instanceof ParticipantResponseVho;
        const isParticipantResponse = participant instanceof ParticipantResponse;

        if (!(isVhResponse || isParticipantResponse)) {
            throw new Error('Object not a ParticipantResponseVho or ParticipantResponse');
        }
        this.participant = participant;
    }

    get base(): ParticipantResponseVho {
        return this.participant;
    }

    get id(): string {
        return this.participant.id;
    }

    get fullName() {
        return this.participant.name;
    }

    get caseGroup() {
        return this.participant.case_type_group;
    }

    get status(): ParticipantStatus {
        return this.participant.status;
    }

    get role(): Role {
        return this.participant.role;
    }

    get isJudge(): boolean {
        return this.participant.role === Role.Judge;
    }

    get displayName(): string {
        return this.participant.display_name;
    }

    get representee(): string {
        return this.participant.representee;
    }

    get hearingRoleText(): string {
        return this.representee ? `${this.base.hearing_role} for ${this.representee}` : this.base.hearing_role;
    }

    get isInterpreterOrInterpretee() {
        return (
            this.participant.hearing_role === HearingRole.INTERPRETER ||
            (this.participant.linked_participants && this.participant.linked_participants.length > 0)
        );
    }
}
