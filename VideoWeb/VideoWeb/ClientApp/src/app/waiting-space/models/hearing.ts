import { ConferenceResponse, ConferenceStatus, ParticipantResponse } from 'src/app/services/clients/api-client';
import * as moment from 'moment';

export class Hearing {
    private conference: ConferenceResponse;

    constructor(conference: ConferenceResponse) {
        this.conference = conference;
    }

    getConference(): ConferenceResponse {
        return this.conference;
    }

    getParticipants(): ParticipantResponse[] {
        return this.conference.participants;
    }

    getScheduledStartTime(): Date {
        const startTime = new Date(this.conference.scheduled_date_time.getTime());
        return startTime;
    }

    getScheduledEndTime(): Date {
        const endTime = new Date(this.conference.scheduled_date_time.getTime());
        endTime.setUTCMinutes(endTime.getUTCMinutes() + this.conference.scheduled_duration);
        return endTime;
    }

    isOnTime(): boolean {
        const now = moment.utc();
        let scheduled = moment(this.conference.scheduled_date_time);
        scheduled = scheduled.subtract(5, 'minutes');
        return now.isBefore(scheduled) && this.conference.status === ConferenceStatus.NotStarted;
    }

    isStarting(): boolean {
        const now = moment.utc();

        let minStart = moment(this.conference.scheduled_date_time);
        minStart = minStart.subtract(5, 'minutes');

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
