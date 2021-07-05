import { ConferenceStatus } from '../../clients/api-client';

export interface ConferenceStatusChanged {
    oldStatus: ConferenceStatus;
    newStatus: ConferenceStatus;
}
