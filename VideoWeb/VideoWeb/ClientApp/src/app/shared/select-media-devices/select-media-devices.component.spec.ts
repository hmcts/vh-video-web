import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { configureTestSuite } from 'ng-bullet';
import { UserMediaStreamService } from 'src/app/services/user-media-stream.service';
import { UserMediaService } from 'src/app/services/user-media.service';
import { MediaDeviceTestData } from 'src/app/testing/mocks/data/media-device-test-data';
import { MockUserMediaService } from 'src/app/testing/mocks/MockUserMediaService';
import { MicVisualiserStubComponent } from 'src/app/testing/stubs/mic-visualiser-stub';
import { SelectMediaDevicesComponent } from './select-media-devices.component';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { Logger } from 'src/app/services/logging/logger-base';


describe('SelectMediaDevicesComponent', () => {
  let component: SelectMediaDevicesComponent;
  let fixture: ComponentFixture<SelectMediaDevicesComponent>;
  let userMediaService: MockUserMediaService;
  const testData = new MediaDeviceTestData();

  let userMediaStreamServiceSpy: jasmine.SpyObj<UserMediaStreamService>;

  configureTestSuite(() => {
    userMediaStreamServiceSpy = jasmine.createSpyObj<UserMediaStreamService>('UserMediaStreamService',
      ['requestAccess', 'stopStream', 'getStreamForCam', 'getStreamForMic']);
    userMediaStreamServiceSpy.requestAccess.and.returnValue(true);

    TestBed.configureTestingModule({
      imports: [
        FormsModule,
        ReactiveFormsModule
      ],
      providers: [
        { provide: UserMediaService, useClass: MockUserMediaService },
        { provide: UserMediaStreamService, useValue: userMediaStreamServiceSpy },
        { provide: Logger, useClass: MockLogger }
      ],
      declarations: [SelectMediaDevicesComponent, MicVisualiserStubComponent]
    });
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectMediaDevicesComponent);
    component = fixture.componentInstance;
    userMediaService = TestBed.get(UserMediaService);
    fixture.detectChanges();
  });

  it('should initialise the device form', async(() => {
    fixture.detectChanges();
    fixture.whenStable().then(() => {
      expect(component.selectedMediaDevicesForm).toBeDefined();
      expect(component.selectedMediaDevicesForm.valid).toBeTruthy();
    });
  }));

  it('should return true when only one camera is available', () => {
    component.availableCameraDevices = testData.getSingleCamera();
    expect(component.hasSingleCameraConncted).toBeTruthy();
    expect(component.singleCameraName).toBeDefined();
  });

  it('should return true when multiple cameras are available', () => {
    expect(component.hasSingleCameraConncted).toBeFalsy();
  });

  it('should return true when only one micrpphone is available', () => {
    component.availableMicrophoneDevices = testData.getSingleMicrophone();
    expect(component.hasSingleMicrophoneConncted).toBeTruthy();
    expect(component.singleMicrophoneName).toBeDefined();
  });

  it('should return true when multiple microphones are available', () => {
    expect(component.hasSingleMicrophoneConncted).toBeFalsy();
  });

  it('should emit cancelled event', async(() => {
    spyOn(component.cancelMediaDeviceChange, 'emit');

    fixture.whenStable().then(() => {
      expect(component.cancelMediaDeviceChange.emit).toHaveBeenCalled();
    });
    component.onCancel();
  }));

  it('should not emit device updated event when form is invalid', () => {
    spyOn(component.acceptMediaDeviceChange, 'emit');
    fixture.whenStable().then(() => {
      component.selectedMediaDevicesForm.setValue({ camera: '', microphone: '' });
      component.onSubmit();
    }).then(() => {
      expect(component.acceptMediaDeviceChange.emit).toHaveBeenCalledTimes(0);
    });
  });

  it('should emit device updated event when form is valid', () => {
    spyOn(component.acceptMediaDeviceChange, 'emit');
    fixture.whenStable().then(() => {
      component.onSubmit();
    }).then(() => {
      expect(component.acceptMediaDeviceChange.emit).toHaveBeenCalled();
    });
  });
});
