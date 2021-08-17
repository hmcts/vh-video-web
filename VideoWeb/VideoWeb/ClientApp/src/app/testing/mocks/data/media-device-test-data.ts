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
        let testData: Array<UserMediaDevice> = [];
        testData = testData.concat(this.getSingleCamera());
        testData = testData.concat(this.getSingleMicrophone());
        return testData;
    }

    getSingleCamera(): UserMediaDevice[] {
        const testData: UserMediaDevice[] = [];
        const device = new UserMediaDevice('camera1', 'camId1', 'videoinput', 'group1');
        testData.push(device);
        return testData;
    }
    
    getDisconnctedCamera(): UserMediaDevice {
        return new UserMediaDevice('cameraD', 'camIdD', 'videoinput', 'groupD');
    }

    getActiveCamera(): UserMediaDevice {
        return this.getListOfCameras()[0];
    }

    getActiveMicrophone(): UserMediaDevice {
        return this.getSingleMicrophone()[0];
    }
    
    getDisconnectedMicphone(): UserMediaDevice[] {
        const testData: UserMediaDevice[] = [];
        const device = new UserMediaDevice('micD', 'micIdD', 'audioinput', 'groupD');
        testData.push(device);
        return testData;
    }

    getSelectedCamera(): UserMediaDevice {
        return this.getListOfCameras()[1];
    }

    getSelectedMicphone(): UserMediaDevice {
        return this.getSingleMicrophone()[1];
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
