import {
    ConferenceForIndividualResponse,
    ConferenceForHostResponse,
    ConferenceForVhOfficerResponse,
    ConferenceStatus,
    Role,
    Supplier
} from 'src/app/services/clients/api-client';
import { HearingBase } from './hearing-base';
import { ParticipantSummary } from './participant-summary';

export class HearingSummary extends HearingBase {
    isJoinByPhone: boolean;

    protected conference: ConferenceForVhOfficerResponse;
    protected participants: ParticipantSummary[];

    constructor(conference: ConferenceForVhOfficerResponse) {
        super();
        const isVhResponse = conference instanceof ConferenceForVhOfficerResponse;
        const isIndividualResponse =
            conference instanceof ConferenceForIndividualResponse || conference instanceof ConferenceForHostResponse;

        if (!(isVhResponse || isIndividualResponse)) {
            throw new Error('Object not a ConferenceForIndividualResponse or ConferenceForVhOfficerResponse or ConferenceForHostResponse');
        }
        this.conference = conference;
        this.participants = this.conference.participants.map(p => new ParticipantSummary(p));
    }

    get id(): string {
        return this.conference.id;
    }

    get hearingRefId(): string {
        return this.conference.hearing_ref_id;
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

    get hearingVenueName(): string {
        return this.conference.hearing_venue_name;
    }

    get judge(): ParticipantSummary {
        return this.participants.find(x => x.role === Role.Judge);
    }

    get caseType(): string {
        return this.conference.case_type;
    }

    get startedDateTime(): Date {
        return this.conference.started_date_time;
    }

    get endedDateTime(): Date {
        return this.conference.closed_date_time;
    }

    get judgeName(): string {
        return this.participants.find(x => x.role === Role.Judge).displayName;
    }

    get telephoneConferenceId(): string {
        return this.conference.telephone_conference_id;
    }

    get telephoneConferenceNumbers(): string {
        return this.conference.telephone_conference_numbers;
    }

    get createdDateTime(): Date {
        return this.conference.created_date_time;
    }

    get actualCloseTime(): Date | null {
        return this.conference.closed_date_time;
    }

    get allocatedCso(): string {
        return this.conference.allocated_cso;
    }

    get supplier(): Supplier {
        return this.conference.supplier;
    }

    set status(status: ConferenceStatus) {
        this.conference.status = status;
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
}
