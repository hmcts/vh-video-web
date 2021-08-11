import { fakeAsync, tick } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { BehaviorSubject, of, Subject } from 'rxjs';
import { UserMediaStreamService } from 'src/app/services/user-media-stream.service';
import { UserMediaService } from 'src/app/services/user-media.service';
import { MediaDeviceTestData } from 'src/app/testing/mocks/data/media-device-test-data';
import { MockLogger } from 'src/app/testing/mocks/mock-logger';
import { SelectMediaDevicesComponent } from './select-media-devices.component';
import { translateServiceSpy } from 'src/app/testing/mocks/mock-translation.service';
import { VideoCallService } from 'src/app/waiting-space/services/video-call.service';
import { videoCallServiceSpy } from 'src/app/testing/mocks/mock-video-call.service';
import { getSpiedPropertyGetter } from '../jasmine-helpers/property-helpers';
describe('SelectMediaDevicesComponent', () => {
    let component: SelectMediaDevicesComponent;
    let userMediaService: jasmine.SpyObj<UserMediaService>;
    let userMediaStreamService: jasmine.SpyObj<UserMediaStreamService>;
    let videoCallService: jasmine.SpyObj<VideoCallService>;

    const fb = new FormBuilder();
    const testData = new MediaDeviceTestData();
    const mockCamStream = jasmine.createSpyObj<MediaStream>('MediaStream', ['getVideoTracks']);
    const mockMicStream = jasmine.createSpyObj<MediaStream>('MediaStream', ['getAudioTracks']);

    beforeAll(() => {
        userMediaStreamService = jasmine.createSpyObj<UserMediaStreamService>('UserMediaStreamService', [
            'requestAccess',
            'stopStream',
            'getStreamForCam',
            'getStreamForMic'
        ]);
        userMediaStreamService.requestAccess.and.resolveTo(true);
        userMediaStreamService.getStreamForCam.and.resolveTo(mockCamStream);
        userMediaStreamService.getStreamForMic.and.resolveTo(mockMicStream);
        videoCallService = jasmine.createSpyObj<VideoCallService>('VideoCallService', ['isAudioOnly', 'callWithNewDevices']);
        videoCallServiceSpy.isAudioOnly.and.returnValue(true);
        userMediaService = jasmine.createSpyObj<UserMediaService>(
            'UserMediaService',
            [
                'getPreferredCamera',
                'getPreferredMicrophone',
                'updatePreferredCamera',
                'updatePreferredMicrophone'
            ],
            ['connectedDevices',
            'connectedVideoDevices',
            'connectedMicrophoneDevices']
        );

        getSpiedPropertyGetter(userMediaService,'connectedVideoDevices').and.returnValue(of(testData.getListOfCameras()));
        getSpiedPropertyGetter(userMediaService,'connectedMicrophoneDevices').and.returnValue(of(testData.getListOfMicrophones()));
        getSpiedPropertyGetter(userMediaService,'connectedDevices').and.returnValue(of(testData.getListOfDevices()));
        userMediaService.getPreferredCamera.and.resolveTo(testData.getListOfCameras()[0]);
        userMediaService.getPreferredMicrophone.and.resolveTo(testData.getListOfMicrophones()[0]);
    });

    beforeEach(fakeAsync(() => {
        component = new SelectMediaDevicesComponent(
            userMediaService,
            userMediaStreamService,
            fb,
            new MockLogger(),
            translateServiceSpy,
            videoCallServiceSpy
        );
        component.ngOnInit();
        tick();
    }));

    afterEach(() => {
        component.ngOnDestroy();
    });

    it('should init connectWithCameraOn with input', () => {
        expect(component.connectWithCameraOn).toBeFalsy();
    });

    it('should initialise the device form on init', async () => {
        expect(component.selectedMediaDevicesForm).toBeDefined();
        expect(component.selectedMediaDevicesForm.valid).toBeTruthy();
    });

    it('should return true when only one camera is available', () => {
        component.availableCameraDevices = testData.getSingleCamera();
        expect(component.hasSingleCameraConncted).toBeTruthy();
        expect(component.singleCameraName).toBeDefined();
    });

    it('should return true when multiple cameras are available', () => {
        component.availableCameraDevices = testData.getListOfCameras();
        expect(component.hasSingleCameraConncted).toBeFalsy();
    });

    it('should return true when only one microphone is available', () => {
        component.availableMicrophoneDevices = testData.getSingleMicrophone();
        expect(component.hasSingleMicrophoneConncted).toBeTruthy();
        expect(component.singleMicrophoneName).toBeDefined();
    });

    it('should return true when multiple microphones are available', () => {
        component.availableMicrophoneDevices = testData.getListOfMicrophones();
        expect(component.hasSingleMicrophoneConncted).toBeFalsy();
    });

    it('should emit cancelled event onCancel', async () => {
        spyOn(component.cancelMediaDeviceChange, 'emit');
        component.onSubmit();
        expect(component.cancelMediaDeviceChange.emit).toHaveBeenCalled();
    });

    it('should update video call service', async () => {
        spyOn(component.cancelMediaDeviceChange, 'emit');
        videoCallServiceSpy.callWithNewDevices.and.callThrough();
        component.onSubmit();
        expect(videoCallServiceSpy.callWithNewDevices).toHaveBeenCalled();
    });

    it('should update microphone stream on device change', () => {
        const device = component.availableMicrophoneDevices[1];
        component.preferredMicrophoneStream = jasmine.createSpyObj<MediaStream>('MediaStream', ['getAudioTracks']);
        component.selectedMicrophone.setValue(device);
        expect(userMediaStreamService.getStreamForMic).toHaveBeenCalledWith(device);
    });

    it('should update camera stream on device change', () => {
        const device = component.availableCameraDevices[1];
        component.preferredCameraStream = jasmine.createSpyObj<MediaStream>('MediaStream', ['getVideoTracks']);
        component.selectedCamera.setValue(device);
        expect(userMediaStreamService.getStreamForCam).toHaveBeenCalledWith(device);
    });

    it('should clear streams on destroy', () => {
        component.preferredCameraStream = mockCamStream;
        component.preferredMicrophoneStream = mockMicStream;
        component.ngOnDestroy();
        expect(component.preferredCameraStream).toBeNull();
        expect(component.preferredMicrophoneStream).toBeNull();
    });

    it('should get camera text "OFF" when connectWithCameraOn is false', () => {
        translateServiceSpy.instant.calls.reset();
        component.connectWithCameraOn = false;
        expect(component.audioOnlyToggleText).toBe('SELECT-MEDIA-DEVICES.OFF');
    });

    it('should get camera text "ON" when connectWithCameraOn is true', () => {
        component.connectWithCameraOn = true;
        translateServiceSpy.instant.calls.reset();
        expect(component.audioOnlyToggleText).toBe('SELECT-MEDIA-DEVICES.ON');
    });

    it('should set block click to true when transition starts', () => {
        component.blockClicks = false;
        component.transitionstart();
        expect(component.blockClicks).toBeTruthy();
    });

    it('should set block click to false when transition ends', () => {
        component.blockClicks = true;
        component.transitionEnd();
        expect(component.blockClicks).toBeFalsy();
    });
});
