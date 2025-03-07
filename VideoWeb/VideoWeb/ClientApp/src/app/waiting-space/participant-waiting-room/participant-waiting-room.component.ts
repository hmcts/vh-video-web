import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ConferenceStatus, ParticipantStatus, Role } from 'src/app/services/clients/api-client';
import { ClockService } from 'src/app/services/clock.service';
import { ErrorService } from 'src/app/services/error.service';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { DeviceTypeService } from '../../services/device-type.service';
import { HearingRole } from '../models/hearing-role-model';
import { NotificationSoundsService } from '../services/notification-sounds.service';
import { NotificationToastrService } from '../services/notification-toastr.service';
import { RoomClosingToastrService } from '../services/room-closing-toast.service';
import { VideoCallService } from '../services/video-call.service';
import { WaitingRoomBaseDirective } from '../waiting-room-shared/waiting-room-base.component';
import { TranslateService } from '@ngx-translate/core';
import { ConsultationInvitationService } from '../services/consultation-invitation.service';
import { take, takeUntil } from 'rxjs/operators';
import { UnloadDetectorService } from 'src/app/services/unload-detector.service';
import { ParticipantRemoteMuteStoreService } from '../services/participant-remote-mute-store.service';
import { UserMediaService } from 'src/app/services/user-media.service';
import { ParticipantMediaStatus } from 'src/app/shared/models/participant-media-status';
import { Title } from '@angular/platform-browser';
import { ModalTrapFocus } from '../../shared/modal/modal-trap-focus';
import { HideComponentsService } from '../services/hide-components.service';
import { FocusService } from 'src/app/services/focus.service';
import { ConferenceState } from '../store/reducers/conference.reducer';
import { Store } from '@ngrx/store';
import { LaunchDarklyService } from 'src/app/services/launch-darkly.service';
import { VHParticipant } from '../store/models/vh-conference';

@Component({
    standalone: false,
    selector: 'app-participant-waiting-room',
    templateUrl: './participant-waiting-room.component.html',
    styleUrls: ['../waiting-room-global-styles.scss', './participant-waiting-room.component.scss']
})
export class ParticipantWaitingRoomComponent extends WaitingRoomBaseDirective implements OnInit, OnDestroy {
    currentTime: Date;
    hearingStartingAnnounced: boolean;

    isParticipantsPanelHidden = false;
    hearingVenueIsScottish$: Observable<boolean>;

    emptyString = ''; // Web:S6850 - Empty string is used to clear the value of the input field
    showWarning = false;
    displayLanguageModal: boolean;
    displayLeaveHearingPopup = false;

    private readonly loggerPrefixParticipant = '[Participant WR] -';
    private destroyedSubject = new Subject();
    private title = 'Participant waiting room';

    constructor(
        protected route: ActivatedRoute,
        protected videoWebService: VideoWebService,
        protected eventService: EventsService,
        protected logger: Logger,
        protected errorService: ErrorService,
        protected videoCallService: VideoCallService,
        protected deviceTypeService: DeviceTypeService,
        protected router: Router,
        protected consultationService: ConsultationService,
        protected notificationSoundsService: NotificationSoundsService,
        protected notificationToastrService: NotificationToastrService,
        protected roomClosingToastrService: RoomClosingToastrService,
        protected clockService: ClockService,
        protected translateService: TranslateService,
        protected consultationInvitiationService: ConsultationInvitationService,
        private unloadDetectorService: UnloadDetectorService,
        protected participantRemoteMuteStoreService: ParticipantRemoteMuteStoreService,
        protected userMediaService: UserMediaService,
        protected titleService: Title,
        protected hideComponentsService: HideComponentsService,
        protected focusService: FocusService,
        protected launchDarklyService: LaunchDarklyService,
        protected store: Store<ConferenceState>
    ) {
        super(
            route,
            videoWebService,
            eventService,
            logger,
            errorService,
            videoCallService,
            deviceTypeService,
            router,
            consultationService,
            notificationSoundsService,
            notificationToastrService,
            roomClosingToastrService,
            clockService,
            consultationInvitiationService,
            participantRemoteMuteStoreService,
            titleService,
            hideComponentsService,
            focusService,
            launchDarklyService,
            store
        );
    }

    get allowAudioOnlyToggle(): boolean {
        return (
            !!this.vhConference &&
            !!this.vhParticipant &&
            this.vhParticipant?.status !== ParticipantStatus.InConsultation &&
            this.vhParticipant?.status !== ParticipantStatus.InHearing
        );
    }

