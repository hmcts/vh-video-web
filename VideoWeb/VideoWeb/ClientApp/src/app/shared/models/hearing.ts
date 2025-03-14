import {
    ConferenceResponse,
    ConferenceStatus,
    ParticipantResponse,
    Role,
    VideoEndpointResponse
} from 'src/app/services/clients/api-client';
import { HearingBase } from './hearing-base';
import { Participant } from './participant';

export class Hearing extends HearingBase {
    participants: ReadonlyArray<Participant>;

    private _participants: Participant[];
    private conference: ConferenceResponse;

    constructor(conference: ConferenceResponse) {
        super();

        this.conference = conference;
        if (conference.participants) {
            this._participants = this.conference.participants.map(p => new Participant(p));
            this.participants = this._participants;
        }
    }

    get id(): string {
        return this.conference.id;
    }

    get judge(): Participant {
        return this._participants.find(x => x.role === Role.Judge);
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

    get hearingVenueName(): string {
        return this.conference.hearing_venue_name;
    }

    getConference(): ConferenceResponse {
        return this.conference;
    }

    getParticipants(): ParticipantResponse[] {
        return this.conference.participants;
    }

    getEndpoints(): VideoEndpointResponse[] {
        if (this.conference['endpoints']) {
            return this.conference['endpoints'];
        } else {
            return new Array<VideoEndpointResponse>();
        }
    }

    updateParticipants(participants: ParticipantResponse[]) {
        this.updateParticipantList(participants);
    }

    updateEndpoint(ver: VideoEndpointResponse) {
        const index = this.conference.endpoints.findIndex(x => x.id === ver.id);
        this.conference.endpoints[index] = ver;
    }

    retrieveHearingExpiryTime(): moment.Moment {
        return this.timeReader.retrieveHearingExpiryTime(this.conference.closed_date_time, this.conference.status);
    }

    isPastClosedTime(): boolean {
        return this.timeReader.isPastClosedTime(this.conference.closed_date_time, this.conference.status);
    }

    getParticipantById(participantId: string) {
        return this._participants.find(p => p.id === participantId);
    }

    private updateParticipantList(participants: ParticipantResponse[]) {
        this.conference.participants = participants;
        this._participants = this.conference.participants.map(p => new Participant(p));
        this.participants = this._participants;
    }
}
