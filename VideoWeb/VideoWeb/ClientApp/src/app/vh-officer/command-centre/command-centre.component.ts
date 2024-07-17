import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import {
    ClientSettingsResponse,
    ConferenceForVhOfficerResponse,
    CourtRoomsAccountResponse,
    Role
} from 'src/app/services/clients/api-client';
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
import { ConfigService } from 'src/app/services/api/config.service';
import { FEATURE_FLAGS, LaunchDarklyService } from '../../services/launch-darkly.service';
import { NewAllocationMessage } from '../../services/models/new-allocation-message';
import { NotificationToastrService } from '../../waiting-space/services/notification-toastr.service';
import { CsoFilter } from '../services/models/cso-filter';
import { ParticipantsUpdatedMessage } from 'src/app/shared/models/participants-updated-message';
import { catchError } from 'rxjs/operators';

@Component({
    selector: 'app-command-centre',
    templateUrl: './command-centre.component.html',
    styleUrls: ['./command-centre.component.scss', '../vho-global-styles.scss']
})
export class CommandCentreComponent implements OnInit, OnDestroy {
    public menuOption = MenuOption;

    venueAllocations: string[] = [];
    courtRoomsAccountsFilters: CourtRoomsAccounts[] = [];
    csoFilter: CsoFilter;
    activeSessionsOnly: boolean;

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
    configSettings: ClientSettingsResponse;
    displayFilters = false;
    vhoWorkAllocationFeatureFlag: boolean;

    protected readonly activeSessionsStorage: SessionStorage<boolean>;

    private readonly loggerPrefix = '[CommandCentre] -';
    private readonly judgeAllocationStorage: SessionStorage<string[]>;
    private readonly courtAccountsAllocationStorage: SessionStorage<CourtRoomsAccounts[]>;
    private readonly csoAllocationStorage: SessionStorage<CsoFilter>;

    constructor(
        private queryService: VhoQueryService,
        private errorService: ErrorService,
        private eventService: EventsService,
        private logger: Logger,
        private router: Router,
        private screenHelper: ScreenHelper,
        private eventbus: EventBusService,
        private configService: ConfigService,
        private ldService: LaunchDarklyService,
        protected notificationToastrService: NotificationToastrService
    ) {
        this.loadingData = false;
        this.judgeAllocationStorage = new SessionStorage<string[]>(VhoStorageKeys.VENUE_ALLOCATIONS_KEY);
        this.courtAccountsAllocationStorage = new SessionStorage<CourtRoomsAccounts[]>(VhoStorageKeys.COURT_ROOMS_ACCOUNTS_ALLOCATION_KEY);
        this.csoAllocationStorage = new SessionStorage<CsoFilter>(VhoStorageKeys.CSO_ALLOCATIONS_KEY);
        this.activeSessionsStorage = new SessionStorage<boolean>(VhoStorageKeys.ACTIVE_SESSIONS_END_OF_DAY_KEY);
        this.activeSessionsOnly = this.activeSessionsStorage.get() ?? false;
        this.ldService.getFlag<boolean>(FEATURE_FLAGS.vhoWorkAllocation, false).subscribe(value => {
            this.vhoWorkAllocationFeatureFlag = value;
        });
    }

    ngOnInit(): void {
        this.configService.getClientSettings().subscribe(data => {
            this.configSettings = data;
        });

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
    }

