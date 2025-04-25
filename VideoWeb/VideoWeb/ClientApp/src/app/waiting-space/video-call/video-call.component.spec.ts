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

    describe('togglePanel', () => {
        const participantPanelName = 'Participants';
        const chatPanelName = 'Chat';

        it('should toggle panel from false to true', () => {
            // Arrange
            component.panelStates[participantPanelName] = false;
            component.panelStates[chatPanelName] = false;

            // Act
            component.togglePanel(participantPanelName);

            // Assert
            expect(component.panelStates.Participants).toBe(true);
            expect(component.panelStates.Chat).toBe(false);

            expect(component.areParticipantsVisible).toBeTrue();
        });

        it('should toggle panel from false to true and reset any existing true to false', () => {
            // Arrange
            component.panelStates[participantPanelName] = true;
            component.panelStates[chatPanelName] = false;

            // Act
            component.togglePanel(participantPanelName);

            // Assert
            expect(component.panelStates.Participants).toBe(false);
            expect(component.panelStates.Chat).toBe(false);
            expect(component.areParticipantsVisible).toBeFalse();
        });

        it('should toggle panel and chat panel should be visible', () => {
            // Arrange
            component.panelStates[participantPanelName] = true;
            component.panelStates[chatPanelName] = false;

            // Act
            component.togglePanel(chatPanelName);

            // Assert
            expect(component.panelStates.Participants).toBe(false);
            expect(component.panelStates.Chat).toBe(true);
            expect(component.areParticipantsVisible).toBeFalse();
        });
    });

    describe('isChatVisible', () => {
        it('should return true when chat panel is visible and IM is enabled', () => {
            component.panelStates['Chat'] = true;
            component.isIMEnabled = true;
            expect(component.isChatVisible).toBeTrue();
        });

        it('should return false when chat panel is not visible', () => {
            component.panelStates['Chat'] = false;
            component.isIMEnabled = true;
            expect(component.isChatVisible).toBeFalse();
        });

        it('should return false when IM is not enabled', () => {
            component.panelStates['Chat'] = true;
            component.isIMEnabled = false;
            expect(component.isChatVisible).toBeFalse();
        });
    });

    describe('areParticipantsVisible', () => {
        it('should return true when participants panel is visible', () => {
            component.panelStates['Participants'] = true;
            expect(component.areParticipantsVisible).toBeTrue();
        });

        it('should return false when participants panel is not visible', () => {
            component.panelStates['Participants'] = false;
            expect(component.areParticipantsVisible).toBeFalse();
        });
    });
});
