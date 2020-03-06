import { ParticipantResponse, ParticipantStatus, UserRole } from 'src/app/services/clients/api-client';
import { HeartbeatHealth } from '../../services/models/participant-heartbeat';

export class Participant {
  private participant: ParticipantResponse;

    hearbeartHealth: HeartbeatHealth;

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

    get username() {
        return this.participant.username;
    }

    set username(username: string) {
        this.username= username;
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

    set status(status: ParticipantStatus) {
        this.participant.status = status;
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

    getStatusAsTextForJudge(statuses: ParticipantStatus[]): string {
        switch (this.participant.status) {
            case ParticipantStatus.None:
            case ParticipantStatus.NotSignedIn:
                const inHearing = statuses.filter(x => x === ParticipantStatus.InHearing);
                return inHearing.length > 0 ? 'In another hearing' : 'Unavailable';
            case ParticipantStatus.InConsultation:
            case ParticipantStatus.UnableToJoin:
                return 'Unavailable';
            case ParticipantStatus.InHearing:
                return 'In Hearing';

            default:
                return this.participant.status;
        }
  }


}
