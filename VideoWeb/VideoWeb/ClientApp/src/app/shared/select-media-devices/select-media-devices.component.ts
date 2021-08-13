import { Component, OnInit, Output, EventEmitter, OnDestroy, Input } from '@angular/core';
import { UserMediaService } from 'src/app/services/user-media.service';
import { FormBuilder, FormGroup, AbstractControl, Validators } from '@angular/forms';
import { UserMediaDevice } from 'src/app/shared/models/user-media-device';
import { UserMediaStreamService } from 'src/app/services/user-media-stream.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { TranslateService } from '@ngx-translate/core';
import { Subject, zip } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { VideoCallService } from 'src/app/waiting-space/services/video-call.service';

@Component({
    selector: 'app-select-media-devices',
    templateUrl: './select-media-devices.component.html',
    styleUrls: ['./select-media-devices.component.scss']
})
export class SelectMediaDevicesComponent implements OnInit, OnDestroy {
    private readonly loggerPrefix = '[SelectMediaDevices] -';
    @Output() cancelMediaDeviceChange = new EventEmitter();
    @Input() waitingRoomMode = false;
    @Input() showAudioOnlySetting = false;

    availableCameraDevices: UserMediaDevice[] = [];
    availableMicrophoneDevices: UserMediaDevice[] = [];
    preferredCameraStream: MediaStream;
    preferredMicrophoneStream: MediaStream;
    connectWithCameraOn: boolean;
    blockClicks = false;

