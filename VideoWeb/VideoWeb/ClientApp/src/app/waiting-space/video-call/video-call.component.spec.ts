import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VideoCallComponent } from './video-call.component';
import { TranslatePipeMock } from 'src/app/testing/mocks/mock-translation-pipe';

describe('VideoCallComponent', () => {
    let component: VideoCallComponent;
    let fixture: ComponentFixture<VideoCallComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [VideoCallComponent, TranslatePipeMock]
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

    describe('participantsPanelToggled', () => {
        it('should emit event', () => {
            spyOn(component.participantsPanelToggle, 'emit');
            const panelName = 'PanelName';
            component.participantsPanelToggled(panelName);
            expect(component.participantsPanelToggle.emit).toHaveBeenCalledWith(panelName);
        });
    });

    describe('secondIncomingFeedClicked', () => {
        it('should emit event', () => {
            spyOn(component.feedToggle, 'emit');
            component.secondIncomingFeedClicked();
            expect(component.feedToggle.emit).toHaveBeenCalled();
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
});
