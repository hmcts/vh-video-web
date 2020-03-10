import { ConferenceResponse, ConferenceStatus, ParticipantResponse, UserRole } from 'src/app/services/clients/api-client';

import { Participant } from './participant';
import { HearingTimeReader } from './hearing-status-reader';
import { HearingBase } from './hearing-base';

export class Hearing extends HearingBase {
    private conference: ConferenceResponse;
    private participants: Participant[];

    constructor(conference: ConferenceResponse) {
        super();
        if (!(conference instanceof ConferenceResponse)) {
            throw new Error('Object not a ConferenceResponse');
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

    getConference(): ConferenceResponse {
        return this.conference;
    }

    getParticipants(): ParticipantResponse[] {
        return this.conference.participants;
    }

    get status(): ConferenceStatus {
        return this.conference.status;
    }

    get scheduledDuration(): number {
        return this.conference.scheduled_duration;
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

    isPastClosedTime(): boolean {
        return this.timeReader.isPastClosedTime(this.conference.closed_date_time, this.conference.status);
    }

    getParticipantByUsername(username: string) {
        return this.participants.find(p => p.username.toLocaleLowerCase() === username.toLocaleLowerCase());
    }
}
