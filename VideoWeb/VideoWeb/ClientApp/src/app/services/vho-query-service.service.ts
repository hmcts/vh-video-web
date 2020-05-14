import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
    ApiClient,
    ConferenceForVhOfficerResponse,
    ConferenceResponseVho,
    TaskResponse,
    ParticipantHeartbeatResponse
} from './clients/api-client';

@Injectable({
    providedIn: 'root'
})
export class VhoQueryService {
    private vhoConferencesSubject: BehaviorSubject<ConferenceForVhOfficerResponse[]>;
    private vhoConferences: ConferenceForVhOfficerResponse[] = [];

    private intervalId: NodeJS.Timer;
    private venueNames: string[];
    constructor(private apiClient: ApiClient) {
        this.vhoConferencesSubject = new BehaviorSubject(this.vhoConferences);
    }

    startQuery(venueNames: string[]) {
        this.venueNames = venueNames;
        this.runQuery();
        setInterval(async () => {
            this.runQuery();
        }, 30000);
    }

    stopQuery() {
        clearInterval(this.intervalId);
    }

    async runQuery() {
        const conferences = await this.apiClient.getConferencesForVhOfficer(this.venueNames).toPromise();
        if (!this.vhoConferences) {
            this.vhoConferences = conferences;
        } else {
            conferences.forEach(c => {
                const conferenceIndex = this.findIndexByProperty(this.vhoConferences, 'id', c.id);
                if (conferenceIndex > -1) {
                    this.vhoConferences[conferenceIndex].init(c);
                } else {
                    this.vhoConferences.push(c);
                }
            });
        }
        this.vhoConferencesSubject.next(this.vhoConferences);
    }

    getConferencesForVHOfficer(venueNames: string[]): Observable<ConferenceForVhOfficerResponse[]> {
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

    private findIndexByProperty(data, key, value) {
        for (let i = 0; i < data.length; i++) {
            if (data[i][key] === value) {
                return i;
            }
        }
        return -1;
    }
}
