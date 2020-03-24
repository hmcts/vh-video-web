import { ParticipantResponse, ParticipantStatus, UserRole } from 'src/app/services/clients/api-client';
import { ParticipantStatusReader } from './participant-status-reader';

export class Participant {
    private participant: ParticipantResponse;

    constructor(participant: ParticipantResponse) {
        if (!(participant instanceof ParticipantResponse)) {
            throw new Error('Object not a ParticipantResponse');
        }
        this.participant = participant;
    }

    get base(): ParticipantResponse {
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

    get contactEmail() {
        return this.participant.contact_email;
    }

    get username() {
        return this.participant.username;
    }

    get contactTelephone() {
        return this.participant.contact_telephone;
    }

    get initialedName(): string {
        const initial = this.participant.first_name ? this.participant.first_name.substr(0, 1) : '';
        const name = this.participant.last_name || '';
        return `${initial} ${name}`; 
    }

    get status(): ParticipantStatus {
        return this.participant.status;
    }

    get role(): UserRole {
        return this.participant.role;
    }

    get isJudge(): boolean {
        return this.participant.role === UserRole.Judge;
    }

    get displayName(): string {
        return this.participant.display_name;
    }

    get representee(): string {
        return this.participant.representee;
    }

    getStatusAsText(): string {
        return new ParticipantStatusReader().getStatusAsText(this.participant.status);
    }

    getStatusAsTextForJudge(statuses: ParticipantStatus[]): string {
        return new ParticipantStatusReader().getStatusAsTextForJudge(this.participant.status, statuses);
    }
}
