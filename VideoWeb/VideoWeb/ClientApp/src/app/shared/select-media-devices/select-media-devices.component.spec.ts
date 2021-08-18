import { fakeAsync, flush, flushMicrotasks, tick } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { UserMediaService } from 'src/app/services/user-media.service';
import { MediaDeviceTestData } from 'src/app/testing/mocks/data/media-device-test-data';
import { MockLogger } from 'src/app/testing/mocks/mock-logger';
import { SelectMediaDevicesComponent } from './select-media-devices.component';
import { translateServiceSpy } from 'src/app/testing/mocks/mock-translation.service';
import { VideoCallService } from 'src/app/waiting-space/services/video-call.service';
import { videoCallServiceSpy } from 'src/app/testing/mocks/mock-video-call.service';
import { getSpiedPropertyGetter } from '../jasmine-helpers/property-helpers';
import { from, Observable, of, Subject } from 'rxjs';
import { MediaStreamService } from 'src/app/services/media-stream.service';
import { UserMediaDevice } from '../models/user-media-device';
import { Guid } from 'guid-typescript';

describe('SelectMediaDevicesComponent', () => {
    let component: SelectMediaDevicesComponent;
    let userMediaService: jasmine.SpyObj<UserMediaService>;
    let mediaStreamService: jasmine.SpyObj<MediaStreamService>;

    const fb = new FormBuilder();
    const testData = new MediaDeviceTestData();
    const mockCamStream = jasmine.createSpyObj<MediaStream>('MediaStream', ['getVideoTracks']);
    const mockMicStream = jasmine.createSpyObj<MediaStream>('MediaStream', ['getAudioTracks']);
    let connectedDevicesSubject: Subject<UserMediaDevice[]>;
    let activeVideoDeviceSubject: Subject<UserMediaDevice>;
    let activeMicrophoneDeviceSubject: Subject<UserMediaDevice>;
    let isAudioOnlySubject: Subject<boolean>;

    beforeAll(() => {
        mediaStreamService = jasmine.createSpyObj<MediaStreamService>('MediaStreamService', [
            'stopStream',
            'getStreamForCam',
            'getStreamForMic'
        ]);
        mediaStreamService.getStreamForCam.and.returnValue(of(mockCamStream));
        mediaStreamService.getStreamForMic.and.returnValue(of(mockMicStream));
    });

    beforeEach(fakeAsync(() => {
        userMediaService = jasmine.createSpyObj<UserMediaService>(
            'UserMediaService',
            ['updateActiveCamera', 'updateActiveMicrophone', 'updateIsAudioOnly'],
            ['activeVideoDevice$', 'activeMicrophoneDevice$', 'connectedDevices$', 'isAudioOnly$']
        );
        connectedDevicesSubject = new Subject<UserMediaDevice[]>();
        activeVideoDeviceSubject = new Subject<UserMediaDevice>();
        activeMicrophoneDeviceSubject = new Subject<UserMediaDevice>();
        isAudioOnlySubject = new Subject<boolean>();

        getSpiedPropertyGetter(userMediaService, 'activeVideoDevice$').and.returnValue(activeVideoDeviceSubject.asObservable());
        getSpiedPropertyGetter(userMediaService, 'activeMicrophoneDevice$').and.returnValue(activeMicrophoneDeviceSubject.asObservable());
        getSpiedPropertyGetter(userMediaService, 'connectedDevices$').and.returnValue(connectedDevicesSubject.asObservable());
        getSpiedPropertyGetter(userMediaService, 'isAudioOnly$').and.returnValue(isAudioOnlySubject.asObservable());

        component = new SelectMediaDevicesComponent(userMediaService, mediaStreamService, fb, new MockLogger(), translateServiceSpy);
        component.availableCameraDevices = testData.getListOfCameras();
    }));

    afterEach(() => {
        component.ngOnDestroy();
    });
    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should init connectWithCameraOn with input', fakeAsync(() => {
        component.ngOnInit();
        expect(component.connectWithCameraOn).toBeFalsy();
    }));

    it('should initialise the device form on init', fakeAsync(() => {
        component.ngOnInit();
        flushMicrotasks();
        connectedDevicesSubject.next(testData.getListOfDevices());
        flush();
        expect(component.selectMediaDevicesForm).toBeDefined();
        expect(component.selectMediaDevicesForm.valid).toBeDefined();
    }));

    it('should update selected cam', fakeAsync(() => {
        component.availableCameraDevices = testData.getListOfCameras();
        component.ngOnInit();
        flushMicrotasks();
        activeVideoDeviceSubject.next(testData.getSelectedCamera());
        flush();
        expect(component.selectedCameraDevice).toEqual(testData.getSelectedCamera());
    }));

    it('should update selected mic', fakeAsync(() => {
        component.availableCameraDevices = testData.getListOfCameras();
        component.ngOnInit();
        flushMicrotasks();
        activeMicrophoneDeviceSubject.next(testData.getSelectedMicphone());
        flush();
        expect(component.selectedMicrophoneDevice).toEqual(testData.getSelectedMicphone());
    }));

    it('should update settings in user media service onSave', () => {
        const cameraDevice = (component.selectedCameraDevice = new UserMediaDevice('camera', Guid.create().toString(), 'videoinput', null));
        const microphoneDevice = (component.selectedMicrophoneDevice = new UserMediaDevice(
            'microphone',
            Guid.create().toString(),
            'audioinput',
            null
        ));
        const isAudioOnly = !(component.connectWithCameraOn = false);

        component.onSave();

        expect(userMediaService.updateActiveCamera).toHaveBeenCalledWith(cameraDevice);
        expect(userMediaService.updateActiveMicrophone).toHaveBeenCalledWith(microphoneDevice);
        expect(userMediaService.updateIsAudioOnly).toHaveBeenCalledWith(isAudioOnly);
    });

    it('should emit cancelled event onSave', async () => {
        spyOn(component.closeEventEmitter, 'emit');
        component.onSave();
        expect(component.closeEventEmitter.emit).toHaveBeenCalled();
    });

    it('should emit cancelled event onCancel', async () => {
        spyOn(component.closeEventEmitter, 'emit');
        component.onCancel();
        expect(component.closeEventEmitter.emit).toHaveBeenCalled();
    });

    it('should update connectWithCameraOn to false', async () => {
        component.connectWithCameraOn = true;
        component.toggleSwitch();
        expect(component.connectWithCameraOn).toBeFalse();
    });

    it('should update connectWithCameraOn to true', async () => {
        component.connectWithCameraOn = false;
        component.toggleSwitch();
        expect(component.connectWithCameraOn).toBeTrue();
    });

    it('should update camera stream on device change', async () => {
        component.selectedCameraStream = null;
        component.onSelectedCameraDeviceChange();
        expect(component.selectedCameraStream).toEqual(mockCamStream);
    });

    it('should update microphone stream on device change', async () => {
        component.selectedCameraStream = null;
        component.onSelectedMicrophoneDeviceChange();
        expect(component.selectedMicrophoneStream).toEqual(mockMicStream);
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
        component.blockToggleClicks = false;
        component.transitionstart();
        expect(component.blockToggleClicks).toBeTruthy();
    });

    it('should set block click to false when transition ends', () => {
        component.blockToggleClicks = true;
        component.transitionEnd();
        expect(component.blockToggleClicks).toBeFalsy();
    });

    it('should clear streams on destroy', fakeAsync(() => {
        component.selectedCameraStream = mockCamStream;
        component.selectedMicrophoneStream = mockMicStream;
        mediaStreamService.stopStream.calls.reset();
        component.ngOnDestroy();
        flush();
        expect(mediaStreamService.stopStream).toHaveBeenCalledWith(mockCamStream);
        expect(mediaStreamService.stopStream).toHaveBeenCalledWith(mockMicStream);
    }));
});
