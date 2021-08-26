import { Component, OnInit, Output, EventEmitter, OnDestroy, Input } from '@angular/core';
import { UserMediaService } from 'src/app/services/user-media.service';
import { UserMediaDevice } from 'src/app/shared/models/user-media-device';
import { Logger } from 'src/app/services/logging/logger-base';
import { Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { MediaStreamService } from 'src/app/services/media-stream.service';
import { VideoFilterService } from 'src/app/services/video-filter.service';
import { ProfileService } from 'src/app/services/api/profile.service';
import { Role, UserProfileResponse } from 'src/app/services/clients/api-client';

@Component({
    selector: 'app-select-media-devices',
    templateUrl: './select-media-devices.component.html',
    styleUrls: ['./select-media-devices.component.scss']
})
export class SelectMediaDevicesComponent implements OnInit, OnDestroy {
    private readonly loggerPrefix = '[SelectMediaDevices] -';
    @Output() shouldClose = new EventEmitter();
    @Input() showAudioOnlySetting = false;

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

    constructor(
        private userMediaService: UserMediaService,
        private mediaStreamService: MediaStreamService,
        private logger: Logger,
        private translateService: TranslateService,
        private videoFilterService: VideoFilterService,
        private profileService: ProfileService
    ) {}

    ngOnInit() {
        this.userMediaService.connectedDevices$.pipe(takeUntil(this.destroyedSubject)).subscribe(connectedDevices => {
            this.availableCameraDevices = connectedDevices.filter(device => device.kind === 'videoinput');
            this.availableMicrophoneDevices = connectedDevices.filter(device => device.kind === 'audioinput');
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
    }

    determineFilterSelectionVisibility(profile: UserProfileResponse) {
        this.showBackgroundFilter = profile.role === Role.JudicialOfficeHolder || profile.role === Role.Judge;
    }

    onSelectedCameraDeviceChange() {
        this.updateStreamForSelectedCamera();
    }

    onSelectedMicrophoneDeviceChange() {
        this.updateStreamForSelectedMicrophone();
    }

    private updateSelectedCamera(camera: UserMediaDevice) {
        this.selectedCameraDevice = this.availableCameraDevices.find(device => device.deviceId === camera.deviceId);
        this.updateStreamForSelectedCamera();
    }

    private updateStreamForSelectedCamera() {
        this.mediaStreamService
            .getStreamForCam(this.selectedCameraDevice)
            .pipe(take(1))
            .subscribe(cameraStream => (this.selectedCameraStream = cameraStream));
    }

    private updateSelectedMicrophone(microphone: UserMediaDevice) {
        this.selectedMicrophoneDevice = this.availableMicrophoneDevices.find(device => device.deviceId === microphone.deviceId);
        this.updateStreamForSelectedMicrophone();
    }

    private updateStreamForSelectedMicrophone() {
        this.mediaStreamService
            .getStreamForMic(this.selectedMicrophoneDevice)
            .pipe(take(1))
            .subscribe(microphoneStream => (this.selectedMicrophoneStream = microphoneStream));
    }

    toggleSwitch() {
        this.connectWithCameraOn = !this.connectWithCameraOn;
        this.logger.debug(`${this.loggerPrefix} Toggle camera switch to ${this.connectWithCameraOn ? 'on' : 'off'}`);
    }

    transitionstart() {
        this.blockToggleClicks = true;
    }

    transitionEnd() {
        this.blockToggleClicks = false;
    }

    onClose() {
        this.userMediaService.updateActiveCamera(this.selectedCameraDevice);
        this.userMediaService.updateActiveMicrophone(this.selectedMicrophoneDevice);
        this.userMediaService.updateIsAudioOnly(!this.connectWithCameraOn);

        this.shouldClose.emit();
    }

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

    ngOnDestroy() {
        this.logger.debug(`${this.loggerPrefix} Closing select media device change`);

        this.destroyedSubject.next();
        this.destroyedSubject.complete();

        this.mediaStreamService.stopStream(this.selectedCameraStream);
        this.mediaStreamService.stopStream(this.selectedMicrophoneStream);
    }
}
