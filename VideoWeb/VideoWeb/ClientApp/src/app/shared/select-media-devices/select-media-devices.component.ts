import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { SelectedUserMediaDevice } from 'src/app/on-the-day/models/selected-user-media-device';
import { UserMediaService } from 'src/app/services/user-media.service';
import { FormBuilder, FormGroup, AbstractControl, Validators } from '@angular/forms';
import { UserMediaDevice } from 'src/app/on-the-day/models/user-media-device';

@Component({
  selector: 'app-select-media-devices',
  templateUrl: './select-media-devices.component.html',
  styleUrls: ['./select-media-devices.component.css']
})
export class SelectMediaDevicesComponent implements OnInit {

  @Output() cancelMediaDeviceChange = new EventEmitter();
  @Output() acceptMediaDeviceChange = new EventEmitter<SelectedUserMediaDevice>();

  availableCameraDevices: UserMediaDevice[] = [];
  availableMicrophoneDevices: UserMediaDevice[] = [];

  preferredCameraStream: MediaStream;
  preferredMicrophoneStream: MediaStream;

  selectedMediaDevicesForm: FormGroup;

  constructor(private userMediaService: UserMediaService,
    private formBuilder: FormBuilder) { }

  async ngOnInit() {
    await this.requestMedia();
    this.availableCameraDevices = await this.userMediaService.getListOfVideoDevices();
    this.availableMicrophoneDevices = await this.userMediaService.getListOfMicrophoneDevices();

    this.preferredCameraStream = await this.userMediaService.getPreferredCameraStream();
    this.preferredMicrophoneStream = await this.userMediaService.getPreferredMicStream();

    this.setupForm();
  }

  async requestMedia() {
    const mediaAccepted = await this.userMediaService.requestAccess();
    if (mediaAccepted) {
      this.userMediaService.stopStream();
    }
  }

  private setupForm() {
    let cam = this.availableCameraDevices[0];
    if (this.userMediaService.getPreferredCamera()) {
      cam = this.availableCameraDevices.find(x => x.deviceId === this.userMediaService.getPreferredCamera().deviceId);
    }
    let mic = this.availableMicrophoneDevices[0];
    if (this.userMediaService.getPreferredMicrophone()) {
      mic = this.availableMicrophoneDevices.find(x => x.deviceId === this.userMediaService.getPreferredMicrophone().deviceId);
    }
    this.selectedMediaDevicesForm = this.formBuilder.group({
      camera: [cam, Validators.required],
      microphone: [mic, Validators.required]
    });

    this.subscribeToDeviceSelectionChange();
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

  get selectedCamera(): AbstractControl { return this.selectedMediaDevicesForm.get('camera'); }

  get selectedMicrophone(): AbstractControl { return this.selectedMediaDevicesForm.get('microphone'); }

  onSubmit() {
    if (this.selectedMediaDevicesForm.invalid) {
      return;
    }
    const selectedCam = this.getSelectedCamera();
    const selectedMic = this.getSelectedMicrophone();
    this.userMediaService.stopAStream(this.preferredCameraStream);
    this.userMediaService.stopAStream(this.preferredMicrophoneStream);
    this.acceptMediaDeviceChange.emit(new SelectedUserMediaDevice(selectedCam, selectedMic));
  }

  onCancel() {
    this.cancelMediaDeviceChange.emit();
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
      this.userMediaService.stopAStream(this.preferredCameraStream);
    }
    this.userMediaService.updatePreferredCamera(newCam);
    this.preferredCameraStream = null;
    this.preferredCameraStream = await this.userMediaService.getPreferredCameraStream();
  }

  private async updateMicrophoneStream(newMic: UserMediaDevice) {
    if (this.preferredMicrophoneStream) {
      this.userMediaService.stopAStream(this.preferredMicrophoneStream);
    }
    this.userMediaService.updatePreferredMicrophone(newMic);
    this.preferredMicrophoneStream = null;
    this.preferredMicrophoneStream = await this.userMediaService.getPreferredMicStream();
  }
}
