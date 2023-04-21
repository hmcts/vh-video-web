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
    private vhoConferencesSubject: BehaviorSubject<ConferenceForVhOfficerResponse[]>;
    private vhoConferences: ConferenceForVhOfficerResponse[] = [];

    interval: NodeJS.Timer;
    venueNames: string[];
    allocatedCsoIds: string[];
    includeUnallocated = false;
    constructor(private apiClient: ApiClient) {
        this.vhoConferencesSubject = new BehaviorSubject(this.vhoConferences);
    }

    startQuery(venueNames: string[], allocatedCsoIds: string[], includeUnallocated: boolean) {
        this.venueNames = venueNames ?? [];
        this.allocatedCsoIds = allocatedCsoIds ?? [];
        this.includeUnallocated = includeUnallocated;
        this.runQuery();
        this.interval = setInterval(async () => {
            this.runQuery();
        }, 30000);
    }

    stopQuery() {
        clearInterval(this.interval);
    }

    async runQuery() {
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
}
