import { UserMediaDevice } from './user-media-device';

export class SelectedUserMediaDevice {

    selectedCamera: UserMediaDevice;
    selectedMicrophone: UserMediaDevice;

    constructor(selectedCamera: UserMediaDevice, selectedMicrophone: UserMediaDevice) {
        this.validateDeviceSelection(selectedCamera, selectedMicrophone);
        this.selectedCamera = selectedCamera;
        this.selectedMicrophone = selectedMicrophone;
    }

    private validateDeviceSelection(selectedCamera: UserMediaDevice, selectedMicrophone: UserMediaDevice) {
        if (selectedCamera.kind !== 'videoinput') {
            throw new Error(`${selectedCamera.label} is not a camera`);
        }

        if (selectedMicrophone.kind !== 'audioinput') {
            throw new Error(`${selectedMicrophone.label} is not a microphone`);
        }
    }
}
