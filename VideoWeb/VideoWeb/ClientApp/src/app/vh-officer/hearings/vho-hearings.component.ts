import { Component, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import {
    ConferenceForVhOfficerResponse,
    HearingVenueResponse,
    ParticipantResponseVho,
    ParticipantStatus
} from 'src/app/services/clients/api-client';
import { ErrorService } from 'src/app/services/error.service';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { ConferenceStatusMessage } from 'src/app/services/models/conference-status-message';
import { ParticipantStatusMessage } from 'src/app/services/models/participant-status-message';
import { Hearing } from 'src/app/shared/models/hearing';
import { HearingSummary } from 'src/app/shared/models/hearing-summary';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { ParticipantHeartbeat } from '../../services/models/participant-heartbeat';
import { SessionStorage } from '../../services/session-storage';
import { ConferenceForUser, ExtendedConferenceStatus, HearingsFilter } from '../../shared/models/hearings-filter';
import { ParticipantSummary } from '../../shared/models/participant-summary';
import { PackageLost } from '../services/models/package-lost';
import { ParticipantGraphInfo } from '../services/models/participant-graph-info';
import { VhoStorageKeys } from '../services/models/session-keys';
import { VhoHearingListComponent } from '../vho-hearing-list/vho-hearing-list.component';

@Component({
    selector: 'app-vho-hearings',
    templateUrl: './vho-hearings.component.html',
    styleUrls: ['./vho-hearings.component.scss']
})
export class VhoHearingsComponent implements OnInit, OnDestroy {
    adminFrameWidth: number;
    adminFrameHeight: number;

    interval: NodeJS.Timer;
    loadingData: boolean;

    conferences: HearingSummary[];
    conferencesAll: ConferenceForVhOfficerResponse[];
    selectedHearing: Hearing;
    participants: ParticipantResponseVho[];
    selectedConferenceUrl: SafeResourceUrl;

    conferencesSubscription: Subscription;
    eventHubSubscriptions: Subscription = new Subscription();

    displayFilter = false;
    filterOptionsCount = 0;
    private readonly hearingsFilterStorage: SessionStorage<HearingsFilter>;
    private readonly venueAllocationStorage: SessionStorage<HearingVenueResponse[]>;

    displayGraph = false;
    packageLostArray: PackageLost[];
    monitoringParticipant: ParticipantGraphInfo;

    @ViewChild('conferenceList', { static: false })
    $conferenceList: VhoHearingListComponent;
    participantsHeartBeat: ParticipantHeartbeat[] = [];

    venueAllocations: string[] = [];

    @HostListener('window:resize', [])
    onResize() {
        this.updateWidthForAdminFrame();
    }

    constructor(
        private videoWebService: VideoWebService,
        public sanitizer: DomSanitizer,
        private errorService: ErrorService,
        private eventService: EventsService,
        private logger: Logger,
        private router: Router
    ) {
        this.loadingData = false;
        this.adminFrameWidth = 0;
        this.adminFrameHeight = this.getHeightForFrame();
        this.hearingsFilterStorage = new SessionStorage<HearingsFilter>(VhoStorageKeys.HEARINGS_FITER_KEY);
        this.venueAllocationStorage = new SessionStorage<HearingVenueResponse[]>(VhoStorageKeys.VENUE_ALLOCATIONS_KEY);
    }

    ngOnInit() {
        this.logger.info('Loading VH Officer Dashboard');
        this.setupEventHubSubscribers();
        this.getConferenceForSelectedAllocations();
    }

    @HostListener('window:beforeunload')
    ngOnDestroy(): void {
        this.enableFullScreen(false);
        this.logger.debug('Clearing intervals and subscriptions for VH Officer');
        clearInterval(this.interval);
        this.eventHubSubscriptions.unsubscribe();
        if (this.conferencesSubscription) {
            this.conferencesSubscription.unsubscribe();
        }
    }

    getConferenceForSelectedAllocations() {
        this.loadVenueSelection();
        this.retrieveHearingsForVhOfficer(true);
        // this.setupConferenceInterval();
    }

    loadVenueSelection(): void {
        const venues = this.venueAllocationStorage.get();
        this.venueAllocations = venues.map(v => v.name);
    }

    setupConferenceInterval() {
        clearInterval(this.interval);
        this.interval = setInterval(() => {
            this.retrieveHearingsForVhOfficer(false);
        }, 30000);
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
                this.addHeartBeatToTheList(heartbeat);
                this.handleHeartbeat(heartbeat);
            })
        );

        this.eventService.start();
    }

    handleHeartbeat(heartBeat: ParticipantHeartbeat) {
        if (this.conferences !== undefined) {
            const conferenceToUpdate = this.conferences.find(c => c.id === heartBeat.conferenceId);

            if (!conferenceToUpdate) {
                return;
            }

            const participantToUpdate = conferenceToUpdate.getParticipants().find(x => x.id === heartBeat.participantId);
            if (participantToUpdate) {
                participantToUpdate.participantHertBeatHealth = heartBeat;
            }
        }
    }

    async refreshConferenceDataDuringDisconnect() {
        this.logger.warn('EventHub refresh pending...');
        this.retrieveHearingsForVhOfficer(true);
        if (this.selectedHearing) {
            await this.retrieveConferenceDetails(this.selectedHearing.id);
        }
    }

    retrieveHearingsForVhOfficer(reload: boolean) {
        this.loadingData = reload;
        this.conferencesSubscription = this.videoWebService.getConferencesForVHOfficer(this.venueAllocations).subscribe(
            async (data: ConferenceForVhOfficerResponse[]) => {
                this.logger.debug('Successfully retrieved hearings for VHO');
                this.conferences = data.map(c => new HearingSummary(c));
                this.conferencesAll = data;
                if (this.participantsHeartBeat !== undefined && this.participantsHeartBeat.length > 0) {
                    this.participantsHeartBeat.forEach(x => {
                        this.handleHeartbeat(x);
                    });
                }
                if (data && data.length > 0) {
                    this.logger.debug('VH Officer has conferences');
                    this.applyActiveFilter();
                    this.enableFullScreen(true);
                } else {
                    this.logger.debug('VH Officer has no conferences');
                    this.enableFullScreen(false);
                }

                this.loadingData = false;
            },
            error => {
                this.logger.error('There was an error setting up VH Officer dashboard', error);
                this.loadingData = false;
                this.enableFullScreen(false);
                this.errorService.handleApiError(error);
            }
        );
    }

    applyActiveFilter() {
        const filter = this.hearingsFilterStorage.get();
        if (filter) {
            // filtering removed from front-end
        }
    }

    get hasHearings(): boolean {
        return !this.loadingData && this.conferencesAll && this.conferencesAll.length > 0;
    }

    get isHearingSelected(): boolean {
        return !!(this.selectedHearing && this.selectedHearing.getConference());
    }

    clearSelectedConference() {
        this.selectedHearing = null;
        this.selectedConferenceUrl = null;
    }

    onConferenceSelected(conference: ConferenceForVhOfficerResponse) {
        this.logger.info(`Conference ${conference.id} selected`);
        if (!this.isCurrentConference(conference)) {
            this.clearSelectedConference();
            this.retrieveConferenceDetails(conference.id);
        }
    }

    async retrieveConferenceDetails(conferenceId: string) {
        try {
            const data = await this.videoWebService.getConferenceByIdVHO(conferenceId);
            this.selectedHearing = new Hearing(data);
            this.participants = data.participants;
            this.sanitiseAndLoadIframe();
        } catch (error) {
            this.logger.error(`There was an error when selecting conference ${conferenceId}`, error);
            if (!this.errorService.returnHomeIfUnauthorised(error)) {
                this.errorService.handleApiError(error);
            }
        }
    }

    isCurrentConference(conference: ConferenceForVhOfficerResponse): boolean {
        return this.selectedHearing != null && this.selectedHearing.getConference().id === conference.id;
    }

    updateWidthForAdminFrame(): void {
        const listColumnElement: HTMLElement = document.getElementById('list-column');
        let listWidth = 0;
        if (listColumnElement) {
            listWidth = listColumnElement.offsetWidth;
        }
        const windowWidth = window.innerWidth;
        this.adminFrameWidth = windowWidth - listWidth - 350;
    }

    getHeightForFrame(): number {
        return 300;
    }

    private sanitiseAndLoadIframe() {
        const adminUri = this.selectedHearing.getConference().admin_i_frame_uri;
        this.updateWidthForAdminFrame();
        this.selectedConferenceUrl = this.sanitizer.bypassSecurityTrustResourceUrl(adminUri);
    }

    handleParticipantStatusChange(message: ParticipantStatusMessage): any {
        if (!this.participants) {
            return;
        }
        const participantToUpdate = this.participants.find(x => x.id === message.participantId);
        if (participantToUpdate) {
            participantToUpdate.status = message.status;
            if (participantToUpdate.status === ParticipantStatus.Disconnected) {
                const participantHeartBeat = this.participantsHeartBeat.find(y => y.participantId === participantToUpdate.id);
                if (participantHeartBeat !== undefined) {
                    const heartBeatIndex = this.participantsHeartBeat.indexOf(participantHeartBeat);
                    this.participantsHeartBeat.splice(heartBeatIndex, 1);
                }
            }
        }
    }

    handleConferenceStatusChange(message: ConferenceStatusMessage) {
        const conference = this.conferences.find(c => c.id === message.conferenceId);
        if (!conference) {
            return false;
        }
        conference.status = message.status;
        if (this.isCurrentConference(new ConferenceForVhOfficerResponse({ id: message.conferenceId }))) {
            this.selectedHearing.getConference().status = message.status;
        }
    }

    enableFullScreen(fullScreen: boolean) {
        const masterContainer = document.getElementById('master-container');
        if (!masterContainer) {
            return;
        }

        if (fullScreen) {
            masterContainer.classList.add('fullscreen');
        } else {
            masterContainer.classList.remove('fullscreen');
        }
    }

    showFilter() {
        this.displayFilter = !this.displayFilter;
    }

    applyFilters(filterOptions: HearingsFilter) {
        this.logger.debug('VHO hearings applyed filters : ' + JSON.stringify(filterOptions));
        const selectedConferenceId = this.$conferenceList.currentConference ? this.$conferenceList.currentConference.id : '';
        this.clearSelectedConference();
        this.$conferenceList.currentConference = null;

        this.hearingsFilterStorage.set(filterOptions);
        this.displayFilter = false;

        this.selectFilteredConference(selectedConferenceId);
    }

    selectFilteredConference(selectedConferenceId: string) {
        if (selectedConferenceId) {
            const selectedConferenceFound = this.conferences.find(x => x.id === selectedConferenceId);
            if (selectedConferenceFound) {
                this.$conferenceList.selectConference(selectedConferenceFound);
            }
        }
    }

            // }
    setStatusDelayed(data: ConferenceForVhOfficerResponse[]): ConferenceForUser[] {
        const conferences = data.map(x => {
            const hearing = new HearingSummary(x);
            const item = new ConferenceForUser(x);
            if (hearing.isDelayed()) {
                item.statusExtended = ExtendedConferenceStatus.Delayed;
            }
            return item;
        });

        return conferences;
    }

    async onParticipantSelected(participantInfo) {
        if (!this.displayGraph) {
            if (participantInfo && participantInfo.conferenceId && participantInfo.participant) {
                const participant: ParticipantSummary = participantInfo.participant;
                this.monitoringParticipant = new ParticipantGraphInfo(participant.displayName, participant.status, participant.representee);

                await this.videoWebService
                    .getParticipantHeartbeats(participantInfo.conferenceId, participantInfo.participant.id)
                    .then(s => {
                        this.packageLostArray = s.map(x => {
                            return new PackageLost(x.recent_packet_loss, x.browser_name, x.browser_version, x.timestamp.getTime());
                        });
                        this.displayGraph = true;
                    });
            }
        }
    }

    closeGraph(value) {
        this.displayGraph = !value;
    }

    addHeartBeatToTheList(heartbeat: ParticipantHeartbeat) {
        if (this.participantsHeartBeat !== undefined && this.participantsHeartBeat.length > 0) {
            const participantPreviousHeartbeat = this.participantsHeartBeat.find(
                x => x.participantId === heartbeat.participantId && x.conferenceId === heartbeat.conferenceId
            );
            if (participantPreviousHeartbeat === undefined) {
                this.participantsHeartBeat.push(heartbeat);
            } else {
                const heartBeatIndex = this.participantsHeartBeat.indexOf(participantPreviousHeartbeat);
                this.participantsHeartBeat[heartBeatIndex] = heartbeat;
            }
        } else {
            this.participantsHeartBeat.push(heartbeat);
        }
    }

    goBackToVenueSelection() {
        this.router.navigateByUrl(pageUrls.AdminVenueList);
    }
}
