import { UserMediaService } from 'src/app/services/user-media.service';
import { UserMediaDevice } from 'src/app/shared/models/user-media-device';
import { MediaDeviceTestData } from './data/media-device-test-data';

export class MockUserMediaService extends UserMediaService {

    private testData = new MediaDeviceTestData();

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
}
