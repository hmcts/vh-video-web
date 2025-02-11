import { BehaviorSubject, Observable, of, Subject } from 'rxjs';
import {
    ApiClient,
    ConferenceForVhOfficerResponse,
    ConferenceResponseVho,
    ParticipantHeartbeatResponse,
    Role,
    TaskResponse
} from 'src/app/services/clients/api-client';
import { Injectable } from '@angular/core';
import { CourtRoomsAccounts } from './models/court-rooms-accounts';
import { map, switchMap, takeUntil } from 'rxjs/operators';
import { SessionStorage } from 'src/app/services/session-storage';
import { CsoFilter } from './models/cso-filter';
import { VhoStorageKeys } from './models/session-keys';
import { EventsService } from 'src/app/services/events.service';
import { HearingDetailsUpdatedMessage } from 'src/app/services/models/hearing-details-updated-message';

@Injectable()
export class VhoQueryService {
    interval: NodeJS.Timer;
    venueNames: string[];
    allocatedCsoIds: string[];
    includeUnallocated = false;
    activeSessionsOnly = false;
    courtRoomFilterChanged$ = new BehaviorSubject<CourtRoomsAccounts[]>(null);

    private vhoConferencesSubject: BehaviorSubject<ConferenceForVhOfficerResponse[]>;
    private vhoConferences: ConferenceForVhOfficerResponse[] = [];
    private courtRoomsAccountsFilters: CourtRoomsAccounts[] = [];

    private readonly courtAccountsFilterStorage: SessionStorage<CourtRoomsAccounts[]>;
    private readonly csoFilterStorage: SessionStorage<CsoFilter>;

    private readonly pollingInterval = 300000; // 5 minutes
    private destroy$ = new Subject<void>();

    constructor(
        private apiClient: ApiClient,
        private eventService: EventsService
    ) {
        this.csoFilterStorage = new SessionStorage<CsoFilter>(VhoStorageKeys.CSO_ALLOCATIONS_KEY);
        this.courtAccountsFilterStorage = new SessionStorage<CourtRoomsAccounts[]>(VhoStorageKeys.COURT_ROOMS_ACCOUNTS_ALLOCATION_KEY);
        this.courtRoomsAccountsFilters = this.getCourtAccountFiltersFromStorage();
        this.courtRoomFilterChanged$.next(this.courtRoomsAccountsFilters);
        this.vhoConferencesSubject = new BehaviorSubject(this.vhoConferences);
    }

    startQuery(venueNames: string[], allocatedCsoIds: string[], includeUnallocated: boolean, activeSessionsOnly: boolean) {
        this.venueNames = venueNames ?? [];
        this.allocatedCsoIds = allocatedCsoIds ?? [];
        this.includeUnallocated = includeUnallocated;
        this.activeSessionsOnly = activeSessionsOnly;
        this.runQuery();
        this.interval = setInterval(async () => {
            await this.runQuery();
        }, this.pollingInterval);
        this.eventService
            .getHearingDetailsUpdated()
            .pipe(takeUntil(this.destroy$))
            .subscribe(hearingDetailMessage => this.handleHearingDetailUpdate(hearingDetailMessage));
    }

    handleHearingDetailUpdate(hearingDetailMessage: HearingDetailsUpdatedMessage) {
        if (hearingDetailMessage.conference) {
            const newConference = hearingDetailMessage.conference;
            const index = this.vhoConferences.findIndex(x => x.id === newConference.id);
            if (index !== -1) {
                const newHearing = new ConferenceForVhOfficerResponse(newConference);
                this.vhoConferences[index] = newHearing;
                this.vhoConferencesSubject.next(this.vhoConferences);
                return;
            }
            // this.runQuery();
        }
    }

    stopQuery() {
        clearInterval(this.interval);
        this.vhoConferences = [];
        this.vhoConferencesSubject.next(this.vhoConferences);
        this.destroy$.next();
    }

    async runQuery() {
        if (this.activeSessionsOnly) {
            this.vhoConferences = await this.getActiveConferences();
            this.vhoConferencesSubject.next(this.vhoConferences);
            return;
        }
        this.vhoConferences = await this.apiClient
            .getConferencesForVhOfficer(this.venueNames ?? [], this.allocatedCsoIds ?? [], this.includeUnallocated)
            .toPromise();
        this.vhoConferencesSubject.next(this.vhoConferences);
    }

