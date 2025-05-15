import { VideoCallEventsService } from './video-call-events.service';

describe('VideoCallEventsService', () => {
    let service: VideoCallEventsService;

    beforeEach(() => {
        service = new VideoCallEventsService();
    });

    describe('triggerVideoWrapperReady', () => {
        it('should emit event when called', done => {
            service.onVideoWrapperReady().subscribe(() => {
                expect(true).toBeTrue();
                done();
            });
            service.triggerVideoWrapperReady();
        });
    });

    describe('leaveConsultation', () => {
        it('should emit event when called', done => {
            service.onLeaveConsultation().subscribe(() => {
                expect(true).toBeTrue();
                done();
            });
            service.leaveConsultation();
        });
    });

    describe('toggleLockConsultation', () => {
        it('should emit event with correct value when called', done => {
            const lockState = true;
            service.onLockConsultationToggled().subscribe(lock => {
                expect(lock).toBe(lockState);
                done();
            });
            service.toggleLockConsultation(lockState);
        });
    });

    describe('changeDevice', () => {
        it('should emit event when called', done => {
            service.onChangeDevice().subscribe(() => {
                expect(true).toBeTrue();
                done();
            });
            service.changeDevice();
        });
    });
    describe('changeLanguage', () => {
        it('should emit event when called', done => {
            service.onChangeLanguageSelected().subscribe(() => {
                expect(true).toBeTrue();
                done();
            });
            service.changeLanguage();
        });
    });

    describe('updateUnreadCount', () => {
        it('should emit event with correct value when called', done => {
            const unreadCount = 5;
            service.onUnreadCountUpdated().subscribe(count => {
                expect(count).toBe(unreadCount);
                done();
            });
            service.updateUnreadCount(unreadCount);
        });
    });
});
