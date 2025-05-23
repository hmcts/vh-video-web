import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VideoCallComponent } from './video-call.component';
import { TranslatePipeMock } from 'src/app/testing/mocks/mock-translation-pipe';
import { DeviceTypeService } from 'src/app/services/device-type.service';
import { ParticipantHelper } from 'src/app/shared/participant-helper';
import { VideoCallEventsService } from '../services/video-call-events.service';

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
    const mockVideoCallEventsService = jasmine.createSpyObj('VideoCallEventsService', [
        'onVideoWrapperReady',
        'onLeaveConsultation',
        'onLockConsultationToggled',
        'onChangeDevice',
        'onChangeLanguageSelected',
        'onUnreadCountUpdated',
        'triggerVideoWrapperReady',
        'leaveConsultation',
        'toggleLockConsultation',
        'changeDevice',
        'changeLanguage',
        'updateUnreadCount'
    ]);

    beforeEach(async () => {
        mockDeviceTypeService.isSupportedBrowserForNetworkHealth.and.returnValue(true);

        await TestBed.configureTestingModule({
            declarations: [VideoCallComponent, TranslatePipeMock],
            providers: [
                { provide: DeviceTypeService, useValue: mockDeviceTypeService },
                { provide: VideoCallEventsService, useValue: mockVideoCallEventsService }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(VideoCallComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('videoWrapperReady', () => {
        it('should call service', () => {
            component.videoWrapperReady();
            expect(mockVideoCallEventsService.triggerVideoWrapperReady).toHaveBeenCalled();
        });
    });

    describe('leaveConsultationClicked', () => {
        it('should call service', () => {
            component.leaveConsultationClicked();
            expect(mockVideoCallEventsService.leaveConsultation).toHaveBeenCalled();
        });
    });

    describe('lockConsultationClicked', () => {
        const testCases = [true, false];

        testCases.forEach(test => {
            it(`should call service with value of ${test}`, () => {
                component.lockConsultationClicked(test);
                expect(mockVideoCallEventsService.toggleLockConsultation).toHaveBeenCalledWith(test);
            });
        });
    });

    describe('changeDeviceToggleClicked', () => {
        it('should call service', () => {
            component.changeDeviceToggleClicked();
            expect(mockVideoCallEventsService.changeDevice).toHaveBeenCalled();
        });
    });

    describe('changeLanguageSelected', () => {
        it('should call service', () => {
            component.changeLanguageSelected();
            expect(mockVideoCallEventsService.changeLanguage).toHaveBeenCalled();
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
        it('should call service', () => {
            const count = 2;
            component.unreadCountUpdated(count);
            expect(mockVideoCallEventsService.updateUnreadCount).toHaveBeenCalledWith(count);
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
