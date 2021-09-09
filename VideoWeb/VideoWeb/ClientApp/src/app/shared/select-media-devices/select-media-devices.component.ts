import { Component, OnInit, Output, EventEmitter, OnDestroy, Input } from '@angular/core';
import { UserMediaService } from 'src/app/services/user-media.service';
import { UserMediaDevice } from 'src/app/shared/models/user-media-device';
import { Logger } from 'src/app/services/logging/logger-base';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { VideoCallService } from 'src/app/waiting-space/services/video-call.service';

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

    private destroyedSubject = new Subject<any>();

    constructor(
        private userMediaService: UserMediaService,
        private videoCallService: VideoCallService,
        private logger: Logger,
        private translateService: TranslateService
    ) {}

    ngOnInit() {
        this.userMediaService.connectedDevices$.pipe(takeUntil(this.destroyedSubject)).subscribe(connectedDevices => {
            this.availableCameraDevices = connectedDevices.filter(device => device.kind === 'videoinput');
            this.availableMicrophoneDevices = connectedDevices.filter(device => device.kind === 'audioinput');
        });

        this.videoCallService.onCallSetup().subscribe(callSetup => {
            const activeStream = callSetup.stream as MediaStream;
            const cameraTrack = activeStream.getVideoTracks().find(x => x.label === this.selectedCameraDevice.label);
            const microphoneTrack = activeStream.getAudioTracks().find(x => x.label === this.selectedMicrophoneDevice.label);
            this.selectedCameraStream = new MediaStream([cameraTrack]);
            this.selectedMicrophoneStream = new MediaStream([microphoneTrack]);
            console.log('[ROB] - ', this.selectedCameraDevice, this.selectedMicrophoneDevice, activeStream, cameraTrack, microphoneTrack);
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

    onSelectedCameraDeviceChange() {
        this.userMediaService.updateActiveCamera(this.selectedCameraDevice);
    }

    onSelectedMicrophoneDeviceChange() {
        this.userMediaService.updateActiveMicrophone(this.selectedMicrophoneDevice);
    }

    private updateSelectedCamera(camera: UserMediaDevice) {
        this.selectedCameraDevice = this.availableCameraDevices.find(device => device.deviceId === camera.deviceId);
    }

    private updateSelectedMicrophone(microphone: UserMediaDevice) {
        this.selectedMicrophoneDevice = this.availableMicrophoneDevices.find(device => device.deviceId === microphone.deviceId);
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
    }
}
