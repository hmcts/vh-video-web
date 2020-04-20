import { Component, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import * as $ from 'jquery';
import { Subscription } from 'rxjs';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import {
    ConferenceForVhOfficerResponse,
    ParticipantResponseVho,
    ParticipantStatus,
    Role,
    TaskResponse,
    HearingVenueResponse
} from 'src/app/services/clients/api-client';
import { ErrorService } from 'src/app/services/error.service';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { ConferenceStatusMessage } from 'src/app/services/models/conference-status-message';
import { ParticipantStatusMessage } from 'src/app/services/models/participant-status-message';
import { Hearing } from 'src/app/shared/models/hearing';
import { HearingSummary } from 'src/app/shared/models/hearing-summary';
import { Participant } from 'src/app/shared/models/participant';
import { ParticipantStatusModel } from 'src/app/shared/models/participants-status-model';
import { TaskCompleted } from '../../on-the-day/models/task-completed';
import { ParticipantHeartbeat } from '../../services/models/participant-heartbeat';
import { SessionStorage } from '../../services/session-storage';
import { ConferenceForUser, ExtendedConferenceStatus, HearingsFilter } from '../../shared/models/hearings-filter';
import { ParticipantSummary } from '../../shared/models/participant-summary';
import { PackageLost } from '../services/models/package-lost';
import { ParticipantGraphInfo } from '../services/models/participant-graph-info';
import { VhoHearingListComponent } from '../vho-hearing-list/vho-hearing-list.component';
import { VhoStorageKeys } from '../services/models/session-keys';
import { Router } from '@angular/router';
import { PageUrls } from 'src/app/shared/page-url.constants';

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
    participantStatusModel: ParticipantStatusModel;
    selectedConferenceUrl: SafeResourceUrl;

    tasks: TaskResponse[];
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
        this.hearingsFilterStorage = new SessionStorage(VhoStorageKeys.HEARINGS_FITER_KEY);
        this.venueAllocationStorage = new SessionStorage(VhoStorageKeys.VENUE_ALLOCATIONS_KEY);
    }

    ngOnInit() {
        this.logger.info('Loading VH Officer Dashboard');
        this.setupEventHubSubscribers();
        this.getConferenceForSelectedAllocations();
    }

    @HostListener('window:beforeunload')
    ngOnDestroy(): void {
        this.logger.debug('Clearing intervals and subscriptions for VH Officer');
        clearInterval(this.interval);
        if (this.conferencesSubscription) {
            this.conferencesSubscription.unsubscribe();
        }
        if (this.eventHubSubscriptions) {
            this.eventHubSubscriptions.unsubscribe();
        }
    }

    getConferenceForSelectedAllocations() {
        const venues = this.venueAllocationStorage.get();
        this.venueAllocations = venues.map((v) => v.name);
        this.retrieveHearingsForVhOfficer();
        clearInterval(this.interval);
        this.interval = setInterval(() => {
            this.retrieveHearingsForVhOfficer();
        }, 30000);
    }

    private setupEventHubSubscribers() {
        this.logger.debug('Subscribing to conference status changes...');
        this.eventHubSubscriptions.add(
            this.eventService.getHearingStatusMessage().subscribe((message) => {
                this.handleConferenceStatusChange(message);
            })
        );

        this.logger.debug('Subscribing to participant status changes...');
        this.eventHubSubscriptions.add(
            this.eventService.getParticipantStatusMessage().subscribe((message) => {
                this.handleParticipantStatusChange(message);
            })
        );

        this.logger.debug('Subscribing to EventHub disconnects');
        this.eventHubSubscriptions.add(
            this.eventService.getServiceDisconnected().subscribe((reconnectionAttempt) => {
                if (reconnectionAttempt < 6) {
                    this.logger.info(`EventHub disconnection for vh officer`);
                    this.refreshConferenceDataDuringDisconnect();
                } else {
                    this.errorService.goToServiceError();
                }
            })
        );

        this.logger.debug('Subscribing to EventHub reconnects');
        this.eventHubSubscriptions.add(
            this.eventService.getServiceReconnected().subscribe(() => {
                this.logger.info(`EventHub reconnected for vh officer`);
                this.refreshConferenceDataDuringDisconnect();
            })
        );

        this.eventHubSubscriptions.add(
            this.eventService.getAdminAnsweredChat().subscribe((message) => {
                this.logger.info(`an admin has answered`);
                this.resetConferenceUnreadCounter(message);
            })
        );

        this.eventHubSubscriptions.add(
            this.eventService.getHeartbeat().subscribe((heartbeat) => {
                this.logger.info(`Participant Network Heartbeat Captured`);
                this.addHeartBeatToTheList(heartbeat);
                this.handleHeartbeat(heartbeat);
            })
        );

        this.eventService.start();
    }

    resetConferenceUnreadCounter(conferenceId: string) {
        const conference = this.conferences.find((x) => x.id === conferenceId);
        if (conference) {
            const index = this.conferences.indexOf(conference);
            this.conferences[index].numberOfUnreadMessages = 0;
        }
    }

    handleHeartbeat(heartBeat: ParticipantHeartbeat) {
        if (this.conferences !== undefined) {
            const conferenceToUpdate = this.conferences.find((c) => c.id === heartBeat.conferenceId);

            if (!conferenceToUpdate) {
                return;
            }

            const participantToUpdate = conferenceToUpdate.getParticipants().find((x) => x.id === heartBeat.participantId);
            if (participantToUpdate) {
                participantToUpdate.participantHertBeatHealth = heartBeat;
            }
        }
    }

    refreshConferenceDataDuringDisconnect() {
        this.logger.warn('EventHub refresh pending...');
        this.retrieveHearingsForVhOfficer();
        if (this.selectedHearing) {
            this.retrieveConferenceDetails(this.selectedHearing.id);
        }
    }

    retrieveHearingsForVhOfficer() {
        this.conferencesSubscription = this.videoWebService.getConferencesForVHOfficer(this.venueAllocations).subscribe(
            (data: ConferenceForVhOfficerResponse[]) => {
                this.logger.debug('Successfully retrieved hearings for VHO');
                this.loadingData = false;
                this.conferences = data.map((c) => new HearingSummary(c));
                this.conferencesAll = data;
                if (this.participantsHeartBeat !== undefined && this.participantsHeartBeat.length > 0) {
                    this.participantsHeartBeat.forEach((x) => {
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

                if (this.selectedHearing) {
                    this.logger.debug(`Retrieving tasks for conference ${this.selectedHearing.id}`);
                    this.getTasksForConference(this.selectedHearing.getConference().id);
                }
            },
            (error) => {
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
            this.activateFilterOptions(filter);
        }
    }

    hasHearings(): boolean {
        return !this.loadingData && this.conferencesAll && this.conferencesAll.length > 0;
    }

    hasTasks(): boolean {
        return this.selectedHearing !== undefined && this.tasks !== undefined && this.tasks.length > 0;
    }

    isHearingSelected(): boolean {
        return !!(this.selectedHearing && this.selectedHearing.getConference());
    }

    clearSelectedConference() {
        this.selectedHearing = null;
        this.selectedConferenceUrl = null;
        this.tasks = [];
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
            this.getTasksForConference(conferenceId);
            this.getJudgeStatusDetails();
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
        if (this.hasTasks()) {
            return 300;
        } else {
            return 600;
        }
    }

    onTaskCompleted(taskCompleted: TaskCompleted) {
        this.logger.info(`task completed for conference ${taskCompleted.conferenceId}`);
        const conference = this.conferences.find((x) => x.id === taskCompleted.conferenceId);
        conference.numberOfPendingTasks = taskCompleted.pendingTasks;
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
        const participantToUpdate = this.participants.find((x) => x.id === message.participantId);
        if (participantToUpdate) {
            participantToUpdate.status = message.status;
            if (participantToUpdate.status === ParticipantStatus.Disconnected) {
                const participantHeartBeat = this.participantsHeartBeat.find((y) => y.participantId === participantToUpdate.id);
                if (participantHeartBeat !== undefined) {
                    const heartBeatIndex = this.participantsHeartBeat.indexOf(participantHeartBeat);
                    this.participantsHeartBeat.splice(heartBeatIndex, 1);
                }
            }
            if (participantToUpdate.role === Role.Judge) {
                this.getJudgeStatusDetails();
            }
        }
    }

    handleConferenceStatusChange(message: ConferenceStatusMessage) {
        const conference = this.conferences.find((c) => c.id === message.conferenceId);
        if (!conference) {
            return false;
        }
        conference.status = message.status;
        if (this.isCurrentConference(new ConferenceForVhOfficerResponse({ id: message.conferenceId }))) {
            this.selectedHearing.getConference().status = message.status;
        }
    }

    async getTasksForConference(conferenceId: string) {
        try {
            this.tasks = await this.videoWebService.getTasksForConference(conferenceId);
            this.adminFrameHeight = this.getHeightForFrame();
        } catch (error) {
            this.errorService.handleApiError(error);
        }
    }

    enableFullScreen(fullScreen: boolean) {
        // tslint:disable-next-line:quotemark
        const masterContainerCount = $("div[id*='master-container']").length;
        if (masterContainerCount > 1) {
            throw new Error('Multiple master containers in DOM');
        }

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

        this.activateFilterOptions(filterOptions);

        this.selectFilteredConference(selectedConferenceId);
    }

    selectFilteredConference(selectedConferenceId: string) {
        if (selectedConferenceId) {
            const selectedConferenceFound = this.conferences.filter((x) => x.id === selectedConferenceId);
            if (selectedConferenceFound) {
                this.$conferenceList.selectConference(selectedConferenceFound[0]);
            }
        }
    }

    activateFilterOptions(filterOptions: HearingsFilter) {
        this.filterOptionsCount = filterOptions.numberFilterOptions;

        const selectedStatuses = filterOptions.statuses.filter((x) => x.Selected).map((x) => x.Status);
        const selectedLocations = filterOptions.locations.filter((x) => x.Selected).map((x) => x.Description);
        const selectedAlerts = filterOptions.alerts.filter((x) => x.Selected).map((x) => x.BodyText);

        if (selectedStatuses.length > 0 || selectedLocations.length > 0 || selectedAlerts.length > 0) {
            const clone = Object.assign(this.conferencesAll);
            this.conferences = clone.map((c) => new HearingSummary(c));
            if (selectedStatuses.length > 0) {
                const conferencesAllExtended = this.setStatusDelayed(this.conferencesAll);
                this.conferences = conferencesAllExtended
                    .filter((x) => selectedStatuses.includes(x.StatusExtended))
                    .map((c) => new HearingSummary(c));
            }
            if (selectedLocations.length > 0) {
                this.conferences = this.conferences.filter((x) => selectedLocations.includes(x.hearingVenueName));
            }
            if (selectedAlerts.length > 0) {
                this.conferences = this.conferences.filter((x) => this.findSelectedAlert(x.tasks, selectedAlerts));
            }
        } else {
            this.conferences = this.conferencesAll.map((c) => new HearingSummary(c));
        }
    }

    private findSelectedAlert(tasks: TaskResponse[], selectedAlerts: string[]): boolean {
        let tasksFiltered = [];
        if (tasks) {
            tasksFiltered = tasks.filter((x) => this.filterTaskByBody(selectedAlerts, x.body));
        }
        return tasksFiltered.length > 0;
    }

    private filterTaskByBody(selectedAlerts: string[], body: string): boolean {
        let result = false;
        selectedAlerts.forEach((x) => {
            if (body.includes(x)) {
                result = true;
            }
        });
        return result;
    }

    setStatusDelayed(data: ConferenceForVhOfficerResponse[]): ConferenceForUser[] {
        const conferences = data.map((x) => {
            const hearing = new HearingSummary(x);
            const item = new ConferenceForUser(x);
            if (hearing.isDelayed()) {
                item.StatusExtended = ExtendedConferenceStatus.Delayed;
            }
            return item;
        });

        return conferences;
    }

    getJudgeStatusDetails() {
        if (this.selectedHearing) {
            this.participantStatusModel = new ParticipantStatusModel();
            this.participantStatusModel.Participants = this.participants.map((p) => new Participant(p));
            this.participantStatusModel.JudgeStatuses = this.getJudgeDetailsForStatus(this.selectedHearing.id);
            this.participantStatusModel.HearingVenueName = this.selectedHearing.hearingVenueName;
        }
    }

    getJudgeDetailsForStatus(selectedConferenceId: string) {
        const judgeStatuses: ParticipantStatus[] = [];
        const selectedJudges = this.participants.filter((x) => x.role === Role.Judge);
        if (selectedJudges.length > 0) {
            const selectedJudgeUserName = selectedJudges[0].username;
            const anotherConferences = this.conferencesAll.filter((x) => x.id !== selectedConferenceId);
            anotherConferences.forEach((x) => {
                const judgeStatus = this.findJudgeInAnotherHearing(x.participants, selectedJudgeUserName);
                if (judgeStatus !== null) {
                    judgeStatuses.push(judgeStatus);
                }
            });
        }

        return judgeStatuses;
    }

    private findJudgeInAnotherHearing(participantsIn: ParticipantResponseVho[], selectedJudgeUserName: string): ParticipantStatus {
        const judgeStatusInAnotherHearings = participantsIn.filter((x) => x.username === selectedJudgeUserName).map((x) => x.status);
        return judgeStatusInAnotherHearings.length > 0 ? judgeStatusInAnotherHearings[0] : null;
    }
    async onParticipantSelected(participantInfo) {
        if (!this.displayGraph) {
            if (participantInfo && participantInfo.conferenceId && participantInfo.participant) {
                const participant: ParticipantSummary = participantInfo.participant;
                this.monitoringParticipant = new ParticipantGraphInfo(participant.displayName, participant.status, participant.representee);

                await this.videoWebService
                    .getParticipantHeartbeats(participantInfo.conferenceId, participantInfo.participant.id)
                    .then((s) => {
                        this.packageLostArray = s.map((x) => {
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
                (x) => x.participantId === heartbeat.participantId && x.conferenceId === heartbeat.conferenceId
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
        this.router.navigateByUrl(PageUrls.AdminVenueList);
    }
}
