import { UserMediaDevice } from './user-media-device';

export class SelectedUserMediaDevice {
    selectedCamera: UserMediaDevice;
    selectedMicrophone: UserMediaDevice;
    audioOnly: boolean;

    constructor(selectedCamera: UserMediaDevice, selectedMicrophone: UserMediaDevice, audioOnly = false) {
        this.validateDeviceSelection(selectedCamera, selectedMicrophone);
        this.selectedCamera = selectedCamera;
        this.selectedMicrophone = selectedMicrophone;
        this.audioOnly = audioOnly;
    }

    private validateDeviceSelection(selectedCamera: UserMediaDevice, selectedMicrophone: UserMediaDevice) {
        if (selectedCamera.kind !== 'videoinput') {
            throw new TypeError(`${selectedCamera.label} is not a camera`);
        }

        if (selectedMicrophone.kind !== 'audioinput') {
            throw new TypeError(`${selectedMicrophone.label} is not a microphone`);
        }
    }
}