    setupEventHubSubscribers() {
        this.logger.debug(`${this.loggerPrefix} Subscribing to conference status changes...`);
        this.eventHubSubscriptions.add(
            this.eventService.getHearingStatusMessage().subscribe(message => {
                this.handleConferenceStatusChange(message);
            })
        );

        this.logger.debug(`${this.loggerPrefix} Subscribing to participant status changes...`);
        this.eventHubSubscriptions.add(
            this.eventService.getParticipantStatusMessage().subscribe(message => {
                this.handleParticipantStatusChange(message);
            })
        );

        this.logger.debug(`${this.loggerPrefix} Subscribing to EventHub disconnects`);
        this.eventHubSubscriptions.add(
            this.eventService.getServiceDisconnected().subscribe(async reconnectionAttempt => {
                if (reconnectionAttempt <= 6) {
                    this.logger.debug(`${this.loggerPrefix} EventHub disconnection for vh officer`);
                    await this.refreshConferenceDataDuringDisconnect();
                } else {
                    this.errorService.goToServiceError('Your connection was lost');
                }
            })
        );

        this.logger.debug(`${this.loggerPrefix} Subscribing to EventHub reconnects`);
        this.eventHubSubscriptions.add(
            this.eventService.getServiceConnected().subscribe(async () => {
                this.logger.debug(`${this.loggerPrefix} EventHub reconnected for vh officer`);
                await this.refreshConferenceDataDuringDisconnect();
            })
        );

        this.eventHubSubscriptions.add(
            this.eventService.getHeartbeat().subscribe(heartbeat => {
                this.logger.debug(`${this.loggerPrefix} Participant Network Heartbeat Captured`);
                this.persistHeartbeat(heartbeat);
                this.handleHeartbeat(heartbeat);
            })
        );

        this.logger.debug('[WR] - Subscribing to participants update complete message');
        this.eventHubSubscriptions.add(
            this.eventService.getParticipantsUpdated().subscribe(async participantsUpdatedMessage => {
                this.handleParticipantsUpdatedMessage(participantsUpdatedMessage);
            })
        );

        this.eventHubSubscriptions.add(
            this.eventService
                .getAllocationMessage()
                .subscribe(allocationHearingMessage => this.handleAllocationUpdate(allocationHearingMessage))
        );
    }

