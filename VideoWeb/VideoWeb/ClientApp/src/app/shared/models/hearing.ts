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
    _participants: Participant[];
    participants: ReadonlyArray<Participant>;

    private conference: ConferenceResponseVho;

    constructor(conference: ConferenceResponseVho) {
        super();
        const isVhResponse = conference instanceof ConferenceResponseVho;
        const isParticipantResponse = conference instanceof ConferenceResponse;

        if (!(isVhResponse || isParticipantResponse)) {
            throw new Error('Object not a ConferenceResponse or ConferenceResponseVHO');
        }

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

    updateParticipants(participants: ParticipantResponseVho[]) {
        this.updateParticipantList(participants);
    }

    addEndpoint(ver: VideoEndpointResponse) {
        const conference = this.conference as ConferenceResponse;
        conference.endpoints.push(ver);
    }

    updateEndpoint(ver: VideoEndpointResponse) {
        const conference = this.conference as ConferenceResponse;
        const index = conference.endpoints.findIndex(x => x.id === ver.id);
        conference.endpoints[index] = ver;
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

    private updateParticipantList(participants: ParticipantResponseVho[]) {
        this.conference.participants = participants;
        this._participants = this.conference.participants.map(p => new Participant(p));
        this.participants = this._participants;
    }
}
