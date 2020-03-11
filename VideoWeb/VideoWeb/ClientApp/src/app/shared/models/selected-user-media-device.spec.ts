import { MediaDeviceTestData } from 'src/app/testing/mocks/data/media-device-test-data';
import { SelectedUserMediaDevice } from './selected-user-media-device';

describe('SelectedUserMediaDevice', () => {
    const testData = new MediaDeviceTestData();
    it('should instantiate with valid parameters', () => {
        const cam = testData.getSingleCamera()[0];
        const mic = testData.getSingleMicrophone()[0];

        expect(new SelectedUserMediaDevice(cam, mic)).toBeDefined();
    });

    it('should throw error when microphone is not a valid device type', () => {
        const cam = testData.getSingleCamera()[0];
        const mic = testData.getSingleCamera()[0];
        const action = function() {
            return new SelectedUserMediaDevice(cam, mic);
        };
        expect(action).toThrowError(TypeError, /is not a microphone/);
    });

    it('should throw error when camera is not a valid device type', () => {
        const cam = testData.getSingleMicrophone()[0];
        const mic = testData.getSingleMicrophone()[0];

        const action = function() {
            return new SelectedUserMediaDevice(cam, mic);
        };
        expect(action).toThrowError(TypeError, /is not a camera/);
    });
});
