import { fakeAsync, flush, flushMicrotasks } from '@angular/core/testing';
import { Role, UserProfileResponse } from 'src/app/services/clients/api-client';
import { BackgroundFilter } from 'src/app/services/models/background-filter';
import { UserMediaService } from 'src/app/services/user-media.service';
import { VideoFilterService } from 'src/app/services/video-filter.service';
import { MediaDeviceTestData } from 'src/app/testing/mocks/data/media-device-test-data';
import { MockLogger } from 'src/app/testing/mocks/mock-logger';
import { translateServiceSpy } from 'src/app/testing/mocks/mock-translation.service';
import { getSpiedPropertyGetter } from '../jasmine-helpers/property-helpers';
import { Subject } from 'rxjs';
import { UserMediaStreamService } from 'src/app/services/user-media-stream.service';
import { UserMediaDevice } from '../models/user-media-device';
import { SelectMediaDevicesComponent } from './select-media-devices.component';
import { ProfileService } from 'src/app/services/api/profile.service';

describe('SelectMediaDevicesComponent', () => {
    const mockProfile: UserProfileResponse = new UserProfileResponse({
        display_name: 'John Doe',
        first_name: 'John',
        last_name: 'Doe',
        role: Role.Judge
    });

    let component: SelectMediaDevicesComponent;
    let userMediaService: jasmine.SpyObj<UserMediaService>;
    let userMediaStreamServiceSpy: jasmine.SpyObj<UserMediaStreamService>;
    let profileService: jasmine.SpyObj<ProfileService>;
    let videoFilterService: jasmine.SpyObj<VideoFilterService>;

    const testData = new MediaDeviceTestData();
    const mockCamStream = jasmine.createSpyObj<MediaStream>('MediaStream', ['getVideoTracks']);
    const mockMicStream = jasmine.createSpyObj<MediaStream>('MediaStream', ['getAudioTracks']);
    let connectedVideoDevicesSubject: Subject<UserMediaDevice[]>;
    let connectedMicrophoneDevicesSubject: Subject<UserMediaDevice[]>;
    let activeVideoDeviceSubject: Subject<UserMediaDevice>;
    let activeMicrophoneDeviceSubject: Subject<UserMediaDevice>;
    let isAudioOnlySubject: Subject<boolean>;
    let filterChangedSubject: Subject<BackgroundFilter | null>;

    let activeCameraStreamSubject: Subject<MediaStream>;
    let activeMicrophoneStreamSubject: Subject<MediaStream>;
    beforeAll(() => {
        profileService = jasmine.createSpyObj<ProfileService>('ProfileService', ['getUserProfile']);
        videoFilterService = jasmine.createSpyObj<VideoFilterService>('VideoFilterService', [], ['onFilterChanged$']);
    });

    beforeEach(fakeAsync(() => {
        userMediaService = jasmine.createSpyObj<UserMediaService>(
            'UserMediaService',
            ['updateActiveCamera', 'updateActiveMicrophone', 'updateIsAudioOnly'],
            ['activeVideoDevice$', 'activeMicrophoneDevice$', 'connectedVideoDevices$', 'connectedMicrophoneDevices$', 'isAudioOnly$']
        );
        connectedVideoDevicesSubject = new Subject<UserMediaDevice[]>();
        connectedMicrophoneDevicesSubject = new Subject<UserMediaDevice[]>();
        activeVideoDeviceSubject = new Subject<UserMediaDevice>();
        activeMicrophoneDeviceSubject = new Subject<UserMediaDevice>();
        isAudioOnlySubject = new Subject<boolean>();
        filterChangedSubject = new Subject<BackgroundFilter | null>();
        profileService.getUserProfile.and.returnValue(Promise.resolve(mockProfile));

        getSpiedPropertyGetter(userMediaService, 'activeVideoDevice$').and.returnValue(activeVideoDeviceSubject.asObservable());
        getSpiedPropertyGetter(userMediaService, 'activeMicrophoneDevice$').and.returnValue(activeMicrophoneDeviceSubject.asObservable());
        getSpiedPropertyGetter(userMediaService, 'connectedVideoDevices$').and.returnValue(connectedVideoDevicesSubject.asObservable());
        getSpiedPropertyGetter(userMediaService, 'connectedMicrophoneDevices$').and.returnValue(
            connectedMicrophoneDevicesSubject.asObservable()
        );
        getSpiedPropertyGetter(userMediaService, 'isAudioOnly$').and.returnValue(isAudioOnlySubject.asObservable());

        userMediaStreamServiceSpy = jasmine.createSpyObj<UserMediaStreamService>([], ['activeCameraStream$', 'activeMicrophoneStream$']);

        activeCameraStreamSubject = new Subject<MediaStream>();
        activeMicrophoneStreamSubject = new Subject<MediaStream>();

        getSpiedPropertyGetter(userMediaStreamServiceSpy, 'activeCameraStream$').and.returnValue(activeCameraStreamSubject.asObservable());
        getSpiedPropertyGetter(userMediaStreamServiceSpy, 'activeMicrophoneStream$').and.returnValue(
            activeMicrophoneStreamSubject.asObservable()
        );
        getSpiedPropertyGetter(videoFilterService, 'onFilterChanged$').and.returnValue(filterChangedSubject.asObservable());
        filterChangedSubject.next(BackgroundFilter.blur);

        component = new SelectMediaDevicesComponent(
            userMediaService,
            userMediaStreamServiceSpy,
            new MockLogger(),
            translateServiceSpy,
            profileService,
            videoFilterService
        );

        component.availableCameraDevices = testData.getListOfCameras();
    }));

    afterEach(() => {
        component.ngOnDestroy();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('OnInit', () => {
        it('should initialise connectWithCameraOn with input', fakeAsync(() => {
            component.ngOnInit();
            expect(component.connectWithCameraOn).toBeFalsy();
        }));

        it('should initialise the device form on init', fakeAsync(() => {
            component.ngOnInit();
            flushMicrotasks();
            connectedVideoDevicesSubject.next(testData.getListOfCameras());
            connectedMicrophoneDevicesSubject.next(testData.getListOfMicrophones());
            flush();
            expect(component.availableCameraDevices).toBeDefined();
            expect(component.availableMicrophoneDevices).toBeDefined();
        }));

        it('should initialise connectWithCameraOn to true', fakeAsync(() => {
            component.ngOnInit();
            flushMicrotasks();
            isAudioOnlySubject.next(false);
            flush();
            expect(component.connectWithCameraOn).toBeTrue();
        }));

        it('should initialise showBackgroundFilter to true when user is judge', fakeAsync(() => {
            component.ngOnInit();
            flushMicrotasks();
            flush();
            expect(component.showBackgroundFilter).toBeTrue();
        }));

        it('should initialise showBackgroundFilter to false when user is individual', fakeAsync(() => {
            const individualProfile: UserProfileResponse = new UserProfileResponse({
                display_name: 'John Doe',
                first_name: 'John',
                last_name: 'Doe',
                role: Role.Individual
            });
            profileService.getUserProfile.and.returnValue(Promise.resolve(individualProfile));
            component.ngOnInit();
            flushMicrotasks();
            flush();
            expect(component.showBackgroundFilter).toBeFalse();
        }));

        it('should update selected cam', fakeAsync(() => {
            spyOn<any>(component, 'updateSelectedCamera').and.callThrough();

            component.availableCameraDevices = testData.getListOfCameras();
            component.ngOnInit();
            flushMicrotasks();
            activeVideoDeviceSubject.next(testData.getSelectedCamera());
            flush();
            expect(component['updateSelectedCamera']).toHaveBeenCalled();
            expect(component.selectedCameraDevice).toEqual(testData.getSelectedCamera());
        }));

        it('should update selected cam when filter has changed', fakeAsync(() => {
            spyOn<any>(component, 'updateSelectedCamera');

            component.availableCameraDevices = testData.getListOfCameras();
            component.ngOnInit();
            flushMicrotasks();
            filterChangedSubject.next(BackgroundFilter.HMCTS);
            flush();
            expect(component['updateSelectedCamera']).toHaveBeenCalled();
        }));

        it('should update selected mic', fakeAsync(() => {
            spyOn<any>(component, 'updateSelectedMicrophone').and.callThrough();

            component.availableCameraDevices = testData.getListOfCameras();
            component.ngOnInit();
            flushMicrotasks();
            activeMicrophoneDeviceSubject.next(testData.getSelectedMicphone());
            flush();
            expect(component['updateSelectedMicrophone']).toHaveBeenCalled();
            expect(component.selectedMicrophoneDevice).toEqual(testData.getSelectedMicphone());
        }));
    });

    it('should emit cancelled event onClose', async () => {
        spyOn(component.shouldClose, 'emit');
        component.onClose();
        expect(component.shouldClose.emit).toHaveBeenCalled();
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

    describe('It should use the upto date streams from user stream service', () => {
        beforeEach(() => {
            component.ngOnInit();
        });

        it('should update camera stream when activeCameraStream is emitted from userMediaService', fakeAsync(() => {
            // Act
            activeCameraStreamSubject.next(mockCamStream);
            flush();

            // Assert
            expect(component.selectedCameraStream).toBe(mockCamStream);
        }));

        it('should update microphone stream when activeMicrophoneStream is emitted from userMediaService', fakeAsync(() => {
            // Act
            activeMicrophoneStreamSubject.next(mockMicStream);
            flush();

            // Assert
            expect(component.selectedMicrophoneStream).toBe(mockMicStream);
        }));
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

    it('should have only one available camera device', async () => {
        component.availableCameraDevices = testData.getSingleCamera();
        expect(component.hasOnlyOneAvailableCameraDevice).toBeTrue();
    });

    it('should have only one available microphone device', async () => {
        component.availableMicrophoneDevices = testData.getSingleMicrophone();
        expect(component.hasOnlyOneAvailableMicrophoneDevice).toBeTrue();
    });
});
