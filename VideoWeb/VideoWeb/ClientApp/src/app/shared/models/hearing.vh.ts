import { VHParticipant, VHConference, VHEndpoint } from 'src/app/waiting-space/store/models/vh-conference';
import { HearingBase } from './hearing-base';
import { ConferenceStatus, Role } from 'src/app/services/clients/api-client';

/** A replacement for Hearing based on the VH Redux Models */
export class VHHearing extends HearingBase {
    participants: ReadonlyArray<VHParticipant>;

    private _participants: VHParticipant[];
    private conference: VHConference;

    constructor(conference: VHConference) {
        super();
        this.conference = conference;
        if (conference.participants) {
            this._participants = this.conference.participants;
            this.participants = this._participants;
        }
    }

    get id(): string {
        return this.conference.id;
    }

    get judge(): VHParticipant {
        return this._participants.find(x => x.role === Role.Judge);
    }

    get caseType(): string {
        return this.conference.caseType;
    }

    get caseNumber(): string {
        return this.conference.caseNumber;
    }

    get caseName(): string {
        return this.conference.caseName;
    }

    get status(): ConferenceStatus {
        return this.conference.status;
    }

    get scheduledStartTime(): Date {
        return new Date(this.conference.scheduledDateTime.getTime());
    }

    get scheduledEndTime(): Date {
        const endTime = new Date(this.conference.scheduledDateTime.getTime());
        endTime.setUTCMinutes(endTime.getUTCMinutes() + this.conference.duration);
        return endTime;
    }

    get actualCloseTime(): Date | null {
        return this.conference.endDateTime;
    }

    get hearingVenueName(): string {
        return this.conference.hearingVenueName;
    }

    getConference(): VHConference {
        return this.conference;
    }

    getParticipants(): VHParticipant[] {
        return this._participants;
    }

    getEndpoints(): VHEndpoint[] {
        return this.conference.endpoints;
    }

    retrieveHearingExpiryTime(): moment.Moment {
        return this.timeReader.retrieveHearingExpiryTime(this.conference.endDateTime, this.conference.status);
    }

    isPastClosedTime(): boolean {
        return this.timeReader.isPastClosedTime(this.conference.endDateTime, this.conference.status);
    }

    getParticipantById(participantId: string): VHParticipant {
        return this._participants.find(p => p.id === participantId);
    }
}
