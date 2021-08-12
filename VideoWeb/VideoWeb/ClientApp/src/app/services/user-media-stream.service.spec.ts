import { UserMediaDevice } from '../shared/models/user-media-device';
import { MockLogger } from '../testing/mocks/mock-logger';
import { ErrorService } from '../services/error.service';
import { UserMediaStreamService } from './user-media-stream.service';
import { UserMediaService } from './user-media.service';

describe('UserMediaStreamService', () => {
    let service: UserMediaStreamService;
    let errrorServiceSpy: jasmine.SpyObj<ErrorService>;
    errrorServiceSpy = jasmine.createSpyObj<ErrorService>('ErrorService', ['handlePexipError']);
    let userMediaServiceSpy = jasmine.createSpyObj<UserMediaService>('UserMediaService', ['isDeviceStillConnected']);

    service = new UserMediaStreamService(new MockLogger(), errrorServiceSpy, userMediaServiceSpy);

    it('should catch error if get access is failed', async () => {
        spyOn(navigator.mediaDevices, 'getUserMedia').and.throwError('Could not get access to camera/microphone');
        expect(errrorServiceSpy.handlePexipError).toHaveBeenCalled();
    });
    it('should catch error if get stream for microphone is failed', async () => {
        spyOn(navigator.mediaDevices, 'getUserMedia').and.throwError('Could not get access to camera/microphone');
        await service.getStreamForMic(new UserMediaDevice('label', 'id123', 'audio', null));
        expect(errrorServiceSpy.handlePexipError).toHaveBeenCalled();
    });
    it('should catch error if get stream for camera is failed', async () => {
        spyOn(navigator.mediaDevices, 'getUserMedia').and.throwError('Could not get access to camera/microphone');
        await service.getStreamForCam(new UserMediaDevice('label', 'id123', 'video', null));
        expect(errrorServiceSpy.handlePexipError).toHaveBeenCalled();
    });
});
