import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AdalService } from 'adal-angular4';
import { Subscription } from 'rxjs';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ConferenceStatus, ParticipantResponse, Role } from 'src/app/services/clients/api-client';
import { ClockService } from 'src/app/services/clock.service';
import { ErrorService } from 'src/app/services/error.service';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { UserMediaStreamService } from 'src/app/services/user-media-stream.service';
import { UserMediaService } from 'src/app/services/user-media.service';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { DeviceTypeService } from '../../services/device-type.service';
import { HeartbeatModelMapper } from '../../shared/mappers/heartbeat-model-mapper';
import { HearingRole } from '../models/hearing-role-model';
import { NotificationSoundsService } from '../services/notification-sounds.service';
import { ConferenceStatusMessage } from 'src/app/services/models/conference-status-message';
import { NotificationToastrService } from '../services/notification-toastr.service';
import { RoomClosingToastrService } from '../services/room-closing-toast.service';
import { VideoCallService } from '../services/video-call.service';
import { WaitingRoomBaseDirective } from '../waiting-room-shared/waiting-room-base.component';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-participant-waiting-room',
    templateUrl: './participant-waiting-room.component.html',
    styleUrls: ['../waiting-room-global-styles.scss', './participant-waiting-room.component.scss']
})
export class ParticipantWaitingRoomComponent extends WaitingRoomBaseDirective implements OnInit, OnDestroy {
    currentTime: Date;
    hearingStartingAnnounced: boolean;

    clockSubscription$: Subscription;

    constructor(
        protected route: ActivatedRoute,
        protected videoWebService: VideoWebService,
        protected eventService: EventsService,
        protected adalService: AdalService,
        protected logger: Logger,
        protected errorService: ErrorService,
        protected heartbeatMapper: HeartbeatModelMapper,
        protected videoCallService: VideoCallService,
        protected deviceTypeService: DeviceTypeService,
        protected router: Router,
        protected consultationService: ConsultationService,
        protected userMediaService: UserMediaService,
        protected userMediaStreamService: UserMediaStreamService,
        protected notificationSoundsService: NotificationSoundsService,
        protected notificationToastrService: NotificationToastrService,
        protected roomClosingToastrService: RoomClosingToastrService,
        protected clockService: ClockService,
        protected translateService: TranslateService
    ) {
        super(
            route,
            videoWebService,
            eventService,
            adalService,
            logger,
            errorService,
            heartbeatMapper,
            videoCallService,
            deviceTypeService,
            router,
            consultationService,
            userMediaService,
            userMediaStreamService,
            notificationSoundsService,
            notificationToastrService,
            roomClosingToastrService,
            clockService
        );
    }

    ngOnInit() {
        this.audioOnly = this.videoCallService.retrieveVideoCallPreferences().audioOnly;
        this.errorCount = 0;
        this.logger.debug('[Participant WR] - Loading participant waiting room');
        this.connected = false;
        this.notificationSoundsService.initHearingAlertSound();
        this.loggedInUser = this.route.snapshot.data['loggedUser'];
        this.getConference().then(() => {
            this.subscribeToClock();
            this.startEventHubSubscribers();
            this.participant = this.conference.participants.find(x => x.id === this.loggedInUser.participant_id);
            this.getJwtokenAndConnectToPexip();
        });
    }

    @HostListener('window:beforeunload')
    ngOnDestroy(): void {
        this.logger.debug('[Participant WR] - Clearing intervals and subscriptions for participant waiting room', {
            conference: this.conference?.id
        });
        this.executeWaitingRoomCleanup();
    }

    subscribeToClock(): void {
        this.clockSubscription$ = this.clockService.getClock().subscribe(time => {
            this.currentTime = time;
            this.checkIfHearingIsClosed();
            this.checkIfHearingIsStarting();
            this.showRoomClosingToast(time);
        });
    }

    showRoomClosingToast(dateNow: Date) {
        if (this.isPrivateConsultation) {
            this.roomClosingToastrService.showRoomClosingAlert(this.hearing, dateNow);
        } else {
            this.roomClosingToastrService.clearToasts();
        }
    }

    checkIfHearingIsStarting(): void {
        if (this.hearing.isStarting() && !this.hearingStartingAnnounced) {
            this.announceHearingIsAboutToStart();
        }
    }

    checkIfHearingIsClosed(): void {
        if (this.hearing.isPastClosedTime()) {
            this.clockSubscription$.unsubscribe();
            this.router.navigate([pageUrls.ParticipantHearingList]);
        }
    }

    async announceHearingIsAboutToStart(): Promise<void> {
        await this.notificationSoundsService.playHearingAlertSound();
        this.hearingStartingAnnounced = true;
    }

    getConferenceStatusText(): string {
        if (this.hearing.getConference().status === ConferenceStatus.NotStarted) {
            if (this.hearing.isStarting()) {
                return this.translateService.instant('participant-waiting-room.is-about-to-begin');
            } else if (this.hearing.isDelayed()) {
                return this.translateService.instant('participant-waiting-room.is-delayed');
            } else {
                return '';
            }
        } else if (this.hearing.isSuspended()) {
            return this.translateService.instant('participant-waiting-room.is-suspended');
        } else if (this.hearing.isPaused()) {
            return this.translateService.instant('participant-waiting-room.is-paused');
        } else if (this.hearing.isClosed()) {
            return this.translateService.instant('participant-waiting-room.is-closed');
        }
        return this.translateService.instant('participant-waiting-room.is-in-session');
    }

