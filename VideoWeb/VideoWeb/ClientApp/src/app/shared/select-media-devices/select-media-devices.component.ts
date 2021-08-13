import { Component, OnInit, Output, EventEmitter, OnDestroy, Input } from '@angular/core';
import { UserMediaService } from 'src/app/services/user-media.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserMediaDevice } from 'src/app/shared/models/user-media-device';
import { UserMediaStreamService } from 'src/app/services/user-media-stream.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { VideoCallService } from 'src/app/waiting-space/services/video-call.service';
import { Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-select-media-devices',
    templateUrl: './select-media-devices.component.html',
    styleUrls: ['./select-media-devices.component.scss']
})
export class SelectMediaDevicesComponent implements OnInit, OnDestroy {
    private readonly loggerPrefix = '[SelectMediaDevices] -';
    @Output('onShouldClose') closeEventEmitter = new EventEmitter();
    @Input() showAudioOnlySetting = false;

    availableCameraDevices: UserMediaDevice[] = [];
    hasOnlyOneAvailableCameraDevice: boolean = false;
    availableMicrophoneDevices: UserMediaDevice[] = [];
    hasOnlyOneAvailableMicrophoneDevice: boolean = false;

    selectMediaDevicesForm: FormGroup;
    selectedCameraDevice: UserMediaDevice;
    selectedCameraStream: MediaStream;
    selectedMicrophoneDevice: UserMediaDevice;
    selectedMicrophoneStream: MediaStream;
    connectWithCameraOn: boolean;
    blockToggleClicks: boolean;

    private destroyedSubject = new Subject<any>();

    constructor(
        private userMediaService: UserMediaService,
        private userMediaStreamService: UserMediaStreamService,
        private formBuilder: FormBuilder,
        private logger: Logger,
        private translateService: TranslateService,
        private videoCallService: VideoCallService
    ) {}

    ngOnInit() {
        this.connectWithCameraOn = !this.videoCallService.isAudioOnly();

        this.userMediaService.connectedDevices$.pipe(takeUntil(this.destroyedSubject)).subscribe(connectedDevices => {
            this.availableCameraDevices = connectedDevices.filter(device => device.kind === 'videoinput');
            this.availableMicrophoneDevices = connectedDevices.filter(device => device.kind === 'audioinput');

            this.selectMediaDevicesForm = this.initNewDeviceSelectionForm();
        });

        this.userMediaService.activeVideoDevice$.pipe(takeUntil(this.destroyedSubject)).subscribe(cameraDevice => {
            this.updateSelectedCamera(cameraDevice);
        });

        this.userMediaService.activeMicrophoneDevice$.pipe(takeUntil(this.destroyedSubject)).subscribe(microphoneDevice => {
            this.updateSelectedMicrophone(microphoneDevice);
        });
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
        this.userMediaStreamService
            .getStreamForCam(this.selectedCameraDevice)
            .pipe(take(1))
            .subscribe(cameraStream => (this.selectedCameraStream = cameraStream));
    }

    private updateSelectedMicrophone(microphone: UserMediaDevice) {
        this.selectedMicrophoneDevice = this.availableMicrophoneDevices.find(device => device.deviceId === microphone.deviceId);
        this.updateStreamForSelectedMicrophone();
    }

    private updateStreamForSelectedMicrophone() {
        this.userMediaStreamService
            .getStreamForMic(this.selectedMicrophoneDevice)
            .pipe(take(1))
            .subscribe(microphoneStream => (this.selectedMicrophoneStream = microphoneStream));
    }

