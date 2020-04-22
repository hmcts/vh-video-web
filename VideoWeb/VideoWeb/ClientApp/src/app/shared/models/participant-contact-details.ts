import {
  ParticipantStatus,
  Role,
  ParticipantContactDetailsResponseVho
} from 'src/app/services/clients/api-client';
import { ParticipantStatusReader } from './participant-status-reader';

export class ParticipantContactDetails {
  private participant: ParticipantContactDetailsResponseVho;

  constructor(participant: ParticipantContactDetailsResponseVho) {

    this.participant = participant;
  }

  get id(): string {
    return this.participant.id;
  }

  get refId(): string {
    return this.participant.ref_id;
  }

  get name() {
    return this.participant.name;
  }

  get firstname() {
    return this.participant.first_name;
  }

  get lastname() {
    return this.participant.last_name;
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

  get role(): Role {
    return this.participant.role;
  }

  get isJudge(): boolean {
    return this.participant.role === Role.Judge;
  }

  get displayName(): string {
    return this.participant.display_name;
  }

  getStatusAsText(): string {
    return new ParticipantStatusReader().getStatusAsText(this.participant.status);
  }

  getStatusAsTextForJudge(statuses: ParticipantStatus[]): string {
    return new ParticipantStatusReader().getStatusAsTextForJudge(this.participant.status, statuses);
  }
}