    get isJohRoom(): boolean {
        return this.vhParticipant?.room?.label.startsWith('JudgeJOH');
    }

    get isObserver(): boolean {
        return this.vhParticipant?.hearingRole === HearingRole.OBSERVER;
    }

    get isQuickLinkObserver(): boolean {
        return this.vhParticipant?.role === Role.QuickLinkObserver;
    }

    get isQuickLinkUser(): boolean {
        return this.vhParticipant?.hearingRole === Role.QuickLinkObserver || this.vhParticipant?.hearingRole === Role.QuickLinkParticipant;
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

    ngOnInit() {
        this.titleService.setTitle(this.title);
        this.divTrapId = 'video-container';
        this.init();
    }

    toggleParticipantsPanel() {
        this.isParticipantsPanelHidden = !this.isParticipantsPanelHidden;
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
        if (!this.isOrHasWitnessLink() && (this.hearing.isOnTime() || this.hearing.isPaused() || this.hearing.isClosed())) {
            return 'hearing-on-time';
        }
        if (!this.isOrHasWitnessLink() && (this.hearing.isStarting() || this.hearing.isInSession())) {
            return 'hearing-near-start';
        }
        if (!this.isOrHasWitnessLink() && this.hearing.isDelayed()) {
            return 'hearing-delayed';
        }
        if (this.hearing.isSuspended()) {
            return 'hearing-delayed';
        }
        if (this.isOrHasWitnessLink() && this.hearing.isInSession()) {
            return 'hearing-near-start';
        } else {
            return 'hearing-on-time';
        }
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

    closeLanageChangeModal() {
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
        this.logger.info('[ParticipantWaitingRoomComponent] - attempting to start a private participant consultation', {
            conference: this.conference?.id,
            participant: this.vhParticipant.id
        });
        this.hasTriedToLeaveConsultation = false;
        await this.consultationService.createParticipantConsultationRoom(this.conference, this.participant, participants, endpoints);
        this.closeStartPrivateConsultationModal();
        this.privateConsultationAccordianExpanded = false;
    }

    async joinPrivateConsultation(roomLabel: string) {
        this.logger.info('[ParticipantWaitingRoomComponent] - attempting to join a private participant consultation', {
            conference: this.conference?.id,
            participant: this.vhParticipant.id,
            roomLabel: roomLabel
        });
        this.hasTriedToLeaveConsultation = false;
        await this.consultationService.joinPrivateConsultationRoom(this.conference.id, this.vhParticipant.id, roomLabel);
        this.closeJoinPrivateConsultationModal();
        this.privateConsultationAccordianExpanded = false;
    }

    async setRoomLock(lock: boolean) {
        const roomLabel = this.vhParticipant.room?.label;
        if (!roomLabel) {
            return;
        }

        this.logger.info('[ParticipantWaitingRoomComponent] - attempting to set room lock state', {
            conference: this.conference?.id,
            participant: this.vhParticipant.id,
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

    toggleAccordian() {
        this.privateConsultationAccordianExpanded = !this.privateConsultationAccordianExpanded;
    }

    setTrapFocus() {
        ModalTrapFocus.trap('video-container');
    }

    dismissWarning() {
        this.showWarning = false;
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
        this.logger.debug('[Participant WR] - Loading participant waiting room');
        this.connected = false;
        this.notificationSoundsService.initHearingAlertSound();
        this.loggedInUser = this.route.snapshot.data['loggedUser'];
        this.getConference().then(() => {
            if (this.deviceTypeService.isIphone() || this.deviceTypeService.isIpad()) {
                this.showWarning = true;
            } else {
                this.setUpSubscribers();
            }
        });
    }

    private setUpSubscribers() {
        this.subscribeToClock();
        this.startEventHubSubscribers();
        this.connectToPexip();
        this.registerMediaStatusPublisher();
    }

    private registerMediaStatusPublisher() {
        this.userMediaService.isAudioOnly$.pipe(takeUntil(this.destroyedSubject)).subscribe(async audioOnly => {
            this.audioOnly = audioOnly;

            const mediaStatus = new ParticipantMediaStatus(false, audioOnly);
            await this.eventService.sendMediaStatus(this.conferenceId, this.vhParticipant.id, mediaStatus);
        });
    }

    private cleanUp() {
        this.logger.debug(`${this.loggerPrefixParticipant} Clearing intervals and subscriptions for JOH waiting room`, {
            conference: this.conference?.id
        });

        this.executeWaitingRoomCleanup();

        this.destroyedSubject.next();
        this.destroyedSubject.complete();
    }
}
