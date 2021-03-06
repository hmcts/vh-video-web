import { ConferenceStatus } from 'src/app/services/clients/api-client';
import { HearingTimeReader } from './hearing-status-reader';

export abstract class HearingBase {
    protected timeReader = new HearingTimeReader();

    abstract get status(): ConferenceStatus;
    abstract get scheduledStartTime(): Date;
    abstract get actualCloseTime(): Date | null;

    isReadyToStart(): boolean {
        return this.timeReader.isReadyToStart(this.scheduledStartTime);
    }

    isOnTime(): boolean {
        return this.timeReader.isOnTime(this.scheduledStartTime, this.status);
    }

    isStarting(): boolean {
        return this.timeReader.isStarting(this.scheduledStartTime, this.status);
    }

    isDelayed(): boolean {
        return this.timeReader.isDelayed(this.scheduledStartTime, this.status);
    }

    isNotStarted(): boolean {
        return this.timeReader.isNotStarted(this.status);
    }

    isClosed(): boolean {
        return this.timeReader.isClosed(this.status);
    }

    isExpired(closedDateTime: Date): boolean {
        return this.timeReader.isPastClosedTime(closedDateTime, this.status);
    }

    isSuspended(): boolean {
        return this.timeReader.isSuspended(this.status);
    }

    isInSession(): boolean {
        return this.timeReader.isInSession(this.status);
    }

    isPaused(): boolean {
        return this.timeReader.isPaused(this.status);
    }

    retrieveExpiryTime(): Date | null {
        return this.timeReader.retrieveHearingExpiryTime(this.actualCloseTime, this.status)?.toDate();
    }
}
