import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ConferenceStatus, ParticipantStatus } from 'src/app/services/clients/api-client';
import { ClockService } from 'src/app/services/clock.service';
import { DeviceTypeService } from 'src/app/services/device-type.service';
import { ErrorService } from 'src/app/services/error.service';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { UnloadDetectorService } from 'src/app/services/unload-detector.service';
import { ConsultationInvitationService } from '../services/consultation-invitation.service';
import { NotificationSoundsService } from '../services/notification-sounds.service';
import { NotificationToastrService } from '../services/notification-toastr.service';
import { RoomClosingToastrService } from '../services/room-closing-toast.service';
import { VideoCallService } from '../services/video-call.service';
import { WaitingRoomBaseDirective } from '../waiting-room-shared/waiting-room-base.component';
import { Title } from '@angular/platform-browser';
import { ModalTrapFocus } from '../../shared/modal/modal-trap-focus';
import { HideComponentsService } from '../services/hide-components.service';
import { FocusService } from 'src/app/services/focus.service';
import { Store } from '@ngrx/store';
import { ConferenceState } from '../store/reducers/conference.reducer';
import { LaunchDarklyService } from 'src/app/services/launch-darkly.service';

@Component({
    standalone: false,
    selector: 'app-joh-waiting-room',
    templateUrl: './joh-waiting-room.component.html',
    styleUrls: ['../waiting-room-global-styles.scss', './joh-waiting-room.component.scss']
})
export class JohWaitingRoomComponent extends WaitingRoomBaseDirective implements OnInit, OnDestroy {
    isParticipantsPanelHidden = false;
    showWarning = false;

    private readonly loggerPrefixJOH = '[JOH WR] -';
    private destroyedSubject = new Subject();
    private title = 'JOH waiting room';
    private readonly MODAL_WINDOW = 'video-hearing-container';

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
            titleService,
            hideComponentsService,
            focusService,
            launchDarklyService,
            store
        );
    }

    get allowAudioOnlyToggle(): boolean {
        return (
            this.vhParticipant &&
            this.vhParticipant.status !== ParticipantStatus.InConsultation &&
            this.vhParticipant.status !== ParticipantStatus.InHearing
        );
    }

    ngOnInit(): void {
        this.titleService.setTitle(this.title);
        this.init();
    }

    getConferenceStatusText(): string {
        if (this.hearing.getConference().status === ConferenceStatus.NotStarted) {
            return '';
        } else if (this.hearing.isSuspended()) {
            return this.translateService.instant('joh-waiting-room.is-suspended');
        } else if (this.hearing.isPaused()) {
            return this.translateService.instant('joh-waiting-room.is-paused');
        } else if (this.hearing.isClosed()) {
            return this.translateService.instant('joh-waiting-room.is-closed');
        }
        return this.translateService.instant('joh-waiting-room.is-in-session');
    }

    getCurrentTimeClass() {
        if (this.hearing.isSuspended()) {
            return 'hearing-delayed';
        }
        return 'hearing-on-time';
    }

    ngOnDestroy(): void {
        this.cleanUp();
    }

    setTrapFocus() {
        ModalTrapFocus.trap(this.MODAL_WINDOW);
    }

    dismissWarning() {
        this.showWarning = false;
        this.setUpSubscribers();
    }

    private onShouldReload(): void {
        window.location.reload();
    }

    private onShouldUnload(): void {
        this.cleanUp();
    }

    private init() {
        this.destroyedSubject = new Subject();

        this.audioOnly = false;
        this.errorCount = 0;
        this.logger.debug(`${this.loggerPrefixJOH} Loading JOH waiting room`);
        this.connected = false;
        this.loggedInUser = this.route.snapshot.data['loggedUser'];

        this.unloadDetectorService.shouldUnload.pipe(takeUntil(this.destroyedSubject)).subscribe(() => this.onShouldUnload());
        this.unloadDetectorService.shouldReload.pipe(take(1)).subscribe(() => this.onShouldReload());

        this.notificationSoundsService.initHearingAlertSound();
        this.getConference();

        if (this.deviceTypeService.isIphone() || this.deviceTypeService.isIpad()) {
            this.showWarning = true;
        } else {
            this.setUpSubscribers();
        }
    }

    private setUpSubscribers() {
        this.subscribeToClock();
        this.startEventHubSubscribers();
        this.connectToPexip();
    }

    private cleanUp() {
        this.logger.debug(`${this.loggerPrefixJOH} Clearing intervals and subscriptions for JOH waiting room`, {
            conference: this.vhConference?.id
        });

        this.executeWaitingRoomCleanup();

        this.destroyedSubject.next();
        this.destroyedSubject.complete();
    }
}
