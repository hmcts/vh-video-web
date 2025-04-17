import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VideoCallComponent } from './video-call.component';
import { TranslatePipeMock } from 'src/app/testing/mocks/mock-translation-pipe';
import { DeviceTypeService } from 'src/app/services/device-type.service';
import { ParticipantHelper } from 'src/app/shared/participant-helper';

describe('VideoCallComponent', () => {
    let component: VideoCallComponent;
    let fixture: ComponentFixture<VideoCallComponent>;
    const mockDeviceTypeService = jasmine.createSpyObj<DeviceTypeService>('DeviceTypeService', [
        'getBrowserName',
        'getBrowserVersion',
        'isSupportedBrowser',
        'isIpad',
        'isIphone',
        'isTablet',
        'isSupportedBrowserForNetworkHealth'
    ]);

    beforeEach(async () => {
        mockDeviceTypeService.isSupportedBrowserForNetworkHealth.and.returnValue(true);

        await TestBed.configureTestingModule({
            declarations: [VideoCallComponent, TranslatePipeMock],
            providers: [{ provide: DeviceTypeService, useValue: mockDeviceTypeService }]
        }).compileComponents();

        fixture = TestBed.createComponent(VideoCallComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('videoWrapperReady', () => {
        it('should emit event', () => {
            spyOn(component.ready, 'emit');
            component.videoWrapperReady();
            expect(component.ready.emit).toHaveBeenCalled();
        });
    });

    describe('leaveConsultationClicked', () => {
        it('should emit event', () => {
            spyOn(component.leaveConsultation, 'emit');
            component.leaveConsultationClicked();
            expect(component.leaveConsultation.emit).toHaveBeenCalled();
        });
    });

    describe('lockConsultationClicked', () => {
        it('should emit event of true', () => {
            spyOn(component.consultationLockToggle, 'emit');
            const value = true;
            component.lockConsultationClicked(value);
            expect(component.consultationLockToggle.emit).toHaveBeenCalledWith(value);
        });

        it('should emit event of false', () => {
            spyOn(component.consultationLockToggle, 'emit');
            const value = false;
            component.lockConsultationClicked(value);
            expect(component.consultationLockToggle.emit).toHaveBeenCalledWith(value);
        });
    });

    describe('changeDeviceToggleClicked', () => {
        it('should emit event', () => {
            spyOn(component.deviceToggle, 'emit');
            component.changeDeviceToggleClicked();
            expect(component.deviceToggle.emit).toHaveBeenCalled();
        });
    });

    describe('changeLanguageSelected', () => {
        it('should emit event', () => {
            spyOn(component.languageChange, 'emit');
            component.changeLanguageSelected();
            expect(component.languageChange.emit).toHaveBeenCalled();
        });
    });

    describe('panelToggled', () => {
        it('should emit event', () => {
            spyOn(component.panelToggle, 'emit');
            const panelName = 'PanelName';
            component.panelToggled(panelName);
            expect(component.panelToggle.emit).toHaveBeenCalledWith(panelName);
        });
    });

    describe('switchStreamWindows', () => {
        it('should toggle streamInMain', () => {
            component.streamInMain = false;
            component.switchStreamWindows();
            expect(component.streamInMain).toBeTrue();

            component.switchStreamWindows();
            expect(component.streamInMain).toBeFalse();
        });
    });

    describe('unreadCountUpdated', () => {
        it('should emit event', () => {
            spyOn(component.unreadCountUpdate, 'emit');
            const count = 2;
            component.unreadCountUpdated(count);
            expect(component.unreadCountUpdate.emit).toHaveBeenCalledWith(count);
        });
    });

    describe('isSupportedBrowserForNetworkHealth', () => {
        const testCases = [true, false];

        testCases.forEach(test => {
            it(`should return ${test} when device type service returns ${test}`, () => {
                mockDeviceTypeService.isSupportedBrowserForNetworkHealth.and.returnValue(test);
                const result = component.isSupportedBrowserForNetworkHealth;
                expect(result).toBe(test);
            });
        });
    });

    describe('isJohRoom', () => {
        const testCases = [true, false];

        testCases.forEach(test => {
            it(`should return ${test} when helper returns ${test}`, () => {
                spyOn(ParticipantHelper, 'isInJohRoom').and.returnValue(test);
                const result = component.isJohRoom;
                expect(result).toBe(test);
            });
        });
    });

    describe('userIsHost', () => {
        const testCases = [true, false];

        testCases.forEach(test => {
            it(`should return ${test} when helper returns ${test}`, () => {
                spyOn(ParticipantHelper, 'isHost').and.returnValue(test);
                const result = component.userIsHost;
                expect(result).toBe(test);
            });
        });
    });
});
