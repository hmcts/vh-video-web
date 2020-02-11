import { Component, OnInit, NgZone, OnDestroy, HostListener } from '@angular/core';
import { ConferenceResponse, ParticipantStatus, ConferenceStatus } from 'src/app/services/clients/api-client';
import { Router, ActivatedRoute } from '@angular/router';
import { EventsService } from 'src/app/services/events.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ParticipantStatusMessage } from 'src/app/services/models/participant-status-message';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { ErrorService } from 'src/app/services/error.service';
import { Hearing } from 'src/app/shared/models/hearing';
import { Logger } from 'src/app/services/logging/logger-base';
import { AdalService } from 'adal-angular4';
import { UpdateParticipantStatusEventRequest, EventType } from 'src/app/services/clients/api-client';
import { SessionStorage } from 'src/app/services/session-storage';
import { EventStatusModel } from 'src/app/services/models/event-status.model';
import { ChatHubService } from 'src/app/services/chat-hub.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-judge-waiting-room',
    templateUrl: './judge-waiting-room.component.html',
    styleUrls: ['./judge-waiting-room.component.scss']
})
export class JudgeWaitingRoomComponent implements OnInit, OnDestroy {
    loadingData: boolean;
    conference: ConferenceResponse;
    hearing: Hearing;

    apiSubscriptions: Subscription = new Subscription();
    eventHubSubscriptions: Subscription = new Subscription();
    chatHubSubscription: Subscription = new Subscription();

    private readonly eventStatusCache: SessionStorage<EventStatusModel>;
    readonly JUDGE_STATUS_KEY = 'vh.judge.status';

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private videoWebService: VideoWebService,
        private eventService: EventsService,
        private ngZone: NgZone,
        private errorService: ErrorService,
        private logger: Logger,
        private adalService: AdalService,
        private chatHubService: ChatHubService
    ) {
        this.loadingData = true;
        this.eventStatusCache = new SessionStorage(this.JUDGE_STATUS_KEY);
    }

    ngOnInit() {
        this.getConference().then(() => {
            this.setupEventHubSubscribers();
            this.setupConferenceChatSubscription();
        });
    }

    @HostListener('window:beforeunload')
    ngOnDestroy(): void {
        this.logger.debug('Clearing intervals and subscriptions for judge waiting room');
        this.chatHubSubscription.unsubscribe();
        this.eventHubSubscriptions.unsubscribe();
        this.apiSubscriptions.unsubscribe();
    }

    private setupConferenceChatSubscription() {
        this.logger.debug('Setting up VH Officer chat hub subscribers');
        this.chatHubService.start();

        this.chatHubSubscription.add(
            this.chatHubService.getChatMessage().subscribe(message => {
                this.logger.debug('message received');
                this.logger.debug(JSON.stringify(message));
            })
        );
    }

    sendMessage() {
        this.chatHubService.sendMessage(this.conference.id, `message from judge ${this.adalService.userInfo.userName}`);
    }

    async getConference() {
        const conferenceId = this.route.snapshot.paramMap.get('conferenceId');
        return this.videoWebService
            .getConferenceById(conferenceId)
            .toPromise()
            .then((data: ConferenceResponse) => {
                this.loadingData = false;
                this.conference = data;
                this.postEventJudgeAvailableStatus();
                this.hearing = new Hearing(data);
            })
            .catch(error => {
                this.loadingData = false;
                this.ngZone.run(() => {
                    if (!this.errorService.returnHomeIfUnauthorised(error)) {
                        this.errorService.handleApiError(error);
                    }
                });
            });
    }

    async postEventJudgeAvailableStatus() {
        const participant = this.conference.participants.find(
            x => x.username.toLocaleLowerCase() === this.adalService.userInfo.userName.toLocaleLowerCase()
        );

        // to reset status on the navigation back to judge hearing list we need to know conference and participant Ids.
        this.eventStatusCache.set(new EventStatusModel(this.conference.id, participant.id.toString()));

        const request = new UpdateParticipantStatusEventRequest({
            participant_id: participant.id.toString(),
            event_type: EventType.JudgeAvailable
        });
        try {
            this.videoWebService.raiseParticipantEvent(this.conference.id, request).toPromise();
        } catch (e) {
            if (e instanceof Error) {
                this.logger.error('Failed to raise judge available event', e);
            } else {
                throw e;
            }
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
        this.router.navigate([PageUrls.JudgeHearingRoom, this.conference.id]);
    }

    goToJudgeHearingList(): void {
        this.router.navigate([PageUrls.JudgeHearingList]);
    }

    setupEventHubSubscribers() {
        this.eventService.start();

        this.eventHubSubscriptions.add(
            this.eventService.getHearingStatusMessage().subscribe(message => {
                this.ngZone.run(() => {
                    this.handleHearingStatusChange(<ConferenceStatus>message.status);
                });
            })
        );

        this.eventHubSubscriptions.add(
            this.eventService.getParticipantStatusMessage().subscribe(message => {
                this.ngZone.run(() => {
                    this.handleParticipantStatusChange(message);
                });
            })
        );

        this.logger.debug('Subscribing to event hub disconnects');
        this.eventHubSubscriptions.add(
            this.eventService.getServiceDisconnected().subscribe(() => {
                this.ngZone.run(() => {
                    this.logger.info(`event hub disconnection for vh officer`);
                    this.getConference();
                });
            })
        );

        this.logger.debug('Subscribing to event hub reconnects');
        this.eventHubSubscriptions.add(
            this.eventService.getServiceReconnected().subscribe(() => {
                this.ngZone.run(() => {
                    this.logger.info(`event hub re-connected for vh officer`);
                    this.getConference();
                });
            })
        );
    }

    handleParticipantStatusChange(message: ParticipantStatusMessage): any {
        const participant = this.conference.participants.find(p => p.id === message.participantId);
        const status = <ParticipantStatus>message.status;
        participant.status = status;
    }

    handleHearingStatusChange(status: ConferenceStatus) {
        this.conference.status = status;
    }

    checkEquipment() {
        this.router.navigate([PageUrls.EquipmentCheck, this.conference.id]);
    }

    hearingSuspended(): boolean {
        return this.conference.status === ConferenceStatus.Suspended;
    }

    hearingPaused(): boolean {
        return this.conference.status === ConferenceStatus.Paused;
    }
}