    getCurrentTimeClass() {
        if (!this.isWitness && (this.hearing.isOnTime() || this.hearing.isPaused() || this.hearing.isClosed())) {
            return 'hearing-on-time';
        }
        if (!this.isWitness && (this.hearing.isStarting() || this.hearing.isInSession())) {
            return 'hearing-near-start';
        }
        if (!this.isWitness && this.hearing.isDelayed()) {
            return 'hearing-delayed';
        }
        if (this.hearing.isSuspended()) {
            return 'hearing-delayed';
        }
        if (this.isWitness && this.hearing.isInSession()) {
            return 'hearing-near-start';
        } else {
            return 'hearing-on-time';
        }
    }

    getRoomName(): string {
        return this.camelToSpaced(
            this.participant?.current_room?.label?.replace('ParticipantConsultationRoom', 'MeetingRoom') ?? 'MeetingRoom'
        );
    }

    get isJohRoom(): boolean {
        return this.participant?.current_room?.label.startsWith('JudgeJOH');
    }

    get isWitness(): boolean {
        return this.isOrHasWitnessLink();
    }

    get isObserver(): boolean {
        return this.participant?.hearing_role === HearingRole.OBSERVER;
    }

    handleConferenceStatusChange(message: ConferenceStatusMessage) {
        super.handleConferenceStatusChange(message);
        if (!this.validateIsForConference(message.conferenceId)) {
            return;
        }
        if (message.status === ConferenceStatus.InSession && !this.isWitness) {
            this.notificationSoundsService.playHearingAlertSound();
        } else {
            this.notificationSoundsService.stopHearingAlertSound();
        }
        if (message.status === ConferenceStatus.InSession && this.isWitness) {
            this.consultationService.leaveConsultation(this.conference, this.participant).then(() => {
                this.logger.info(`[ParticipantWaitingRoomComponent] - moving witness to waiting room for hearing start`, {
                    conference: this.conference?.id,
                    participant: this.participant.id
                });
            });
        }
    }

    openStartConsultationModal() {
        this.displayStartPrivateConsultationModal = true;
    }

    openJoinConsultationModal() {
        this.displayJoinPrivateConsultationModal = true;
    }

    getPrivateConsultationParticipants(): ParticipantResponse[] {
        return this.conference.participants.filter(
            p =>
                p.id !== this.participant.id &&
                p.role !== Role.JudicialOfficeHolder &&
                p.role !== Role.Judge &&
                p.hearing_role !== HearingRole.OBSERVER &&
                p.hearing_role !== HearingRole.WITNESS
        );
    }

    get canStartJoinConsultation() {
        return !this.isWitness && !this.isObserver;
    }

    async startPrivateConsultation(participants: string[], endpoints: string[]) {
        this.logger.info(`[ParticipantWaitingRoomComponent] - attempting to start a private participant consultation`, {
            conference: this.conference?.id,
            participant: this.participant.id
        });
        await this.consultationService.createParticipantConsultationRoom(this.conference, this.participant, participants, endpoints);
        this.closeStartPrivateConsultationModal();
        this.privateConsultationAccordianExpanded = false;
    }

    async joinPrivateConsultation(roomLabel: string) {
        this.logger.info(`[ParticipantWaitingRoomComponent] - attempting to join a private participant consultation`, {
            conference: this.conference?.id,
            participant: this.participant.id,
            roomLabel: roomLabel
        });
        await this.consultationService.joinPrivateConsultationRoom(this.conference.id, this.participant.id, roomLabel);
        this.closeJoinPrivateConsultationModal();
        this.privateConsultationAccordianExpanded = false;
    }

    async setRoomLock(lock: boolean) {
        const roomLabel = this.participant.current_room?.label;
        if (!roomLabel) {
            return;
        }

        this.logger.info(`[ParticipantWaitingRoomComponent] - attempting to set room lock state`, {
            conference: this.conference?.id,
            participant: this.participant.id,
            roomLabel: roomLabel,
            lock: lock
        });
        await this.consultationService.lockConsultation(this.conference.id, roomLabel, lock);
    }

    closeStartPrivateConsultationModal() {
        this.displayStartPrivateConsultationModal = false;
    }

    closeJoinPrivateConsultationModal() {
        this.displayJoinPrivateConsultationModal = false;
    }

    protected camelToSpaced(word: string) {
        const splitWord = word
            .match(/[a-z]+|[^a-z]+/gi)
            .join(' ')
            .split(/(?=[A-Z])/)
            .join(' ');
        const lowcaseWord = splitWord.toLowerCase();
        return lowcaseWord.charAt(0).toUpperCase() + lowcaseWord.slice(1);
    }

    toggleAccordian() {
        this.privateConsultationAccordianExpanded = !this.privateConsultationAccordianExpanded;
    }
}
