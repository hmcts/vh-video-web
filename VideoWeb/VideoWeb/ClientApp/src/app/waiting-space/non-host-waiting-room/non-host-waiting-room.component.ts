import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import { ConferenceStatus, ParticipantStatus, Role } from 'src/app/services/clients/api-client';
import { ClockService } from 'src/app/services/clock.service';
import { ErrorService } from 'src/app/services/error.service';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { DeviceTypeService } from '../../services/device-type.service';
import { HearingRole } from '../models/hearing-role-model';
import { NotificationToastrService } from '../services/notification-toastr.service';
import { RoomClosingToastrService } from '../services/room-closing-toast.service';
import { VideoCallService } from '../services/video-call.service';
import { WaitingRoomBaseDirective } from '../waiting-room-shared/waiting-room-base.component';
import { TranslateService } from '@ngx-translate/core';
import { ConsultationInvitationService } from '../services/consultation-invitation.service';
import { take, takeUntil } from 'rxjs/operators';
import { UnloadDetectorService } from 'src/app/services/unload-detector.service';
import { UserMediaService } from 'src/app/services/user-media.service';
import { ParticipantMediaStatus } from 'src/app/shared/models/participant-media-status';
import { ConferenceActions } from '../store/actions/conference.actions';
import { ModalTrapFocus } from '../../shared/modal/modal-trap-focus';
import { HideComponentsService } from '../services/hide-components.service';
import { FocusService } from 'src/app/services/focus.service';
import { ConferenceState } from '../store/reducers/conference.reducer';
import { Store } from '@ngrx/store';
import { VHParticipant } from '../store/models/vh-conference';
import { NonHostUserRole } from '../waiting-room-shared/models/non-host-user-role';
import { VideoCallEventsService } from '../services/video-call-events.service';

@Component({
    standalone: false,
    selector: 'app-non-host-waiting-room',
    templateUrl: './non-host-waiting-room.component.html',
    styleUrls: ['../waiting-room-global-styles.scss', './non-host-waiting-room.component.scss']
})
export class NonHostWaitingRoomComponent extends WaitingRoomBaseDirective implements OnInit, OnDestroy {
    @Input() userRole: NonHostUserRole;

    currentTime: Date;

    showJoinHearingWarning = false;
    displayLanguageModal: boolean;
    displayLeaveHearingPopup = false;

    private readonly componentLoggerPrefix = '[Non-Host Waiting Room] -';
    private destroyedSubject = new Subject();

    constructor(
        protected route: ActivatedRoute,
        protected eventService: EventsService,
        protected logger: Logger,
        protected errorService: ErrorService,
        protected videoCallService: VideoCallService,
        protected deviceTypeService: DeviceTypeService,
        protected router: Router,
        protected consultationService: ConsultationService,
        protected notificationToastrService: NotificationToastrService,
        protected roomClosingToastrService: RoomClosingToastrService,
        protected clockService: ClockService,
        protected translateService: TranslateService,
        protected consultationInvitiationService: ConsultationInvitationService,
        private unloadDetectorService: UnloadDetectorService,
        protected userMediaService: UserMediaService,
        protected hideComponentsService: HideComponentsService,
        protected focusService: FocusService,
        protected store: Store<ConferenceState>,
        protected videoCallEventsService: VideoCallEventsService
    ) {
        super(
            route,
            eventService,
            logger,
            errorService,
            videoCallService,
            deviceTypeService,
            router,
            consultationService,
            notificationToastrService,
            roomClosingToastrService,
            clockService,
            consultationInvitiationService,
            hideComponentsService,
            focusService,
            store,
            videoCallEventsService
        );
    }

    get allowAudioOnlyToggle(): boolean {
        if (this.isParticipant) {
            return true;
        }

        return (
            !!this.vhConference &&
            !!this.vhParticipant &&
            this.vhParticipant?.status !== ParticipantStatus.InConsultation &&
            this.vhParticipant?.status !== ParticipantStatus.InHearing
        );
    }

    get isObserver(): boolean {
        return this.vhParticipant?.hearingRole === HearingRole.OBSERVER;
    }

    get isQuickLinkObserver(): boolean {
        return this.vhParticipant?.role === Role.QuickLinkObserver;
    }

    get isQuickLinkUser(): boolean {
        return (
            this.vhParticipant?.hearingRole?.toUpperCase() === HearingRole.QUICK_LINK_OBSERVER.toUpperCase() ||
            this.vhParticipant?.hearingRole?.toUpperCase() === HearingRole.QUICK_LINK_PARTICIPANT.toUpperCase()
        );
    }

