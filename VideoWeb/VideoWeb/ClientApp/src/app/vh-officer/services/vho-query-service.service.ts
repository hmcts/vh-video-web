import { BehaviorSubject, Observable, of, Subject } from 'rxjs';
import {
    ApiClient,
    ConferenceForVhOfficerResponse,
    ConferenceResponse,
    ParticipantForUserResponse,
    ParticipantHeartbeatResponse,
    ParticipantResponse,
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
import { NewAllocationMessage } from 'src/app/services/models/new-allocation-message';

@Injectable()
export class VhoQueryService {
    interval: ReturnType<typeof setInterval> | number;
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

        this.interval = window.setInterval(async () => {
            await this.runQuery();
        }, this.pollingInterval);
    }

    startEventSubscriptions() {
        this.eventService
            .getAllocationMessage()
            .pipe(takeUntil(this.destroy$))
            .subscribe(allocationUpdate => this.handleAllocationUpdated(allocationUpdate));
        this.eventService
            .getHearingDetailsUpdated()
            .pipe(takeUntil(this.destroy$))
            .subscribe(hearingDetailMessage => this.handleHearingDetailUpdate(hearingDetailMessage));
    }

    handleHearingDetailUpdate(hearingDetailMessage: HearingDetailsUpdatedMessage) {
        const newConference = hearingDetailMessage.conference;
        this.updateConference(
            newConference,
            (foundConference: ConferenceForVhOfficerResponse) =>
                new ConferenceForVhOfficerResponse({
                    ...foundConference,
                    case_name: newConference.case_name,
                    case_number: newConference.case_number,
                    scheduled_date_time: newConference.scheduled_date_time,
                    scheduled_duration: newConference.scheduled_duration,
                    hearing_venue_name: newConference.hearing_venue_name,
                    allocated_cso: newConference.allocated_cso,
                    allocated_cso_id: newConference.allocated_cso_id,
                    participants: this.mapParticipantResponseToParticipantForUserResponse(newConference.participants)
                })
        );

        this.vhoConferencesSubject.next(this.vhoConferences);
    }

    handleAllocationUpdated(allocationUpdate: NewAllocationMessage) {
        for (const update of allocationUpdate.updatedAllocations) {
            const newConference = update.conference;
            this.updateConference(
                newConference,
                (foundConference: ConferenceForVhOfficerResponse) =>
                    new ConferenceForVhOfficerResponse({
                        ...foundConference,
                        allocated_cso: newConference.allocated_cso,
                        allocated_cso_id: newConference.allocated_cso_id
                    })
            );
        }

        this.vhoConferencesSubject.next(this.vhoConferences);
    }

    isNewConferencePartOfFilter(newConference: ConferenceResponse): boolean {
        if (this.venueNames?.length > 0 && !this.venueNames.includes(newConference.hearing_venue_name)) {
            return false;
        }

        if (this.allocatedCsoIds?.length > 0 && !this.allocatedCsoIds.includes(newConference.allocated_cso_id)) {
            return false;
        }

        return true;
    }

    stopQuery() {
        clearInterval(this.interval);
        this.vhoConferences = [];
        this.vhoConferencesSubject.next(this.vhoConferences);
        this.destroy$.next();
        this.destroy$.complete();
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

    getConferenceByIdVHO(conferenceId: string): Promise<ConferenceResponse> {
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

    private updateConference(
        newConference: ConferenceResponse,
        updateFn: (foundConference: ConferenceForVhOfficerResponse) => ConferenceForVhOfficerResponse
    ) {
        let index = this.vhoConferences.findIndex(x => x.id === newConference.id);
        const doesConferenceMatchExistingFilter: boolean = this.isNewConferencePartOfFilter(newConference);

        // If the conference is not part of the filter and not in the list, then we don't need to do anything
        if (index === -1 && !doesConferenceMatchExistingFilter) {
            return;
        }

        // If the conference is not in the list but is part of the filter, then we add it to the list
        if (index === -1 && doesConferenceMatchExistingFilter) {
            index = this.vhoConferences.length;
            this.vhoConferences.push(new ConferenceForVhOfficerResponse({ ...newConference, participants: newConference.participants }));
        }

        // if the conference is in the list but not part of the filter, then we remove it from the list
        if (!doesConferenceMatchExistingFilter) {
            this.vhoConferences.splice(index, 1);
            return;
        }

        // If the conference is in the list and part of the filter, then we update it with the provided update function
        let foundConference = this.vhoConferences[index];
        foundConference = updateFn(foundConference);
        this.vhoConferences[index] = foundConference;
        // todo: sort the list like SortConferenceForVhoOfficerHelper.cs?
    }

    private mapParticipantResponseToParticipantForUserResponse(participants: ParticipantResponse[]): ParticipantForUserResponse[] {
        return participants.map(participant => new ParticipantForUserResponse({ ...participant }));
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
