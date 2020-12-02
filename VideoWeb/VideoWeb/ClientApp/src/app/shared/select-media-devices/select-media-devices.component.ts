import { Component, OnInit, Output, EventEmitter, OnDestroy, Input } from '@angular/core';
import { SelectedUserMediaDevice } from 'src/app/shared/models/selected-user-media-device';
import { UserMediaService } from 'src/app/services/user-media.service';
import { FormBuilder, FormGroup, AbstractControl, Validators } from '@angular/forms';
import { UserMediaDevice } from 'src/app/shared/models/user-media-device';
import { UserMediaStreamService } from 'src/app/services/user-media-stream.service';
import { Logger } from 'src/app/services/logging/logger-base';

@Component({
    selector: 'app-select-media-devices',
    templateUrl: './select-media-devices.component.html',
    styleUrls: ['./select-media-devices.component.scss']
})
export class SelectMediaDevicesComponent implements OnInit, OnDestroy {
    private readonly loggerPrefix = '[SelectMediaDevices] -';
    @Output() cancelMediaDeviceChange = new EventEmitter();
    @Output() acceptMediaDeviceChange = new EventEmitter<SelectedUserMediaDevice>();
    @Input() waitingRoomMode = false;
    @Input() showAudioOnlySetting = false;
    @Input() cameraOn = true;

    availableCameraDevices: UserMediaDevice[] = [];
    availableMicrophoneDevices: UserMediaDevice[] = [];

    preferredCameraStream: MediaStream;
    preferredMicrophoneStream: MediaStream;
    connectWithCameraOn: boolean;

    selectedMediaDevicesForm: FormGroup;
    deviceIsChanged = false;

    constructor(
        private userMediaService: UserMediaService,
        private userMediaStreamService: UserMediaStreamService,
        private formBuilder: FormBuilder,
        private logger: Logger
    ) {}

    ngOnInit() {
        this.connectWithCameraOn = this.cameraOn;
        this.logger.debug(`${this.loggerPrefix} Initialising media device selection`);
        return this.requestMedia().then(permissionGranted => {
            if (!permissionGranted) {
                this.logger.warn(`${this.loggerPrefix} Could not get all media permissions. Check logs`);
            }
            this.logger.debug(`${this.loggerPrefix} Updating device list`);
            this.updateDeviceList()
                .then(async () => {
                    this.selectedMediaDevicesForm = await this.initNewDeviceSelectionForm();
                    this.subscribeToDeviceSelectionChange();
                })
                .catch(error => {
                    this.logger.error(`${this.loggerPrefix} Failed to update device selection`, error);
                });
        });
    }

    private async updateDeviceList() {
        this.availableCameraDevices = await this.userMediaService.getListOfVideoDevices();
        this.availableMicrophoneDevices = await this.userMediaService.getListOfMicrophoneDevices();

        this.userMediaService.connectedDevices.subscribe(async () => {
            this.availableCameraDevices = await this.userMediaService.getListOfVideoDevices();
            this.availableMicrophoneDevices = await this.userMediaService.getListOfMicrophoneDevices();
            this.selectedMediaDevicesForm = await this.initNewDeviceSelectionForm();
        });

        const preferredCamera = await this.userMediaService.getPreferredCamera();
        const preferredMicrophone = await this.userMediaService.getPreferredMicrophone();
        this.preferredCameraStream = await this.userMediaStreamService.getStreamForCam(preferredCamera);
        this.preferredMicrophoneStream = await this.userMediaStreamService.getStreamForMic(preferredMicrophone);
    }

    async requestMedia() {
        return this.userMediaStreamService.requestAccess();
    }

    private async initNewDeviceSelectionForm(): Promise<FormGroup> {
        let cam = this.availableCameraDevices[0];
        const preferredCamera = await this.userMediaService.getPreferredCamera();
        if (preferredCamera) {
            cam = this.availableCameraDevices.find(x => x.label === preferredCamera.label);
        }

        let mic = this.availableMicrophoneDevices[0];
        const preferredMicrophone = await this.userMediaService.getPreferredMicrophone();
        if (preferredMicrophone) {
            mic = this.availableMicrophoneDevices.find(x => x.label === preferredMicrophone.label);
        }
        return this.formBuilder.group({
            camera: [cam, Validators.required],
            microphone: [mic, Validators.required]
        });
    }

    get audioOnlyToggleText(): string {
        return this.connectWithCameraOn ? 'ON' : 'OFF';
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

    onChangeDevice() {
        this.saveSelectedDevices();
    }

    private saveSelectedDevices() {
        // save on select device
        const selectedCam = this.getSelectedCamera();
        const selectedMic = this.getSelectedMicrophone();
        const audioOnly = !this.connectWithCameraOn;
        this.userMediaService.updatePreferredCamera(selectedCam);
        this.userMediaService.updatePreferredMicrophone(selectedMic);
        this.logger.debug(`${this.loggerPrefix} Accepting new media device change`);
        this.acceptMediaDeviceChange.emit(new SelectedUserMediaDevice(selectedCam, selectedMic, audioOnly));
    }

    onSubmit() {
        // close dialog and stop streams
        this.userMediaStreamService.stopStream(this.preferredCameraStream);
        this.userMediaStreamService.stopStream(this.preferredMicrophoneStream);
        this.logger.debug(`${this.loggerPrefix} Cancelling media device change`);
        this.cancelMediaDeviceChange.emit();
    }

    toggleSwitch() {
        this.connectWithCameraOn = !this.connectWithCameraOn;
        this.logger.debug(`${this.loggerPrefix} Toggle camera switch to ${this.connectWithCameraOn ? 'on' : 'off'}`);

        this.saveSelectedDevices();
    }

    getSelectedCamera(): UserMediaDevice {
        return this.availableCameraDevices.find(x => x === this.selectedCamera.value);
    }

    getSelectedMicrophone(): UserMediaDevice {
        return this.availableMicrophoneDevices.find(x => x === this.selectedMicrophone.value);
    }

    private subscribeToDeviceSelectionChange() {
        this.selectedCamera.valueChanges.subscribe(newCamera => {
            this.updateCameraStream(newCamera);
        });

        this.selectedMicrophone.valueChanges.subscribe(newMicrophone => {
            this.updateMicrophoneStream(newMicrophone);
        });
    }

    private async updateCameraStream(newCam: UserMediaDevice) {
        if (this.preferredCameraStream) {
            this.userMediaStreamService.stopStream(this.preferredCameraStream);
        }
        this.userMediaService.updatePreferredCamera(newCam);
        this.preferredCameraStream = null;
        this.preferredCameraStream = await this.userMediaStreamService.getStreamForCam(newCam);
    }

    private async updateMicrophoneStream(newMic: UserMediaDevice) {
        if (this.preferredMicrophoneStream) {
            this.userMediaStreamService.stopStream(this.preferredMicrophoneStream);
        }
        this.preferredMicrophoneStream = null;
        this.preferredMicrophoneStream = await this.userMediaStreamService.getStreamForMic(newMic);
        if (this.preferredMicrophoneStream) {
            this.userMediaService.updatePreferredMicrophone(newMic);
        }
    }

    ngOnDestroy() {
        this.logger.debug(`${this.loggerPrefix} Closing select media device change`);
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
}
