import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ConferenceForVhOfficerResponse } from 'src/app/services/clients/api-client';
import { ErrorService } from 'src/app/services/error.service';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { ConferenceStatusMessage } from 'src/app/services/models/conference-status-message';
import { ParticipantHeartbeat } from 'src/app/services/models/participant-heartbeat';
import { ParticipantStatusMessage } from 'src/app/services/models/participant-status-message';
import { SessionStorage } from 'src/app/services/session-storage';
import { VhoQueryService } from '../services/vho-query-service.service';
import { ConferenceHelper } from 'src/app/shared/conference-helper';
import { Hearing } from 'src/app/shared/models/hearing';
import { HearingSummary } from 'src/app/shared/models/hearing-summary';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { ScreenHelper } from 'src/app/shared/screen-helper';
import { MenuOption } from '../models/menus-options';
import { VhoStorageKeys } from '../services/models/session-keys';
import { EventBusService, EmitEvent, VHEventType } from 'src/app/services/event-bus.service';
import { CourtRoomsAccounts } from '../services/models/court-rooms-accounts';
import { ParticipantSummary } from '../../shared/models/participant-summary';

@Component({
    selector: 'app-command-centre',
    templateUrl: './command-centre.component.html',
    styleUrls: ['./command-centre.component.scss', '../vho-global-styles.scss']
})
export class CommandCentreComponent implements OnInit, OnDestroy {
    public menuOption = MenuOption;

    private readonly judgeAllocationStorage: SessionStorage<string[]>;
    private readonly courtAccountsAllocationStorage: SessionStorage<CourtRoomsAccounts[]>;

    venueAllocations: string[] = [];
    courtRoomsAccountsFilters: CourtRoomsAccounts[] = [];

    selectedMenu: MenuOption;

    conferencesSubscription: Subscription;
    eventHubSubscriptions: Subscription = new Subscription();
    filterSubcription: Subscription;

    hearings: HearingSummary[];
    selectedHearing: Hearing;
    originalHearings: HearingSummary[] = [];

    // this tracks heartbeats and pushes them back into a hearing summary object on each subscribe
    participantsHeartBeat: Map<string, ParticipantHeartbeat> = new Map<string, ParticipantHeartbeat>();

    loadingData: boolean;

    displayFilters = false;

    constructor(
        private queryService: VhoQueryService,
        private errorService: ErrorService,
        private eventService: EventsService,
        private logger: Logger,
        private router: Router,
        private screenHelper: ScreenHelper,
        private eventbus: EventBusService
    ) {
        this.loadingData = false;
        this.judgeAllocationStorage = new SessionStorage<string[]>(VhoStorageKeys.VENUE_ALLOCATIONS_KEY);
        this.courtAccountsAllocationStorage = new SessionStorage<CourtRoomsAccounts[]>(VhoStorageKeys.COURT_ROOMS_ACCOUNTS_ALLOCATION_KEY);
    }

    ngOnInit(): void {
        this.selectedMenu = this.menuOption.Hearing;
        this.screenHelper.enableFullScreen(true);
        this.setupEventHubSubscribers();
        this.setupFilterSubscribers();
        this.getConferenceForSelectedAllocations();
    }

    ngOnDestroy(): void {
        this.queryService.stopQuery();
        this.screenHelper.enableFullScreen(false);
        if (this.conferencesSubscription) {
            this.conferencesSubscription.unsubscribe();
        }
        if (this.filterSubcription) {
            this.filterSubcription.unsubscribe();
        }
        this.eventHubSubscriptions.unsubscribe();
        // this.eventService.stop();
    }

    setupEventHubSubscribers() {
        this.logger.debug('Subscribing to conference status changes...');
        this.eventHubSubscriptions.add(
            this.eventService.getHearingStatusMessage().subscribe(message => {
                this.handleConferenceStatusChange(message);
            })
        );

        this.logger.debug('Subscribing to participant status changes...');
        this.eventHubSubscriptions.add(
            this.eventService.getParticipantStatusMessage().subscribe(message => {
                this.handleParticipantStatusChange(message);
            })
        );

        this.logger.debug('Subscribing to EventHub disconnects');
        this.eventHubSubscriptions.add(
            this.eventService.getServiceDisconnected().subscribe(async reconnectionAttempt => {
                if (reconnectionAttempt <= 6) {
                    this.logger.info(`EventHub disconnection for vh officer`);
                    await this.refreshConferenceDataDuringDisconnect();
                } else {
                    this.errorService.goToServiceError('Your connection was lost');
                }
            })
        );

        this.logger.debug('Subscribing to EventHub reconnects');
        this.eventHubSubscriptions.add(
            this.eventService.getServiceReconnected().subscribe(async () => {
                this.logger.info(`EventHub reconnected for vh officer`);
                await this.refreshConferenceDataDuringDisconnect();
            })
        );

        this.eventHubSubscriptions.add(
            this.eventService.getHeartbeat().subscribe(heartbeat => {
                this.logger.info(`Participant Network Heartbeat Captured`);
                this.persistHeartbeat(heartbeat);
                this.handleHeartbeat(heartbeat);
            })
        );

        this.eventService.start();
    }

    onConferenceSelected(conference: ConferenceForVhOfficerResponse) {
        this.logger.info(`Conference ${conference.id} selected`);
        if (!this.isCurrentConference(conference.id)) {
            this.clearSelectedConference();
            this.retrieveConferenceDetails(conference.id);
        }
    }

