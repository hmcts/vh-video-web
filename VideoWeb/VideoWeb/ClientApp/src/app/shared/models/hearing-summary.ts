import {
    ConferenceForIndividualResponse,
    ConferenceForVhOfficerResponse,
    ConferenceStatus,
    Role,
    ConferenceForJudgeResponse
} from 'src/app/services/clients/api-client';
import { HearingBase } from './hearing-base';
import { ParticipantSummary } from './participant-summary';

export class HearingSummary extends HearingBase {
    private conference: ConferenceForVhOfficerResponse;
    private participants: ParticipantSummary[];

    constructor(conference: ConferenceForVhOfficerResponse) {
        super();
        const isVhResponse = conference instanceof ConferenceForVhOfficerResponse;
        const isIndividualResponse =
            conference instanceof ConferenceForIndividualResponse || conference instanceof ConferenceForJudgeResponse;

        if (!(isVhResponse || isIndividualResponse)) {
            throw new Error('Object not a ConferenceForIndividualResponse or ConferenceForVhOfficerResponse or ConferenceForJudgeResponse');
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

    get status(): ConferenceStatus {
        return this.conference.status;
    }

    set status(status: ConferenceStatus) {
        this.conference.status = status;
    }

    get scheduledDuration(): number {
        return this.conference.scheduled_duration;
    }

    get scheduledStartTime(): Date {
        return new Date(this.conference.scheduled_date_time.getTime());
    }

    get scheduledDateTime(): Date {
        return this.conference.scheduled_date_time;
    }

    get scheduledEndTime(): Date {
        const endTime = new Date(this.conference.scheduled_date_time.getTime());
        endTime.setUTCMinutes(endTime.getUTCMinutes() + this.conference.scheduled_duration);
        return endTime;
    }

    get applicantRepresentative(): ParticipantSummary {
        return this.participants.filter(x => x.role === Role.Representative)[0];
    }

    get defendantRepresentative(): ParticipantSummary {
        return this.participants.filter(x => x.role === Role.Representative)[1];
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

    get hearingVenueName(): string {
        return this.conference.hearing_venue_name;
    }

    get judge(): ParticipantSummary {
        return this.participants.find(x => x.role === Role.Judge);
    }

    get caseType(): string {
        return this.conference.case_type;
    }

    getConference() {
        return this.conference;
    }

    getParticipants(): ParticipantSummary[] {
        return this.participants;
    }

    getDurationAsText(): string {
        return this.timeReader.getDurationAsText(this.conference.scheduled_duration);
    }

    get startedDateTime(): Date {
        return this.conference.started_date_time;
    }

    get endedDateTime(): Date {
        return this.conference.scheduled_date_time;
    }

    get judgeName(): string {
        return this.participants.find(x => x.role === Role.Judge).displayName;
    }
}
