import {
    ConferenceForUserResponse,
    ConferenceForVhOfficerResponse,
    ConferenceStatus,
    ParticipantForUserResponse,
    UserRole
} from 'src/app/services/clients/api-client';
import { HearingTimeReader } from './hearing-status-reader';
import { ParticipantSummary } from './participant-summary';

export class HearingSummary {
    private timeReader = new HearingTimeReader();
    private conference: ConferenceForVhOfficerResponse;
    private participants: ParticipantSummary[];

    constructor(conference: ConferenceForVhOfficerResponse) {
        const isVhResponse = conference instanceof ConferenceForVhOfficerResponse;
        const isIndividualResponse = conference instanceof ConferenceForUserResponse;

        if (!(isVhResponse || isIndividualResponse)) {
            throw new Error('Object not a ConferenceForUserResponse or ConferenceForVhOfficerResponse');
        }
        this.conference = conference;
        this.participants = this.conference.participants.map(p => new ParticipantSummary(p));
    }

    get id(): string {
        return this.conference.id;
    }

    get caseNumber(): string {
        return this.conference.case_number;
    }

    get caseName(): string {
        return this.conference.case_name;
    }

    get scheduledStartTime(): Date {
        const startTime = new Date(this.conference.scheduled_date_time.getTime());
        return startTime;
    }

    get scheduledEndTime(): Date {
        const endTime = new Date(this.conference.scheduled_date_time.getTime());
        endTime.setUTCMinutes(endTime.getUTCMinutes() + this.conference.scheduled_duration);
        return endTime;
    }

    get applicantRepresentative(): ParticipantSummary {
        return this.participants.filter(x => x.role === UserRole.Representative)[0];
    }

    get defendantRepresentative(): ParticipantSummary {
        return this.participants.filter(x => x.role === UserRole.Representative)[1];
    }

    get applicants(): ParticipantSummary[] {
        return this.participants
            .filter(x => x.caseGroup !== '')
            .filter(x => x.caseGroup.toLowerCase() === 'applicant' || x.caseGroup.toLowerCase() === 'claimant');
    }

    get respondents(): ParticipantSummary[] {
        return this.participants
            .filter(x => x.caseGroup !== '')
            .filter(x => x.caseGroup.toLowerCase() === 'respondent' || x.caseGroup.toLowerCase() === 'defendant');
    }

    get numberOfUnreadMessages(): number {
        return this.conference.number_of_unread_messages;
    }

    get hearingVenueName(): string {
        return this.conference.hearing_venue_name;
    }

    get status(): ConferenceStatus {
        return this.conference.status;
    }

    get judge(): ParticipantSummary {
        return this.participants.find(x => x.role === UserRole.Judge);
    }

    getConference() {
        return this.conference;
    }

    getParticipants(): ParticipantForUserResponse[] {
        return this.conference.participants;
    }

    getDurationAsText(): string {
        return this.timeReader.getDurationAsText(this.conference.scheduled_duration);
    }

    isOnTime(): boolean {
        return this.timeReader.isOnTime(this.conference.scheduled_date_time, this.conference.status);
    }

    isStarting(): boolean {
        return this.timeReader.isStarting(this.conference.scheduled_date_time, this.conference.status);
    }

    isDelayed(): boolean {
        return this.timeReader.isDelayed(this.conference.scheduled_date_time, this.conference.status);
    }

    isInSession(): boolean {
        return this.timeReader.isInSession(this.conference.status);
    }

    isPaused(): boolean {
        return this.timeReader.isPaused(this.conference.status);
    }

    isClosed(): boolean {
        return this.timeReader.isClosed(this.conference.status);
    }

    isSuspended(): boolean {
        return this.timeReader.isSuspended(this.conference.status);
    }
}
