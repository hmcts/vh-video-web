import * as moment from 'moment';
import { ConferenceStatus } from 'src/app/services/clients/api-client';

export class HearingTimeReader {
    getDurationAsText(duration: number): string {
        const momDuration = moment.duration(duration, 'minutes');
        const h = momDuration.hours();
        const m = momDuration.minutes();
        const hours = h === 1 ? `${h} hour` : `${h} hours`;
        const minutes = m === 1 ? `${m} minute` : `${m} minutes`;
        if (h > 0 && m > 0) {
            return `${hours} and ${minutes}`;
        } else if (h > 0 && m === 0) {
            return `${hours}`;
        } else {
            return `${minutes}`;
        }
    }

    isReadyToStart(scheduledDateTime: Date): boolean {
        const currentDateTime = new Date(new Date().getTime());
        const difference = moment(scheduledDateTime).diff(moment(currentDateTime), 'minutes');
        return difference < 30;
    }

    isOnTime(scheduledDateTime: Date, status: ConferenceStatus): boolean {
        const now = moment.utc();
        let scheduled = moment(scheduledDateTime);
        scheduled = scheduled.subtract(2, 'minutes');
        return now.isBefore(scheduled) && status === ConferenceStatus.NotStarted;
    }

    isStarting(scheduledDateTime: Date, status: ConferenceStatus): boolean {
        const now = moment.utc();

        let minStart = moment(scheduledDateTime);
        minStart = minStart.subtract(2, 'minutes');

        let maxStart = moment(scheduledDateTime);
        maxStart = maxStart.add(10, 'minutes');

        return now.isBetween(minStart, maxStart) && status === ConferenceStatus.NotStarted;
    }

    isDelayed(scheduledDateTime: Date, status: ConferenceStatus): boolean {
        const now = moment.utc();
        let scheduled = moment(scheduledDateTime);
        scheduled = scheduled.add(10, 'minutes');
        return now.isAfter(scheduled) && status === ConferenceStatus.NotStarted;
    }

    isPastClosedTime(closedDateTime: Date, status: ConferenceStatus): boolean {
        if (status !== ConferenceStatus.Closed) {
            return false;
        }
        const now = moment.utc();
        let closed = moment(closedDateTime);
        closed = closed.add(30, 'minutes');
        return now.isSameOrAfter(closed) && status === ConferenceStatus.Closed;
    }

    isNotStarted(status: ConferenceStatus): boolean {
        return status === ConferenceStatus.NotStarted;
    }

    isClosed(status: ConferenceStatus): boolean {
        return status === ConferenceStatus.Closed;
    }

    isSuspended(status: ConferenceStatus): boolean {
        return status === ConferenceStatus.Suspended;
    }

    isInSession(status: ConferenceStatus): boolean {
        return status === ConferenceStatus.InSession;
    }

    isPaused(status: ConferenceStatus): boolean {
        return status === ConferenceStatus.Paused;
    }
}
