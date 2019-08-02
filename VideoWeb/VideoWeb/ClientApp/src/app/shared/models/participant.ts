import { ParticipantResponse, ParticipantStatus, UserRole } from 'src/app/services/clients/api-client';

export class Participant {

    private participant: ParticipantResponse;

    constructor(participant: ParticipantResponse) {
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

    get contactTelephone() {
        return this.participant.contact_telephone;
    }

    get initialedName(): string {
        return `${this.participant.first_name.substr(0, 1)} ${this.participant.last_name}`;
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

    getStatusAsText(): string {
        switch (this.participant.status) {
            case ParticipantStatus.None:
            case ParticipantStatus.NotSignedIn:
                return 'Not Signed In';
            case ParticipantStatus.InConsultation:
                return 'In Consultation';
            case ParticipantStatus.InHearing:
                return 'In Hearing';
            case ParticipantStatus.UnableToJoin:
                return 'Unable to Join';
            default:
                return this.participant.status;
        }
    }
}