    onConferenceSelected(conference: ConferenceForVhOfficerResponse) {
        this.logger.debug(`${this.loggerPrefix} Conference ${conference.id} selected`, { conference: conference.id });
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

    handleParticipantsUpdatedMessage(participantsUpdatedMessage: ParticipantsUpdatedMessage) {
        this.logger.debug(`${this.loggerPrefix} - Participants updated message recieved`, {
            conference: participantsUpdatedMessage.conferenceId,
            participants: participantsUpdatedMessage.participants
        });

        if (this.isCurrentConference(participantsUpdatedMessage.conferenceId)) {
            this.selectedHearing.updateParticipants(participantsUpdatedMessage.participants);
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
        this.logger.warn(`${this.loggerPrefix} EventHub refresh pending...`);
        this.queryService.runQuery();
        if (this.selectedHearing) {
            await this.retrieveConferenceDetails(this.selectedHearing.id);
        }
    }

    getConferenceForSelectedAllocations() {
        this.loadVenueSelection();
        // this.loadCourtRoomsAccountFilters();
        this.loadCsoFilter();
        this.queryService.startQuery(
            this.venueAllocations,
            this.csoFilter?.allocatedCsoIds,
            this.csoFilter?.includeUnallocated,
            this.activeSessionsOnly
        );
        this.retrieveHearingsForVhOfficer(true);
    }

    loadVenueSelection(): void {
        const venues = this.judgeAllocationStorage.get();
        this.venueAllocations = venues; // .map(v => v.name);
    }

    loadCsoFilter(): void {
        this.csoFilter = this.csoAllocationStorage.get();
    }

    retrieveHearingsForVhOfficer(reload: boolean) {
        this.loadingData = reload;
        this.conferencesSubscription = this.queryService
            .getQueryResults()
            .pipe(
                catchError(error => {
                    this.logger.error(`${this.loggerPrefix} There was an error setting up VH Officer dashboard`, error);
                    this.loadingData = false;
                    this.errorService.handleApiError(error);
                    return [];
                })
            )
            .subscribe(data => {
                this.hearings = data.map(c => {
                    const h = new HearingSummary(c);
                    h.isJoinByPhone = this.isJoinByPhone(h);
                    h.getParticipants().forEach(p => {
                        p.participantHertBeatHealth = this.participantsHeartBeat[p.id];
                    });
                    return h;
                });

                if (this.hearings) {
                    this.getFiltersCourtRoomsAccounts(this.mapConferencesToCourtRoomsAccountResponses(data));
                    this.applyFilterInit();
                }

                if (this.selectedHearing) {
                    this.eventbus.emit(new EmitEvent(VHEventType.PageRefreshed, null));
                }

                this.loadingData = false;
            });
    }

    isJoinByPhone(hearing: HearingSummary): boolean {
        if (!this.configSettings) {
            this.logger.warn(`${this.loggerPrefix} (isJoinByPhone) config settings is falsey`);
        }

        const datePhone = this.configSettings?.join_by_phone_from_date;
        this.logger.debug(`${this.loggerPrefix} Join by date from settings is: ${datePhone}`);

        if (!datePhone || datePhone.length === 0) {
            return true;
        }

        const dateFrom = this.getDateFromString(datePhone);
        if (hearing.createdDateTime) {
            return Date.parse(hearing.createdDateTime.toString()) >= Date.parse(dateFrom.toString());
        } else {
            return false;
        }
    }

    getDateFromString(datePhone: string): Date {
        const dateParts = datePhone.split('-');
        return new Date(+dateParts[0], +dateParts[1] - 1, +dateParts[2]);
    }

    applyFilterInit() {
        this.originalHearings.length = 0;
        this.hearings.forEach(x => this.originalHearings.push(x));
        const filter = this.courtAccountsAllocationStorage.get();
        if (filter && !filter.every(x => x.selected)) {
            this.hearingsFiltering(filter);
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
            this.logger.error(`${this.loggerPrefix} There was an error when selecting conference ${conferenceId}`, error);
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
        this.hearings.length = 0;
        this.originalHearings.forEach(x => this.hearings.push(x));
        this.hearingsFiltering(filter);
    }

    hearingsFiltering(filter) {
        this.hearings = this.hearings.filter(x => x.getParticipants().some(j => j.isJudge && this.isSelectedHearing(j, filter)));
    }

    isSelectedHearing(participant: ParticipantSummary, filter: CourtRoomsAccounts[]): boolean {
        const venue = filter.find(s => s.venue === participant.firstName);
        if (venue) {
            return venue.courtsRooms.some(room => room.selected && participant.lastName === room.courtRoom);
        } else {
            // if the venue could not be found (the venue name is not match the judge first name) will not hide the hearing
            this.logger.warn(
                `${this.loggerPrefix} Venue for judge first name: ${participant.firstName} could not be found in court rooms accounts`,
                { venue: participant.firstName }
            );
            return false;
        }
    }

    handleAllocationUpdate(allocationHearingMessage: NewAllocationMessage) {
        if (allocationHearingMessage.hearingDetails.length > 0) {
            this.notificationToastrService.createAllocationNotificationToast(allocationHearingMessage.hearingDetails);
        }
    }

    private mapConferencesToCourtRoomsAccountResponses(conferences: ConferenceForVhOfficerResponse[]): CourtRoomsAccountResponse[] {
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
                acc[venue].push(judge);
                return acc;
            }, {});

        return Object.entries(venuesAndJudges)
            .map(
                ([venue, judges]) =>
                    new CourtRoomsAccountResponse({
                        rooms: judges.sort(),
                        venue: venue
                    })
            )
            .sort((a, b) => a.venue.localeCompare(b.venue));
    }

    private getFiltersCourtRoomsAccounts(response: CourtRoomsAccountResponse[]) {
        const updateFilterSelection = (filterVenue: CourtRoomsAccounts) => {
            const courtroomAccount = this.courtRoomsAccountsFilters.find(x => x.venue === filterVenue.venue);
            if (courtroomAccount) {
                courtroomAccount.selected = filterVenue.selected;
                courtroomAccount.updateRoomSelection(filterVenue.courtsRooms);
            }
        };
        this.courtRoomsAccountsFilters = response.map(x => new CourtRoomsAccounts(x.venue, x.rooms, true));
        const previousFilter = this.courtAccountsAllocationStorage.get();
        if (previousFilter) {
            previousFilter.forEach(x => updateFilterSelection(x));
        }
        this.courtAccountsAllocationStorage.set(this.courtRoomsAccountsFilters);
    }
}