    selectedMediaDevicesForm: FormGroup;
    deviceIsChanged = false;
    private destroyedSubject = new Subject();

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
        this.updateDeviceList()
            .then(async () => {
                this.selectedMediaDevicesForm = await this.initNewDeviceSelectionForm();
                this.subscribeToDeviceSelectionChange();
            })
            .catch(error => {
                this.logger.error(`${this.loggerPrefix} Failed to update device selection`, error);
            });
    }

    private async updateDeviceList() {
        this.logger.debug(`${this.loggerPrefix} Updating device list`);
        zip(this.userMediaService.connectedVideoDevices, this.userMediaService.connectedMicrophoneDevices)
            .pipe(takeUntil(this.destroyedSubject))
            .subscribe(async deviceLists => {
                this.availableCameraDevices = deviceLists[0];
                this.availableMicrophoneDevices = deviceLists[1];
                this.selectedMediaDevicesForm = await this.initNewDeviceSelectionForm();
            });

        this.userMediaService.activeVideoDevice$.pipe(take(1)).subscribe(async activeCamera => {
            this.preferredCameraStream = await this.userMediaStreamService.getStreamForCam(activeCamera).toPromise();
        });

        this.userMediaService.activeMicrophoneDevice$.pipe(take(1)).subscribe(async activeMicrophone => {
            this.preferredCameraStream = await this.userMediaStreamService.getStreamForMic(activeMicrophone).toPromise();
        });
    }

    private async initNewDeviceSelectionForm(): Promise<FormGroup> {
        this.logger.debug(`${this.loggerPrefix} Initialising new device selection form`);
        let cam = this.availableCameraDevices[0];
        // const preferredCamera = await this.userMediaService.getPreferredCamera();
        // if (preferredCamera) {
        //     cam = this.availableCameraDevices.find(x => x.label === preferredCamera.label);
        // }

        let mic = this.availableMicrophoneDevices[0];
        // const preferredMicrophone = await this.userMediaService.getPreferredMicrophone();
        // if (preferredMicrophone) {
        //     mic = this.availableMicrophoneDevices.find(x => x.label === preferredMicrophone.label);
        // }
        return this.formBuilder.group({
            camera: [cam, Validators.required],
            microphone: [mic, Validators.required]
        });
    }

    get audioOnlyToggleText(): string {
        const result: string = this.connectWithCameraOn
            ? this.translateService.instant('select-media-devices.on')
            : this.translateService.instant('select-media-devices.off');
        return result.toUpperCase();
    }

    get hasSingleCameraConncted(): boolean {
        return this.availableCameraDevices.length === 1;
    }

    get singleCameraName(): string {
        return this.availableCameraDevices[0].label;
    }

    get singleMicrophoneName(): string {
        return this.availableMicrophoneDevices[0].label;
    }

    get hasSingleMicrophoneConncted(): boolean {
        return this.availableMicrophoneDevices.length === 1;
    }

    get selectedCamera(): AbstractControl {
        return this.selectedMediaDevicesForm.get('camera');
    }

    get selectedMicrophone(): AbstractControl {
        return this.selectedMediaDevicesForm.get('microphone');
    }

    async onSubmit() {
        // close dialog and stop streams
        this.stopVideoAudioStream();
        this.userMediaService.updateActiveCamera(this.getSelectedCamera());

        this.userMediaService.updateActiveMicrophone(this.getSelectedMicrophone());

        this.logger.debug(`${this.loggerPrefix} Cancelling media device change`);
        this.cancelMediaDeviceChange.emit();
    }

    private stopVideoAudioStream() {
        this.userMediaStreamService.stopStream(this.preferredCameraStream);
        this.userMediaStreamService.stopStream(this.preferredMicrophoneStream);
    }

    toggleSwitch() {
        this.connectWithCameraOn = !this.connectWithCameraOn;
        this.logger.debug(`${this.loggerPrefix} Toggle camera switch to ${this.connectWithCameraOn ? 'on' : 'off'}`);
    }

    getSelectedCamera(): UserMediaDevice {
        return this.availableCameraDevices.find(x => x === this.selectedCamera.value);
    }

    getSelectedMicrophone(): UserMediaDevice {
        return this.availableMicrophoneDevices.find(x => x === this.selectedMicrophone.value);
    }

    private subscribeToDeviceSelectionChange() {
        this.selectedCamera.valueChanges.pipe(takeUntil(this.destroyedSubject)).subscribe(newCamera => {
            this.updateCameraStream(newCamera);
        });

        this.selectedMicrophone.valueChanges.pipe(takeUntil(this.destroyedSubject)).subscribe(newMicrophone => {
            this.updateMicrophoneStream(newMicrophone);
        });
    }

    private async updateCameraStream(newCam: UserMediaDevice) {
        this.logger.debug(`${this.loggerPrefix} Updating camera stream`);
        if (this.preferredCameraStream) {
            this.userMediaStreamService.stopStream(this.preferredCameraStream);
        }
        // this.userMediaService.updatePreferredCamera(newCam);
        this.preferredCameraStream = null;
        this.preferredCameraStream = await this.userMediaStreamService.getStreamForCam(newCam).toPromise();
    }

    private async updateMicrophoneStream(newMic: UserMediaDevice) {
        this.logger.debug(`${this.loggerPrefix} Updating mic stream`);
        if (this.preferredMicrophoneStream) {
            this.userMediaStreamService.stopStream(this.preferredMicrophoneStream);
        }
        // this.userMediaService.updatePreferredMicrophone(newMic);
        this.preferredMicrophoneStream = null;
        this.preferredMicrophoneStream = await this.userMediaStreamService.getStreamForMic(newMic).toPromise();
    }

    transitionstart() {
        this.blockClicks = true;
    }

    transitionEnd() {
        this.blockClicks = false;
    }

    private unsubscription() {
        this.destroyedSubject.next();
        this.destroyedSubject.complete();
    }
    private cleanStream() {
        if (this.preferredCameraStream) {
            this.logger.debug(`${this.loggerPrefix} Closing camera stream`);
            this.userMediaStreamService.stopStream(this.preferredCameraStream);
        }
        this.preferredCameraStream = null;
        if (this.preferredMicrophoneStream) {
            this.logger.debug(`${this.loggerPrefix} Closing microphone stream`);
            this.userMediaStreamService.stopStream(this.preferredMicrophoneStream);
        }
        this.preferredMicrophoneStream = null;
    }

    ngOnDestroy() {
        this.logger.debug(`${this.loggerPrefix} Closing select media device change`);
        this.unsubscription();
        this.cleanStream();
    }
}
