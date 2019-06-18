import { UserMediaDevice } from 'src/app/on-the-day/models/user-media-device';

export class MediaDeviceTestData {
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
