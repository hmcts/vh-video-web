import { ConferenceResponse, ParticipantResponse, UserRole } from 'src/app/services/clients/api-client';
import { Participant } from './participant';
import { HearingTimeReader } from './hearing-status-reader';

export class HearingDetails {
    private timeReader = new HearingTimeReader();
    private conference: ConferenceResponse;
    private participants: Participant[];

    constructor(conference: ConferenceResponse) {
        if (!(conference instanceof ConferenceResponse)) {
            throw new Error(`object is not of type ConferenceResponse`);
        }
        this.conference = conference;
        if (conference.participants) {
            this.participants = this.conference.participants.map(p => new Participant(p));
        }
    }

    get scheduledStartTime(): Date {
        const startTime = new Date(this.conference.scheduled_date_time.getTime());
        return startTime;
    }

    getConference(): ConferenceResponse {
        return this.conference;
    }

    getParticipants(): ParticipantResponse[] {
        return this.conference.participants;
    }

    get id(): string {
        return this.conference.id;
    }

    get judge(): Participant {
        return this.participants.find(x => x.role === UserRole.Judge);
    }

    get caseType(): string {
        return this.conference.case_type;
    }

    get caseNumber(): string {
        return this.conference.case_number;
    }

    get caseName(): string {
        return this.conference.case_name;
    }

    get applicantRepresentative(): Participant {
        return this.participants.filter(x => x.role === UserRole.Representative)[0];
    }

    get defendantRepresentative(): Participant {
        return this.participants.filter(x => x.role === UserRole.Representative)[1];
    }

    get applicants(): Participant[] {
        return this.participants
            .filter(x => x.caseGroup !== '')
            .filter(x => x.caseGroup.toLowerCase() === 'applicant' || x.caseGroup.toLowerCase() === 'claimant');
    }

    get respondents(): Participant[] {
        return this.participants
            .filter(x => x.caseGroup !== '')
            .filter(x => x.caseGroup.toLowerCase() === 'respondent' || x.caseGroup.toLowerCase() === 'defendant');
    }

    getDurationAsText(): string {
        return this.timeReader.getDurationAsText(this.conference.scheduled_duration);
    }

    isReadyToStart(): boolean {
        return this.timeReader.isReadyToStart(this.conference.scheduled_date_time);
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

    isNotStarted(): boolean {
        return this.timeReader.isNotStarted(this.conference.status);
    }

    isClosed(): boolean {
        return this.timeReader.isClosed(this.conference.status);
    }

    isSuspended(): boolean {
        return this.timeReader.isSuspended(this.conference.status);
    }

    isInSession(): boolean {
        return this.timeReader.isInSession(this.conference.status);
    }

    isPaused(): boolean {
        return this.timeReader.isPaused(this.conference.status);
    }

    isPastClosedTime(): boolean {
        return this.timeReader.isPastClosedTime(this.conference.closed_date_time, this.conference.status);
    }

    getParticipantByUsername(username: string) {
        return this.participants.find(p => p.username.toLocaleLowerCase() === username.toLocaleLowerCase());
    }
}
