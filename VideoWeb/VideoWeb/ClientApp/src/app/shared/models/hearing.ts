import {
    ConferenceResponse,
    ConferenceResponseVho,
    ConferenceStatus,
    ParticipantResponseVho,
    Role,
    VideoEndpointResponse
} from 'src/app/services/clients/api-client';
import { HearingBase } from './hearing-base';
import { Participant } from './participant';

export class Hearing extends HearingBase {
    private conference: ConferenceResponseVho;
    readonly participants: Participant[];

    constructor(conference: ConferenceResponseVho) {
        super();
        const isVhResponse = conference instanceof ConferenceResponseVho;
        const isParticipantResponse = conference instanceof ConferenceResponse;

        if (!(isVhResponse || isParticipantResponse)) {
            throw new Error('Object not a ConferenceResponse or ConferenceResponseVHO');
        }

        this.conference = conference;
        if (conference.participants) {
            this.participants = this.conference.participants.map(p => new Participant(p));
        }
    }

    get id(): string {
        return this.conference.id;
    }

    get judge(): Participant {
        return this.participants.find(x => x.role === Role.Judge);
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

    getConference(): ConferenceResponseVho {
        return this.conference;
    }

    getParticipants(): ParticipantResponseVho[] {
        return this.conference.participants;
    }

    getEndpoints(): VideoEndpointResponse[] {
        if (this.conference instanceof ConferenceResponse) {
            const conf = this.conference as ConferenceResponse;
            return conf.endpoints || new Array<VideoEndpointResponse>();
        } else {
            return new Array<VideoEndpointResponse>();
        }
    }

    get status(): ConferenceStatus {
        return this.conference.status;
    }

    get scheduledStartTime(): Date {
        return new Date(this.conference.scheduled_date_time.getTime());
    }

    get scheduledEndTime(): Date {
        const endTime = new Date(this.conference.scheduled_date_time.getTime());
        endTime.setUTCMinutes(endTime.getUTCMinutes() + this.conference.scheduled_duration);
        return endTime;
    }

    get actualCloseTime(): Date | null {
        return this.conference.closed_date_time;
    }

    retrieveHearingExpiryTime(): moment.Moment {
        return this.timeReader.retrieveHearingExpiryTime(this.conference.closed_date_time, this.conference.status);
    }

    isPastClosedTime(): boolean {
        return this.timeReader.isPastClosedTime(this.conference.closed_date_time, this.conference.status);
    }

    getParticipantById(participantId: string) {
        return this.participants.find(p => p.id === participantId);
    }

    get hearingVenueName(): string {
        return this.conference.hearing_venue_name;
    }
}