    private initNewDeviceSelectionForm(): FormGroup {
        this.logger.debug(`${this.loggerPrefix} Initialising new device selection form`);

        return this.formBuilder.group({
            camera: [Validators.required],
            microphone: [Validators.required]
        });
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

    onSave() {
        this.userMediaService.updateActiveCamera(this.selectedCameraDevice);
        this.userMediaService.updateActiveMicrophone(this.selectedMicrophoneDevice);

        this.closeEventEmitter.emit();
    }

    onCancel() {
        this.closeEventEmitter.emit();
    }

    get audioOnlyToggleText(): string {
        const result: string = this.connectWithCameraOn
            ? this.translateService.instant('select-media-devices.on')
            : this.translateService.instant('select-media-devices.off');
        return result.toUpperCase();
    }

    ngOnDestroy() {
        this.logger.debug(`${this.loggerPrefix} Closing select media device change`);

        this.destroyedSubject.next();
        this.destroyedSubject.complete();

        this.userMediaStreamService.stopStream(this.selectedCameraStream);
        this.userMediaStreamService.stopStream(this.selectedMicrophoneStream);
    }

    // private async updateDeviceList() {
    //     this.logger.debug(`${this.loggerPrefix} Updating device list`);
    //     zip(this.userMediaService.connectedVideoDevices, this.userMediaService.connectedMicrophoneDevices)
    //         .pipe(takeUntil(this.destroyedSubject))
    //         .subscribe(async deviceLists => {
    //             this.availableCameraDevices = deviceLists[0];
    //             this.availableMicrophoneDevices = deviceLists[1];
    //             this.selectedMediaDevicesForm = await this.initNewDeviceSelectionForm();
    //         });

    //     this.userMediaService.activeVideoDevice$.pipe(take(1)).subscribe(async activeCamera => {
    //         this.preferredCameraStream = await this.userMediaStreamService.getStreamForCam(activeCamera).toPromise();
    //     });

    //     this.userMediaService.activeMicrophoneDevice$.pipe(take(1)).subscribe(async activeMicrophone => {
    //         this.preferredCameraStream = await this.userMediaStreamService.getStreamForMic(activeMicrophone).toPromise();
    //     });
    // }

    // get hasSingleCameraConncted(): boolean {
    //     return this.availableCameraDevices.length === 1;
    // }

    // get singleCameraName(): string {
    //     return this.availableCameraDevices[0].label;
    // }

    // get singleMicrophoneName(): string {
    //     return this.availableMicrophoneDevices[0].label;
    // }

    // get hasSingleMicrophoneConncted(): boolean {
    //     return this.availableMicrophoneDevices.length === 1;
    // }

    // get selectedCamera(): AbstractControl {
    //     return this.selectedMediaDevicesForm.get('camera');
    // }

    // get selectedMicrophone(): AbstractControl {
    //     return this.selectedMediaDevicesForm.get('microphone');
    // }

    // async onSubmit() {
    //     // close dialog and stop streams
    //     this.stopVideoAudioStream();
    //     this.userMediaService.updateActiveCamera(this.getSelectedCamera());

    //     this.userMediaService.updateActiveMicrophone(this.getSelectedMicrophone());

    //     this.logger.debug(`${this.loggerPrefix} Cancelling media device change`);
    //     this.cancelMediaDeviceChange.emit();
    // }

    // private stopVideoAudioStream() {
    //     this.userMediaStreamService.stopStream(this.preferredCameraStream);
    //     this.userMediaStreamService.stopStream(this.preferredMicrophoneStream);
    // }

    // getSelectedCamera(): UserMediaDevice {
    //     return this.availableCameraDevices.find(x => x === this.selectedCamera.value);
    // }

    // getSelectedMicrophone(): UserMediaDevice {
    //     return this.availableMicrophoneDevices.find(x => x === this.selectedMicrophone.value);
    // }

    // private subscribeToDeviceSelectionChange() {
    //     this.selectedCamera.valueChanges.pipe(takeUntil(this.destroyedSubject)).subscribe(newCamera => {
    //         this.updateCameraStream(newCamera);
    //     });

    //     this.selectedMicrophone.valueChanges.pipe(takeUntil(this.destroyedSubject)).subscribe(newMicrophone => {
    //         this.updateMicrophoneStream(newMicrophone);
    //     });
    // }

    // private async updateCameraStream(newCam: UserMediaDevice) {
    //     this.logger.debug(`${this.loggerPrefix} Updating camera stream`);
    //     if (this.preferredCameraStream) {
    //         this.userMediaStreamService.stopStream(this.preferredCameraStream);
    //     }
    //     // this.userMediaService.updatePreferredCamera(newCam);
    //     this.preferredCameraStream = null;
    //     this.preferredCameraStream = await this.userMediaStreamService.getStreamForCam(newCam).toPromise();
    // }

    // private async updateMicrophoneStream(newMic: UserMediaDevice) {
    //     this.logger.debug(`${this.loggerPrefix} Updating mic stream`);
    //     if (this.preferredMicrophoneStream) {
    //         this.userMediaStreamService.stopStream(this.preferredMicrophoneStream);
    //     }
    //     // this.userMediaService.updatePreferredMicrophone(newMic);
    //     this.preferredMicrophoneStream = null;
    //     this.preferredMicrophoneStream = await this.userMediaStreamService.getStreamForMic(newMic).toPromise();
    // }

    // private unsubscription() {
    //     this.destroyedSubject.next();
    //     this.destroyedSubject.complete();
    // }
    // private cleanStream() {
    //     if (this.preferredCameraStream) {
    //         this.logger.debug(`${this.loggerPrefix} Closing camera stream`);
    //         this.userMediaStreamService.stopStream(this.preferredCameraStream);
    //     }
    //     this.preferredCameraStream = null;
    //     if (this.preferredMicrophoneStream) {
    //         this.logger.debug(`${this.loggerPrefix} Closing microphone stream`);
    //         this.userMediaStreamService.stopStream(this.preferredMicrophoneStream);
    //     }
    //     this.preferredMicrophoneStream = null;
    // }
}
