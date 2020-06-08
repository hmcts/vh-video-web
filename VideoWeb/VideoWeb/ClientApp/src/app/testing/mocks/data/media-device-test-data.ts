import { UserMediaDevice } from 'src/app/shared/models/user-media-device';

export class MediaDeviceTestData {
    getListOfDevices(): UserMediaDevice[] {
        let testData: Array<UserMediaDevice> = [];
        testData = testData.concat(this.getListOfCameras());
        testData = testData.concat(this.getListOfMicrophones());
        const defaultDevice = new UserMediaDevice('camera1', 'default', 'videoinput', 'group1');
        const soundOutput = new UserMediaDevice('audiooutput1', 'audiooutput1', 'audiooutput', 'group1');

        testData.push(defaultDevice);
        testData.push(soundOutput);
        return testData;
    }

    getListOfSingleCameraAndMicDevices(): UserMediaDevice[] {
        const testData: Array<UserMediaDevice> = [];
        testData.concat(this.getSingleCamera());
        testData.concat(this.getSingleMicrophone());
        return testData;
    }

    getSingleCamera(): UserMediaDevice[] {
        const testData: UserMediaDevice[] = [];
        const device = new UserMediaDevice('camera1', 'camId1', 'videoinput', 'group1');
        testData.push(device);
        return testData;
    }

    getListOfCameras(): UserMediaDevice[] {
        const testData: UserMediaDevice[] = [];
        const device = new UserMediaDevice('camera1', 'camId1', 'videoinput', 'group1');
        const device2 = new UserMediaDevice('camera2', 'camId2', 'videoinput', 'group2');
        testData.push(device);
        testData.push(device2);
        return testData;
    }

    getSingleMicrophone(): UserMediaDevice[] {
        const testData: UserMediaDevice[] = [];
        const device = new UserMediaDevice('mic1', 'micId1', 'audioinput', 'group1');
        testData.push(device);
        return testData;
    }

    getListOfMicrophones(): UserMediaDevice[] {
        const testData: UserMediaDevice[] = [];
        const device = new UserMediaDevice('mic1', 'micId1', 'audioinput', 'group1');
        const device2 = new UserMediaDevice('mic2', 'micId2', 'audioinput', 'group2');
        testData.push(device);
        testData.push(device2);
        return testData;
    }
}
