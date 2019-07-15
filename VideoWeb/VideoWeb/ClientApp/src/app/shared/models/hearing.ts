import { ConferenceResponse, ConferenceStatus, ParticipantResponse, UserRole } from 'src/app/services/clients/api-client';
import * as moment from 'moment';
import { Participant } from './participant';

export class Hearing {
    private conference: ConferenceResponse;
    private participants: Participant[];

    constructor(conference: ConferenceResponse) {
        this.conference = conference;
        if (conference.participants) {
            this.participants = this.conference.participants
                .map(p => new Participant(p));
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

    get applicantRepresentative(): Participant {
        return this.participants.filter(x => x.role === UserRole.Representative)[0];
    }

    get defendantRepresentative(): Participant {
        return this.participants.filter(x => x.role === UserRole.Representative)[1];
    }

    getConference(): ConferenceResponse {
        return this.conference;
    }

    getParticipants(): ParticipantResponse[] {
        return this.conference.participants;
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

    get status(): ConferenceStatus {
        return this.conference.status;
    }

    getDurationAsText(): string {
        const duration = this.conference.scheduled_duration;
        const h = Math.floor(duration / 60);
        const m = duration % 60;
        const hours = h < 1 ? `${h} hours` : `${h} hour`;
        const minutes = m < 1 ? `${m} minute` : `${m} minutes`;
        if (h > 0 && m > 0) {
            return `${hours} and ${minutes}`;
        } else if (h > 0 && m === 0) {
            return `${hours}`;
        } else {
            return `${minutes}`;
        }
    }

    isReadyToStart(): boolean {
        const currentDateTime = new Date(new Date().getTime());
        const difference = moment(this.conference.scheduled_date_time).diff(
            moment(currentDateTime),
            'minutes'
        );
        return difference < 30;
    }

    isOnTime(): boolean {
        const now = moment.utc();
        let scheduled = moment(this.conference.scheduled_date_time);
        scheduled = scheduled.subtract(2, 'minutes');
        return now.isBefore(scheduled) && this.conference.status === ConferenceStatus.NotStarted;
    }

    isStarting(): boolean {
        const now = moment.utc();

        let minStart = moment(this.conference.scheduled_date_time);
        minStart = minStart.subtract(2, 'minutes');

        let maxStart = moment(this.conference.scheduled_date_time);
        maxStart = maxStart.add(10, 'minutes');

        return now.isBetween(minStart, maxStart) && this.conference.status === ConferenceStatus.NotStarted;
    }

    isDelayed(): boolean {
        const now = moment.utc();
        let scheduled = moment(this.conference.scheduled_date_time);
        scheduled = scheduled.add(10, 'minutes');
        return now.isAfter(scheduled) && this.conference.status === ConferenceStatus.NotStarted;
    }

    isNotStarted(): boolean {
        return this.conference.status === ConferenceStatus.NotStarted;
    }

    isClosed(): boolean {
        return this.conference.status === ConferenceStatus.Closed;
    }

    isSuspended(): boolean {
        return this.conference.status === ConferenceStatus.Suspended;
    }

    isInSession(): boolean {
        return this.conference.status === ConferenceStatus.InSession;
    }

    isPaused(): boolean {
        return this.conference.status === ConferenceStatus.Paused;
    }
}
