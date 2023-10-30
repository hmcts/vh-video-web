import { UserMediaService } from 'src/app/services/user-media.service';
import { UserMediaDevice } from 'src/app/shared/models/user-media-device';
import { MediaDeviceTestData } from './data/media-device-test-data';
import { SessionStorage } from 'src/app/services/session-storage';

export class MockUserMediaService extends UserMediaService {
    private testData = new MediaDeviceTestData();
    private _startWithAudioMuted = false;

    get startWithAudioMuted(): boolean {
        return this._startWithAudioMuted;
    }

    set startWithAudioMuted(value: boolean) {
        this._startWithAudioMuted = value;
    }

    async requestAccess(): Promise<boolean> {
        return true;
    }

    async getListOfVideoDevices(): Promise<UserMediaDevice[]> {
        return this.testData.getListOfCameras();
    }

    async getListOfMicrophoneDevices(): Promise<UserMediaDevice[]> {
        return this.testData.getListOfMicrophones();
    }

    async getPreferredMicStream(): Promise<MediaStream> {
        return null;
    }

    async getPreferredCameraStream(): Promise<MediaStream> {
        return null;
    }

    async getCachedDeviceIfStillConnected(cache: SessionStorage<UserMediaDevice>): Promise<UserMediaDevice> {
        return null;
    }
}
