import { BehaviorSubject, Observable } from 'rxjs';
import {
    ApiClient,
    ConferenceForVhOfficerResponse,
    ConferenceResponseVho,
    ParticipantHeartbeatResponse,
    TaskResponse,
    CourtRoomsAccountResponse
} from 'src/app/services/clients/api-client';
import { Injectable } from '@angular/core';

@Injectable()
export class VhoQueryService {
    interval: NodeJS.Timer;
    venueNames: string[];
    allocatedCsoIds: string[];
    includeUnallocated = false;
    activeSessionsOnly = false;

    private vhoConferencesSubject: BehaviorSubject<ConferenceForVhOfficerResponse[]>;
    private vhoConferences: ConferenceForVhOfficerResponse[] = [];

    constructor(private apiClient: ApiClient) {
        this.vhoConferencesSubject = new BehaviorSubject(this.vhoConferences);
    }

    startQuery(venueNames: string[], allocatedCsoIds: string[], includeUnallocated: boolean, activeSessionsOnly: boolean) {
        this.venueNames = venueNames ?? [];
        this.allocatedCsoIds = allocatedCsoIds ?? [];
        this.includeUnallocated = includeUnallocated;
        this.activeSessionsOnly = activeSessionsOnly;
        this.runQuery();
        this.interval = setInterval(async () => {
            this.runQuery();
        }, 30000);
    }

    stopQuery() {
        clearInterval(this.interval);
    }

    async runQuery() {
        if (this.activeSessionsOnly) {
            const activeConferences = await this.getActiveConferences();
            this.vhoConferences = activeConferences;
            this.vhoConferencesSubject.next(this.vhoConferences);
            return;
        }
        const conferences = await this.apiClient
            .getConferencesForVhOfficer(this.venueNames ?? [], this.allocatedCsoIds ?? [], this.includeUnallocated)
            .toPromise();
        this.vhoConferences = conferences;
        this.vhoConferencesSubject.next(this.vhoConferences);
    }

    getConferencesForVHOfficer(venueNames: string[]): Observable<ConferenceForVhOfficerResponse[]> {
        this.venueNames = venueNames;
        return this.vhoConferencesSubject.asObservable();
    }

    getConferenceByIdVHO(conferenceId: string): Promise<ConferenceResponseVho> {
        return this.apiClient.getConferenceByIdVHO(conferenceId).toPromise();
    }

    getTasksForConference(conferenceId: string): Promise<TaskResponse[]> {
        return this.apiClient.getTasks(conferenceId).toPromise();
    }

    completeTask(conferenceId: string, taskId: number): Promise<TaskResponse> {
        return this.apiClient.completeTask(conferenceId, taskId).toPromise();
    }

    getParticipantHeartbeats(conferenceId: string, participantId: string): Promise<ParticipantHeartbeatResponse[]> {
        return this.apiClient.getHeartbeatDataForParticipant(conferenceId, participantId).toPromise();
    }

    getCourtRoomsAccounts(
        venueAllocation: string[],
        allocatedCsosIds: string[],
        includeUnallocated: boolean = false
    ): Promise<CourtRoomsAccountResponse[]> {
        return this.apiClient.getCourtRoomAccounts(venueAllocation ?? [], allocatedCsosIds ?? [], includeUnallocated).toPromise();
    }

    getActiveConferences() {
        return this.apiClient.getActiveConferences().toPromise();
    }
}
