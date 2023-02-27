import { BehaviorSubject, Observable } from 'rxjs';
import {
    ApiClient,
    ConferenceForVhOfficerResponse,
    ConferenceResponseVho,
    ParticipantHeartbeatResponse,
    TaskResponse,
    CourtRoomsAccountResponse, ConferenceForIndividualResponse
} from 'src/app/services/clients/api-client';
import { Injectable } from '@angular/core';

@Injectable()
export class VhoQueryService {
    private vhoConferencesSubject: BehaviorSubject<ConferenceForVhOfficerResponse[]>;
    private vhoConferences: ConferenceForVhOfficerResponse[] = [];

    interval: NodeJS.Timer;
    venueNames: string[];
    constructor(private apiClient: ApiClient) {
        this.vhoConferencesSubject = new BehaviorSubject(this.vhoConferences);
    }

    startQuery(venueNames: string[]) {
        this.venueNames = venueNames;
        this.runQuery();
        this.interval = setInterval(async () => {
            this.runQuery();
        }, 30000);
    }

    stopQuery() {
        clearInterval(this.interval);
    }

    async runQuery() {
        const conferences = await this.apiClient.getConferencesForVhOfficer(this.venueNames).toPromise();
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

    getCourtRoomsAccounts(venueAllocation: string[]): Promise<CourtRoomsAccountResponse[]> {
        return this.apiClient.getCourtRoomAccounts(venueAllocation).toPromise();
    }

    getConferencesForUser(): Promise<ConferenceForIndividualResponse[]> {
        return this.apiClient.getConferencesForIndividual().toPromise();
    }
}
