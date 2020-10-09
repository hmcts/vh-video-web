import { Component, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AdalService } from 'adal-angular4';
import { Subscription } from 'rxjs';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ConferenceStatus } from 'src/app/services/clients/api-client';
import { ClockService } from 'src/app/services/clock.service';
import { ErrorService } from 'src/app/services/error.service';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { DeviceTypeService } from '../../services/device-type.service';
import { HeartbeatModelMapper } from '../../shared/mappers/heartbeat-model-mapper';
import { VideoCallService } from '../services/video-call.service';
import { WaitingRoomBaseComponent } from '../waiting-room-shared/waiting-room-base.component';
import { SelectedUserMediaDevice } from '../../shared/models/selected-user-media-device';
import { UserMediaService } from 'src/app/services/user-media.service';
import { SelectMediaDevicesComponent } from '../../shared/select-media-devices/select-media-devices.component';

@Component({
    selector: 'app-participant-waiting-room',
    templateUrl: './participant-waiting-room.component.html',
    styleUrls: ['./participant-waiting-room.component.scss', '../waiting-room-global-styles.scss']
})
export class ParticipantWaitingRoomComponent extends WaitingRoomBaseComponent implements OnInit, OnDestroy {
    currentTime: Date;
    hearingStartingAnnounced: boolean;
    currentPlayCount: number;
    hearingAlertSound: HTMLAudioElement;

    clockSubscription$: Subscription;
    consultationAccepted$: Subscription;

    @ViewChild(SelectMediaDevicesComponent) selectMediaDevices: SelectMediaDevicesComponent; 

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
        private clockService: ClockService,
        private userMediaService: UserMediaService
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
            consultationService
        );
    }

    ngOnInit() {
        this.errorCount = 0;
        this.logger.debug('Loading participant waiting room');
        this.connected = false;

        this.showChooseDeviceDialog();
        this.initHearingAlert();
        this.getConference().then(() => {
            this.subscribeToAcceptConsultation();
            this.subscribeToClock();
            this.startEventHubSubscribers();
            this.getJwtokenAndConnectToPexip();
        });
    }

    showChooseDeviceDialog() {
        this.displayDeviceChangeModal = !this.userMediaService.getShowDialogChooseDevice();
        this.userMediaService.updateShowDialogChooseDevice(true);
    }

    @HostListener('window:beforeunload')
    ngOnDestroy(): void {
        clearTimeout(this.callbackTimeout);
        if (this.heartbeat) {
            this.heartbeat.kill();
        }
        this.disconnect();
        this.eventHubSubscription$.unsubscribe();
        this.videoCallSubscription$.unsubscribe();
        if (this.consultationAccepted$) {
            this.consultationAccepted$.unsubscribe();
        }
    }

    subscribeToAcceptConsultation() {
        this.consultationAccepted$ = this.consultationService.consultationAcceptedBy.subscribe(accepted => {
            if (accepted && this.displayDeviceChangeModal) {
                this.selectMediaDevices.onSubmit();
            }
        });
    }

    initHearingAlert() {
        this.hearingStartingAnnounced = false;
        this.currentPlayCount = 1;

        this.hearingAlertSound = new Audio();
        this.hearingAlertSound.src = '/assets/audio/hearing_starting_soon.mp3';
        this.hearingAlertSound.load();
        const self = this;
        this.hearingAlertSound.addEventListener(
            'ended',
            function () {
                self.currentPlayCount++;
                if (self.currentPlayCount <= 3) {
                    this.play();
                }
            },
            false
        );
    }

    subscribeToClock(): void {
        this.clockSubscription$ = this.clockService.getClock().subscribe(time => {
            this.currentTime = time;
            this.checkIfHearingIsClosed();
            this.checkIfHearingIsStarting();
        });
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

    announceHearingIsAboutToStart(): void {
        const self = this;
        this.hearingAlertSound.play().catch(function (reason) {
            self.logger.error('Failed to announce hearing starting', reason);
        });
        this.hearingStartingAnnounced = true;
    }

    getConferenceStatusText(): string {
        if (this.hearing.getConference().status === ConferenceStatus.NotStarted) {
            if (this.hearing.isStarting()) {
                return 'is about to begin';
            } else if (this.hearing.isDelayed()) {
                return 'is delayed';
            } else {
                return '';
            }
        } else if (this.hearing.isSuspended()) {
            return 'is suspended';
        } else if (this.hearing.isPaused()) {
            return 'is paused';
        } else if (this.hearing.isClosed()) {
            return 'is closed';
        }
        return 'is in session';
    }

    getCurrentTimeClass() {
        if (this.hearing.isOnTime() || this.hearing.isPaused() || this.hearing.isClosed()) {
            return 'hearing-on-time';
        }
        if (this.hearing.isStarting()) {
            return 'hearing-near-start';
        }
        if (this.hearing.isDelayed() || this.hearing.isSuspended()) {
            return 'hearing-delayed';
        }
    }

    showChooseCameraDialog() {
        this.displayDeviceChangeModal = true;
        this.videoCallService.getVideoSource();
    }

    onMediaDeviceChangeCancelled() {
        this.displayDeviceChangeModal = false;
    }

    onMediaDeviceChangeAccepted(selectedMediaDevice: SelectedUserMediaDevice) {
        this.logger.debug('EVENT  camera and mic *********************');
        const cam = selectedMediaDevice.selectedCamera;
        if (cam) {
            this.videoCallService.updateCameraForCall(cam);
        }

        const mic = selectedMediaDevice.selectedMicrophone;
        if (mic) {
            this.videoCallService.updateMicrophoneForCall(mic);
        }
        this.videoCallService.getVideoSource();

    }
  
}