    /**
     * Get the results of the original query
     * @returns the result of the original query
     */
    getQueryResults(): Observable<ConferenceForVhOfficerResponse[]> {
        return this.vhoConferencesSubject.asObservable();
    }

    /**
     * Get the results of the original query filtered by the selected court rooms
     */
    getFilteredQueryResults(): Observable<ConferenceForVhOfficerResponse[]> {
        return this.courtRoomFilterChanged$.pipe(
            switchMap(filterCriteria =>
                this.vhoConferencesSubject.pipe(
                    map(conferences => {
                        if (!filterCriteria || filterCriteria.length === 0) {
                            return conferences;
                        }
                        return this.mapFilteredConferences(filterCriteria, conferences);
                    })
                )
            )
        );
    }

    getAvailableCourtRoomFilters(): Observable<CourtRoomsAccounts[]> {
        return this.getQueryResults().pipe(
            switchMap(x => {
                const courtRooms = this.mapConferencesToCourtRoomsAccounts(x);
                // update the court room to match existing filters
                const previousFilter = this.courtRoomsAccountsFilters;

                if (previousFilter) {
                    previousFilter.forEach(filter => {
                        const courtRoom = courtRooms.find(c => c.venue === filter.venue);
                        if (courtRoom) {
                            courtRoom.selected = filter.selected;
                            courtRoom.updateRoomSelection(filter.courtsRooms);
                        }
                    });
                }
                return of(courtRooms);
            })
        );
    }

    getCsoFilterFromStorage(): CsoFilter {
        return this.csoFilterStorage.get();
    }

    getCourtAccountFiltersFromStorage(): CourtRoomsAccounts[] {
        return this.courtAccountsFilterStorage.get();
    }

    updateCourtRoomsAccountFilters(courtRoomsAccountsFilters: CourtRoomsAccounts[]) {
        this.courtRoomsAccountsFilters = courtRoomsAccountsFilters;
        this.courtAccountsFilterStorage.set(courtRoomsAccountsFilters);
        this.courtRoomFilterChanged$.next(courtRoomsAccountsFilters);
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

    getActiveConferences() {
        return this.apiClient.getActiveConferences().toPromise();
    }

    private mapConferencesToCourtRoomsAccounts(conferences: ConferenceForVhOfficerResponse[]): CourtRoomsAccounts[] {
        const venuesAndJudges = conferences
            .filter(e => e.participants.some(s => s.role === Role.Judge))
            .map(e => ({
                venue: e.hearing_venue_name,
                judge: e.participants.find(s => s.role === Role.Judge).display_name
            }))
            .reduce((acc: { [key: string]: string[] }, { venue, judge }) => {
                if (!acc[venue]) {
                    acc[venue] = [];
                }
                if (!acc[venue].includes(judge)) {
                    acc[venue].push(judge);
                }
                return acc;
            }, {});

        return Object.entries(venuesAndJudges)
            .map(
                ([venue, judges]) =>
                    new CourtRoomsAccounts(
                        venue,
                        judges.sort((a, b) => a.localeCompare(b)),
                        true
                    )
            )
            .sort((a, b) => a.venue.localeCompare(b.venue));
    }

    private mapFilteredConferences(
        filterCriteria: CourtRoomsAccounts[],
        conferences: ConferenceForVhOfficerResponse[]
    ): ConferenceForVhOfficerResponse[] {
        const matchingConferences: ConferenceForVhOfficerResponse[] = [];

        filterCriteria.forEach(criteria => {
            criteria.courtsRooms.forEach(room => {
                if (!room.selected) {
                    return;
                }
                matchingConferences.push(...this.matchedConferences(conferences, room.courtRoom, criteria.venue));
            });
        });
        return matchingConferences;
    }

    private matchedConferences(
        conferences: ConferenceForVhOfficerResponse[],
        judgeDisplayName: string,
        venueName: string
    ): ConferenceForVhOfficerResponse[] {
        return conferences.filter(
            conference =>
                conference.hearing_venue_name === venueName &&
                conference.participants.some(
                    participant => participant.role === Role.Judge && participant.display_name === judgeDisplayName
                )
        );
    }
}
