import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ProfileService } from 'src/app/services/api/profile.service';
import { Role, UserProfileResponse } from 'src/app/services/clients/api-client';
import { Logger } from 'src/app/services/logging/logger-base';
import { UserMediaService } from 'src/app/services/user-media.service';
import { VideoFilterService } from 'src/app/services/video-filter.service';
import { UserMediaDevice } from 'src/app/shared/models/user-media-device';
import { ModalTrapFocus } from '../modal/modal-trap-focus';
import { FocusService } from 'src/app/services/focus.service';
import { UserMediaStreamServiceV2 } from 'src/app/services/user-media-stream-v2.service';

@Component({
    standalone: false,
    selector: 'app-select-media-devices',
    templateUrl: './select-media-devices.component.html',
    styleUrls: ['./select-media-devices.component.scss']
})
export class SelectMediaDevicesComponent implements OnInit, OnDestroy, AfterViewInit {
    @Output() shouldClose = new EventEmitter();

    @Input() showAudioOnlySetting = false;

    @ViewChild('availableMicsListRef') availableMicsList: ElementRef<HTMLDivElement>;

    availableCameraDevices: UserMediaDevice[] = [];
    availableMicrophoneDevices: UserMediaDevice[] = [];
    selectedCameraDevice: UserMediaDevice;
    selectedCameraStream: MediaStream;
    selectedMicrophoneDevice: UserMediaDevice;
    selectedMicrophoneStream: MediaStream;
    connectWithCameraOn: boolean;
    blockToggleClicks: boolean;
    showBackgroundFilter: boolean;

    private destroyedSubject = new Subject<any>();
    private readonly loggerPrefix = '[SelectMediaDevices] -';
    private readonly SELECT_MEDIA_DEVICES_MODAL = 'select-device-modal';

    constructor(
        private userMediaService: UserMediaService,
        private userMediaStreamService: UserMediaStreamServiceV2,
        private logger: Logger,
        private translateService: TranslateService,
        private profileService: ProfileService,
        private videoFilterService: VideoFilterService,
        private focusService: FocusService
    ) {}

    get audioOnlyToggleText(): string {
        const result: string = this.connectWithCameraOn
            ? this.translateService.instant('select-media-devices.on')
            : this.translateService.instant('select-media-devices.off');
        return result.toUpperCase();
    }

    get hasOnlyOneAvailableCameraDevice(): boolean {
        return this.availableCameraDevices.length === 1;
    }

    get hasOnlyOneAvailableMicrophoneDevice(): boolean {
        return this.availableMicrophoneDevices.length === 1;
    }

    ngAfterViewInit() {
        ModalTrapFocus.trap(this.SELECT_MEDIA_DEVICES_MODAL);
        this.availableMicsList?.nativeElement.focus();
    }

    ngOnInit() {
        this.userMediaService.connectedVideoDevices$.pipe(takeUntil(this.destroyedSubject)).subscribe(cameraDevices => {
            this.availableCameraDevices = cameraDevices;
            this.selectedCameraDevice = this.availableCameraDevices.find(camera => this.selectedCameraDevice?.deviceId === camera.deviceId);
        });

        this.userMediaService.connectedMicrophoneDevices$.pipe(takeUntil(this.destroyedSubject)).subscribe(microphoneDevices => {
            this.availableMicrophoneDevices = microphoneDevices;
            this.selectedMicrophoneDevice = this.availableMicrophoneDevices.find(
                microphone => this.selectedMicrophoneDevice?.deviceId === microphone.deviceId
            );
        });

        this.userMediaStreamService.currentStream$.pipe(takeUntil(this.destroyedSubject)).subscribe(stream => {
            if (!stream) {
                this.selectedCameraStream = null;
                this.selectedMicrophoneStream = null;
                return;
            }
            // Extract audio tracks and create a new MediaStream for the microphone
            const audioTracks = stream.getAudioTracks();
            this.selectedMicrophoneStream = new MediaStream(audioTracks);

            // Extract video tracks and create a new MediaStream for the video
            const videoTracks = stream.getVideoTracks();
            this.selectedCameraStream = new MediaStream(videoTracks);
        });

        this.profileService.getUserProfile().then(profile => {
            this.determineFilterSelectionVisibility(profile);
        });

        this.userMediaService.isAudioOnly$.pipe(takeUntil(this.destroyedSubject)).subscribe(isAudioOnly => {
            this.connectWithCameraOn = !isAudioOnly;
        });

        this.userMediaService.activeVideoDevice$.pipe(takeUntil(this.destroyedSubject)).subscribe(cameraDevice => {
            this.updateSelectedCamera(cameraDevice);
        });

        this.userMediaService.activeMicrophoneDevice$.pipe(takeUntil(this.destroyedSubject)).subscribe(microphoneDevice => {
            this.updateSelectedMicrophone(microphoneDevice);
        });

        this.videoFilterService.onFilterChanged$.pipe(takeUntil(this.destroyedSubject)).subscribe(() => {
            this.updateSelectedCamera(this.selectedCameraDevice);
        });
    }

    determineFilterSelectionVisibility(profile: UserProfileResponse) {
        const isCorrectRole = profile.roles.includes(Role.JudicialOfficeHolder) || profile.roles.includes(Role.Judge);
        this.showBackgroundFilter = isCorrectRole && this.videoFilterService.isFeatureEnabled();
    }

    onSelectedCameraDeviceChange() {
        this.userMediaService.updateActiveCamera(this.selectedCameraDevice);
    }

    onSelectedMicrophoneDeviceChange() {
        this.userMediaService.updateActiveMicrophone(this.selectedMicrophoneDevice);
    }

    toggleSwitch() {
        this.connectWithCameraOn = !this.connectWithCameraOn;
        this.logger.debug(`${this.loggerPrefix} Toggled camera switch to ${this.connectWithCameraOn ? 'on' : 'off'}`);
        this.userMediaService.updateIsAudioOnly(!this.connectWithCameraOn);
    }

    transitionstart() {
        this.blockToggleClicks = true;
    }

    transitionEnd() {
        this.blockToggleClicks = false;
    }

    onClose() {
        this.focusService.restoreFocus();
        this.shouldClose.emit();
    }

    ngOnDestroy() {
        this.logger.debug(`${this.loggerPrefix} Closing select media device change`);

        this.destroyedSubject.next();
        this.destroyedSubject.complete();
    }

    private updateSelectedCamera(camera: UserMediaDevice) {
        this.selectedCameraDevice = this.availableCameraDevices.find(device => device.deviceId === camera.deviceId);
    }

    private updateSelectedMicrophone(microphone: UserMediaDevice) {
        this.selectedMicrophoneDevice = this.availableMicrophoneDevices.find(device => device.deviceId === microphone.deviceId);
    }
}