    get isVictim(): boolean {
        return this.vhParticipant?.hearingRole === HearingRole.VICTIM;
    }

    get isPolice(): boolean {
        return this.vhParticipant?.hearingRole === HearingRole.POLICE;
    }

    get canStartJoinConsultation() {
        return (
            !this.isOrHasWitnessLink() &&
            !this.isObserver &&
            this.vhParticipant?.hearingRole !== HearingRole.OBSERVER &&
            !this.isQuickLinkObserver &&
            !this.vhParticipant.linkedParticipants.length &&
            !this.isVictim &&
            !this.isPolice
        );
    }

    get isJoh(): boolean {
        return this.userRole === NonHostUserRole.Joh;
    }

    get isParticipant(): boolean {
        return this.userRole === NonHostUserRole.Participant;
    }

    ngOnInit() {
        this.setTitle();
        this.divTrapId = 'video-container';
        this.init();
    }

    ngOnDestroy(): void {
        this.cleanUp();
    }

    subscribeToClock(): void {
        this.clockService
            .getClock()
            .pipe(takeUntil(this.destroyedSubject))
            .subscribe(time => {
                this.currentTime = time;
                this.checkIfHearingIsClosed();
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

    checkIfHearingIsClosed(): void {
        if (this.hearing.isPastClosedTime()) {
            this.router.navigate([pageUrls.ParticipantHearingList]);
        }
    }

    getConferenceStatusText(): string {
        if (this.userRole === NonHostUserRole.Participant) {
            return this.getConferenceStatusTextForParticipant();
        }
        return this.getConferenceStatusTextForNonParticipant();
    }

    getConferenceStatusTextForNonParticipant(): string {
        if (this.hearing.getConference().status === ConferenceStatus.NotStarted) {
            return '';
        } else if (this.hearing.isSuspended()) {
            return this.translateService.instant('waiting-room.is-suspended');
        } else if (this.hearing.isPaused()) {
            return this.translateService.instant('waiting-room.is-paused');
        } else if (this.hearing.isClosed()) {
            return this.translateService.instant('waiting-room.is-closed');
        }
        return this.translateService.instant('waiting-room.is-in-session');
    }

    getConferenceStatusTextForParticipant(): string {
        if (this.hearing.getConference().status === ConferenceStatus.NotStarted) {
            if (this.hearing.isStarting()) {
                return this.translateService.instant('waiting-room.is-about-to-begin');
            } else if (this.hearing.isDelayed()) {
                return this.translateService.instant('waiting-room.is-delayed');
            } else {
                return '';
            }
        } else if (this.hearing.isSuspended()) {
            return this.translateService.instant('waiting-room.is-suspended');
        } else if (this.hearing.isPaused()) {
            return this.translateService.instant('waiting-room.is-paused');
        } else if (this.hearing.isClosed()) {
            return this.translateService.instant('waiting-room.is-closed');
        }
        return this.translateService.instant('waiting-room.is-in-session');
    }

    getRoomName(): string {
        return this.consultationService.consultationNameToString(this.vhParticipant?.room?.label, false);
    }

    openStartConsultationModal() {
        this.displayStartPrivateConsultationModal = true;
    }

    openJoinConsultationModal() {
        this.displayJoinPrivateConsultationModal = true;
    }

    showLanguageChangeModal() {
        this.displayLanguageModal = true;
    }

    closeLanguageChangeModal() {
        this.displayLanguageModal = false;
    }

    getPrivateConsultationParticipants(): VHParticipant[] {
        return this.vhConference.participants.filter(
            p =>
                p.id !== this.vhParticipant.id &&
                p.role !== Role.JudicialOfficeHolder &&
                p.role !== Role.Judge &&
                p.role !== Role.StaffMember &&
                p.hearingRole !== HearingRole.OBSERVER &&
                p.hearingRole !== HearingRole.WITNESS &&
                !p.protectedFrom?.includes(this.vhParticipant.externalReferenceId) &&
                !this.vhParticipant.protectedFrom?.includes(p.externalReferenceId)
        );
    }

    async startPrivateConsultation(participants: string[], endpoints: string[]) {
        this.logger.info(`${this.componentLoggerPrefix} attempting to start a private participant consultation`, {
            conference: this.vhConference?.id,
            participant: this.vhParticipant.id
        });
        this.hasTriedToLeaveConsultation = false;
        await this.consultationService.createParticipantConsultationRoom(
            this.vhConference.id,
            this.vhParticipant.id,
            participants,
            endpoints
        );
        this.closeStartPrivateConsultationModal();
        this.privateConsultationAccordianExpanded = false;
    }

    async joinPrivateConsultation(roomLabel: string) {
        this.logger.info(`${this.componentLoggerPrefix} attempting to join a private participant consultation`, {
            conference: this.vhConference?.id,
            participant: this.vhParticipant.id,
            roomLabel: roomLabel
        });
        this.hasTriedToLeaveConsultation = false;
        await this.consultationService.joinPrivateConsultationRoom(this.vhConference.id, this.vhParticipant.id, roomLabel);
        this.closeJoinPrivateConsultationModal();
        this.privateConsultationAccordianExpanded = false;
    }

    async setRoomLock(lock: boolean) {
        const roomLabel = this.vhParticipant.room?.label;
        if (!roomLabel) {
            return;
        }

        this.logger.info(`${this.componentLoggerPrefix} attempting to set room lock state`, {
            conference: this.vhConference?.id,
            participant: this.vhParticipant.id,
            roomLabel: roomLabel,
            lock: lock
        });
        await this.consultationService.lockConsultation(this.vhConference.id, roomLabel, lock);
    }

    closeStartPrivateConsultationModal() {
        this.displayStartPrivateConsultationModal = false;
    }

    closeJoinPrivateConsultationModal() {
        this.displayJoinPrivateConsultationModal = false;
    }

    toggleAccordian() {
        this.privateConsultationAccordianExpanded = !this.privateConsultationAccordianExpanded;
    }

    setTrapFocus() {
        ModalTrapFocus.trap('video-container');
    }

    dismissJoinHearingWarning() {
        this.showJoinHearingWarning = false;
        this.setUpSubscribers();
    }

    onLeaveHearingButtonClicked() {
        this.displayLeaveHearingPopup = true;
    }

    leave(confirmation: boolean) {
        this.displayLeaveHearingPopup = false;
        if (!confirmation) {
            return;
        }
        const feedbackUrl = 'https://www.smartsurvey.co.uk/s/VideoHearings_Feedback/';
        window.location.assign(feedbackUrl);
    }

    private onShouldReload(): void {
        window.location.reload();
    }

    private onShouldUnload(): void {
        this.cleanUp();
    }

    private init() {
        this.divTrapId = 'video-container';
        this.destroyedSubject = new Subject();

        this.unloadDetectorService.shouldUnload.pipe(takeUntil(this.destroyedSubject)).subscribe(() => this.onShouldUnload());
        this.unloadDetectorService.shouldReload.pipe(take(1)).subscribe(() => this.onShouldReload());

        this.errorCount = 0;
        this.logger.debug(`${this.componentLoggerPrefix} loading waiting room`);
        this.connected = false;
        this.getConference();
        if (this.deviceTypeService.isHandheldIOSDevice()) {
            this.showJoinHearingWarning = true;
        } else {
            this.setUpSubscribers();
        }
    }

    private setUpSubscribers() {
        this.subscribeToClock();
        this.startEventHubSubscribers();
        this.connectToPexip();
        this.registerMediaStatusPublisher();
        this.startVideoCallEventSubscribers();
    }

    private registerMediaStatusPublisher() {
        this.userMediaService.isAudioOnly$.pipe(takeUntil(this.destroyedSubject)).subscribe(async audioOnly => {
            this.audioOnly = audioOnly;

            const mediaStatus = new ParticipantMediaStatus(false, audioOnly);
            await this.eventService.sendMediaStatus(this.conferenceId, this.vhParticipant.id, mediaStatus);
        });
    }

    private setTitle() {
        this.store.dispatch(ConferenceActions.enterWaitingRoomAsNonHost({ userRole: this.userRole }));
    }

    private cleanUp() {
        this.logger.debug(`${this.componentLoggerPrefix} clearing intervals and subscriptions`, {
            conference: this.vhConference?.id
        });

        this.executeWaitingRoomCleanup();

        this.destroyedSubject.next();
        this.destroyedSubject.complete();
        this.stopVideoCallEventSubscribers();
    }

    private startVideoCallEventSubscribers() {
        this.subscriptions.push(
            this.videoCallEventsService.onVideoWrapperReady().subscribe(() => this.setTrapFocus()),
            this.videoCallEventsService.onLeaveConsultation().subscribe(() => this.showLeaveConsultationModal()),
            this.videoCallEventsService.onLockConsultationToggled().subscribe(lock => this.setRoomLock(lock)),
            this.videoCallEventsService.onChangeDevice().subscribe(() => this.showChooseCameraDialog()),
            this.videoCallEventsService.onChangeLanguageSelected().subscribe(count => this.showLanguageChangeModal())
        );
    }

    private stopVideoCallEventSubscribers() {
        this.subscriptions.forEach(sub => sub.unsubscribe());
    }
}