    handleConferenceStatusChange(message: ConferenceStatusMessage) {
        const conference = this.hearings.find(c => c.id === message.conferenceId);
        if (!conference) {
            return false;
        }
        conference.status = message.status;
        if (this.isCurrentConference(message.conferenceId)) {
            this.selectedHearing.getConference().status = message.status;
        }
    }

    handleParticipantStatusChange(message: ParticipantStatusMessage): any {
        const participantInList = ConferenceHelper.findParticipantInHearings(this.hearings, message.conferenceId, message.participantId);
        // update in list
        if (participantInList) {
            participantInList.status = message.status;
        }

        // update for hearing page
        if (this.isCurrentConference(message.conferenceId)) {
            const participantToUpdate = this.selectedHearing.participants.find(x => x.id === message.participantId);
            participantToUpdate.base.status = message.status;
        }
    }

    handleHeartbeat(heartBeat: ParticipantHeartbeat) {
        const participantInList = ConferenceHelper.findParticipantInHearings(
            this.hearings,
            heartBeat.conferenceId,
            heartBeat.participantId
        );

        if (participantInList) {
            participantInList.participantHertBeatHealth = heartBeat;
        }
    }

    persistHeartbeat(heartbeat: ParticipantHeartbeat) {
        this.participantsHeartBeat[heartbeat.participantId] = heartbeat;
    }

    async refreshConferenceDataDuringDisconnect() {
        this.logger.warn('EventHub refresh pending...');
        this.retrieveHearingsForVhOfficer(true);
        if (this.selectedHearing) {
            await this.retrieveConferenceDetails(this.selectedHearing.id);
        }
    }

    getConferenceForSelectedAllocations() {
        this.loadVenueSelection();
        this.loadCourtRoomsAccountFilters();
        this.queryService.startQuery(this.venueAllocations);
        this.retrieveHearingsForVhOfficer(true);
    }

    loadVenueSelection(): void {
        const venues = this.judgeAllocationStorage.get();
        this.venueAllocations = venues; // .map(v => v.name);
    }

    loadCourtRoomsAccountFilters(): void {
        this.courtRoomsAccountsFilters = this.courtAccountsAllocationStorage.get();
    }

    retrieveHearingsForVhOfficer(reload: boolean) {
        this.loadingData = reload;
        this.conferencesSubscription = this.queryService.getConferencesForVHOfficer(this.venueAllocations).subscribe(
            async (data: ConferenceForVhOfficerResponse[]) => {
                this.hearings = data.map(c => {
                    const h = new HearingSummary(c);
                    h.getParticipants().forEach(p => {
                        p.participantHertBeatHealth = this.participantsHeartBeat[p.id];
                    });
                    return h;
                });

                if (this.hearings) {
                    this.applyFilterInit();
                }

                if (this.selectedHearing) {
                    this.eventbus.emit(new EmitEvent(VHEventType.PageRefreshed, null));
                }

                this.loadingData = false;
            },
            error => {
                this.logger.error('There was an error setting up VH Officer dashboard', error);
                this.loadingData = false;
                this.errorService.handleApiError(error);
            }
        );
    }

    applyFilterInit() {
        Object.assign(this.originalHearings, this.hearings);
        const filter = this.courtAccountsAllocationStorage.get();
        if (filter) {
            this.applyFilter(filter);
        }
    }

    isCurrentConference(conferenceId: string): boolean {
        return this.selectedHearing != null && this.selectedHearing.getConference().id === conferenceId;
    }

    clearSelectedConference() {
        this.selectedHearing = null;
    }

    async retrieveConferenceDetails(conferenceId: string) {
        try {
            const conference = await this.queryService.getConferenceByIdVHO(conferenceId);
            this.selectedHearing = new Hearing(conference);
        } catch (error) {
            this.logger.error(`There was an error when selecting conference ${conferenceId}`, error);
            this.errorService.handleApiError(error);
        }
    }

    onMenuSelected(menu: MenuOption) {
        this.selectedMenu = menu;
    }

    goBackToVenueSelection() {
        this.router.navigateByUrl(pageUrls.AdminVenueList);
    }

    showFilters() {
        this.displayFilters = !this.displayFilters;
    }

    setupFilterSubscribers() {
        this.filterSubcription = this.eventbus.on<CourtRoomsAccounts[]>(VHEventType.ApplyCourtAccountFilter, applyFilter => {
            this.courtAccountsAllocationStorage.set(applyFilter);
            this.displayFilters = false;
            this.applyFilter(applyFilter);
        });
    }

    applyFilter(filter: CourtRoomsAccounts[]) {
        const isOriginal = filter.every(x => x.selected);
        Object.assign(this.hearings, this.originalHearings);

        if (!isOriginal) {
            this.hearings = this.hearings.filter(x => x.getParticipants().some(j => j.isJudge && this.isSelectedHearing(j, filter)));
        }
    }

    isSelectedHearing(participant: ParticipantSummary, filter: CourtRoomsAccounts[]): boolean {
        const venue = filter.find(s => s.venue === participant.firstName);
        if (venue) {
            return venue.courtsRooms.some(room => room.selected && participant.lastName === room.courtRoom);
        } else {
            // if the venue could not be found (the venue name is not match the judge first name) will not hide the hearing
            this.logger.warn(`Venue for judge first name: ${participant.firstName} could not be found in court rooms accounts`);
            return true;
        }
    }
}
