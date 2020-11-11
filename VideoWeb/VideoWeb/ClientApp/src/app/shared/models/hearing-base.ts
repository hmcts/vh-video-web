import { ConferenceStatus } from 'src/app/services/clients/api-client';
import { HearingTimeReader } from './hearing-status-reader';

export abstract class HearingBase {
    protected timeReader = new HearingTimeReader();

    abstract get status(): ConferenceStatus;
    abstract get scheduledStartTime(): Date;

    isReadyToStart(): boolean {
        return this.timeReader.isReadyToStart(this.scheduledStartTime) && this.isNotStarted();
    }

    isOnTime(): boolean {
        return this.timeReader.isOnTime(this.scheduledStartTime, this.status) && this.isNotStarted();
    }

    isStarting(): boolean {
        return this.timeReader.isStarting(this.scheduledStartTime, this.status) && this.isNotStarted();
    }

    isDelayed(): boolean {
        return this.timeReader.isDelayed(this.scheduledStartTime, this.status) && this.isNotStarted();
    }

    isNotStarted(): boolean {
        return this.timeReader.isNotStarted(this.status);
    }

    isClosed(): boolean {
        return this.timeReader.isClosed(this.status);
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
}
