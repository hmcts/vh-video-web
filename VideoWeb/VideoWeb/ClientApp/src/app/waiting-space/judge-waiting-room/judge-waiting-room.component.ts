import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ConferenceResponse, ConferenceStatus, ParticipantStatus } from 'src/app/services/clients/api-client';
import { ErrorService } from 'src/app/services/error.service';
import { EventsService } from 'src/app/services/events.service';
import { JudgeEventService } from 'src/app/services/judge-event.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { ParticipantStatusMessage } from 'src/app/services/models/participant-status-message';
import { Hearing } from 'src/app/shared/models/hearing';
import { pageUrls } from 'src/app/shared/page-url.constants';

@Component({
    selector: 'app-judge-waiting-room',
    templateUrl: './judge-waiting-room.component.html',
    styleUrls: ['./judge-waiting-room.component.scss']
})
export class JudgeWaitingRoomComponent implements OnInit, OnDestroy {
    loadingData: boolean;
    conference: ConferenceResponse;
    hearing: Hearing;

    eventHubSubscriptions: Subscription = new Subscription();

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private videoWebService: VideoWebService,
        private eventService: EventsService,
        private errorService: ErrorService,
        private logger: Logger,
        private judgeEventService: JudgeEventService
    ) {
        this.loadingData = true;
    }

    ngOnInit() {
        this.getConference().then(() => {
            this.setupEventHubSubscribers();
            this.postEventJudgeAvailableStatus();
        });
    }

    @HostListener('window:beforeunload')
    async ngOnDestroy(): Promise<void> {
        this.logger.debug('[Judge WR] - Clearing intervals and subscriptions for judge waiting room');
        this.eventHubSubscriptions.unsubscribe();
        this.eventService.stop();
        await this.postEventJudgeUnvailableStatus();
    }

    async getConference() {
        const conferenceId = this.route.snapshot.paramMap.get('conferenceId');
        try {
            this.conference = await this.videoWebService.getConferenceById(conferenceId);
            this.hearing = new Hearing(this.conference);
            this.loadingData = false;
        } catch (error) {
            this.loadingData = false;
            if (!this.errorService.returnHomeIfUnauthorised(error)) {
                this.errorService.handleApiError(error);
            }
        }
    }

    async postEventJudgeAvailableStatus() {
        await this.judgeEventService.raiseJudgeAvailableEvent(this.hearing.id);
    }

    async postEventJudgeUnvailableStatus(): Promise<boolean> {
        this.logger.debug('[Judge WR] - running exit code');
        try {
            await this.judgeEventService.raiseJudgeUnavailableEvent(this.hearing.id);
            return true;
        } catch (error) {
            this.logger.error('[Judge WR] - failed to run exit code', error);
            return false;
        }
    }

    getConferenceStatusText() {
        switch (this.conference.status) {
            case ConferenceStatus.NotStarted:
                return 'Start this hearing';
            case ConferenceStatus.Suspended:
                return 'Hearing suspended';
            case ConferenceStatus.Paused:
                return 'Hearing paused';
            case ConferenceStatus.Closed:
                return 'Hearing is closed';
            default:
                return 'Hearing is in session';
        }
    }

    isNotStarted(): boolean {
        return this.conference.status === ConferenceStatus.NotStarted;
    }

    isPaused(): boolean {
        return this.conference.status === ConferenceStatus.Paused || this.conference.status === ConferenceStatus.Suspended;
    }

    goToHearingPage(): void {
        this.router.navigate([pageUrls.JudgeHearingRoom, this.conference.id]);
    }

    goToJudgeHearingList(): void {
        this.router.navigate([pageUrls.JudgeHearingList]);
    }

    setupEventHubSubscribers() {
        this.eventHubSubscriptions.add(
            this.eventService.getHearingStatusMessage().subscribe((message) => {
                this.handleHearingStatusChange(message.status);
            })
        );

        this.eventHubSubscriptions.add(
            this.eventService.getParticipantStatusMessage().subscribe((message) => {
                this.handleParticipantStatusChange(message);
            })
        );

        this.logger.debug('[Judge WR] - Subscribing to EventHub disconnects');
        this.eventHubSubscriptions.add(
            this.eventService.getServiceDisconnected().subscribe(() => {
                this.logger.info(`[Judge WR] - EventHub disconnection for vh officer`);
                this.getConference();
            })
        );

        this.logger.debug('[Judge WR] - Subscribing to EventHub reconnects');
        this.eventHubSubscriptions.add(
            this.eventService.getServiceReconnected().subscribe(() => {
                this.logger.info(`[Judge WR] - EventHub re-connected for vh officer`);
                this.getConference();
            })
        );

        this.eventService.start();
    }

    handleParticipantStatusChange(message: ParticipantStatusMessage): any {
        const status = message.status;
        const participant = this.conference.participants.find((p) => p.id === message.participantId);
        if (participant) {
            participant.status = status;
        }

        const judgeDisconnected = this.hearing.judge.id === message.participantId && message.status === ParticipantStatus.Disconnected;
        if (
            (this.conference.status === ConferenceStatus.Suspended || this.conference.status === ConferenceStatus.Paused) &&
            judgeDisconnected
        ) {
            this.postEventJudgeAvailableStatus();
        }
    }

    handleHearingStatusChange(status: ConferenceStatus) {
        this.conference.status = status;
    }

    checkEquipment() {
        this.router.navigate([pageUrls.EquipmentCheck, this.conference.id]);
    }

    hearingSuspended(): boolean {
        return this.conference.status === ConferenceStatus.Suspended;
    }

    hearingPaused(): boolean {
        return this.conference.status === ConferenceStatus.Paused;
    }
}
