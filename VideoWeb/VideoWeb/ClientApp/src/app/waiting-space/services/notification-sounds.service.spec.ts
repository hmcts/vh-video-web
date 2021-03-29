import { MockLogger } from 'src/app/testing/mocks/mock-logger';
import { NotificationSoundsService } from './notification-sounds.service';

describe('NotificationSoundsService', () => {
    let service: NotificationSoundsService;
    let logger = new MockLogger();

    beforeEach(() => {
        logger = new MockLogger();
        service = new NotificationSoundsService(logger);
    });

    it('should init consulation request sound', () => {
        service.initConsultationRequestRingtone();
        expect(service.consultationRequestSound).toBeDefined();
    });

    it('should play sound again when ended', async () => {
        service.initConsultationRequestRingtone();
        const spy = spyOn(service.consultationRequestSound, 'play').and.resolveTo();

        service.consultationRequestSound.dispatchEvent(new Event('ended'));
        expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should start playing consulation request ringing sound', () => {
        const audio = new Audio();
        spyOn(audio, 'play').and.resolveTo();
        service.consultationRequestSound = audio;

        service.playConsultationRequestRingtone();

        expect(audio.play).toHaveBeenCalled();
    });

    it('should start catch error when playing consulation request ringing sound', async () => {
        const audio = new Audio();
        const spy = spyOn(logger, 'error');
        spyOn(audio, 'play').and.rejectWith(new Error('TestError, Permission not granted'));
        service.consultationRequestSound = audio;
        service.hearingAlertSound = audio;
        await service.playHearingAlertSound();

        expect(spy).toHaveBeenCalled();
    });

    it('should stop playing consulation request ringing sound', () => {
        const audio = new Audio();
        spyOn(audio, 'pause');
        audio.currentTime = 10;
        service.consultationRequestSound = audio;

        service.stopConsultationRequestRingtone();

        expect(audio.pause).toHaveBeenCalled();
        expect(audio.currentTime).toBe(0);
    });

    it('should init hearing starting sound', () => {
        service.initHearingAlertSound();
        expect(service.hearingAlertSound).toBeDefined();
        expect(service.hearingAlertPlayCount).toBe(1);
    });

    it('should init hearing starting sound on play if not already initialised', () => {
        const audio = new Audio();
        spyOn(audio, 'play').and.resolveTo();

        service.hearingAlertSound = undefined;
        spyOn(service, 'initHearingAlertSound').and.callFake(() => {
            service.hearingAlertSound = audio;
            service.hearingAlertPlayCount = 1;
        });
        service.playHearingAlertSound();
        expect(audio.play).toHaveBeenCalled();
    });

    it('should reset play count on play hearing sound', () => {
        const audio = new Audio();
        spyOn(audio, 'play').and.resolveTo();
        service.hearingAlertSound = audio;
        service.hearingAlertPlayCount = 4;
        service.playHearingAlertSound();
        expect(service.hearingAlertPlayCount).toBe(1);
    });

    it('should increment hearing sound play count on end and keep playing until third count', () => {
        service.initHearingAlertSound();
        const spy = spyOn(service.hearingAlertSound, 'play').and.resolveTo();
        service.hearingAlertSound.dispatchEvent(new Event('ended')); // first manual play
        service.hearingAlertSound.dispatchEvent(new Event('ended')); // auto replay 1
        service.hearingAlertSound.dispatchEvent(new Event('ended')); // auto replay 2
        service.hearingAlertSound.dispatchEvent(new Event('ended')); // should do nothing
        expect(spy).toHaveBeenCalledTimes(2);
    });

    it('should start playing hearing starting sound', () => {
        const audio = new Audio();
        spyOn(audio, 'play').and.resolveTo();
        service.hearingAlertSound = audio;
        service.hearingAlertPlayCount = 1;
        service.playHearingAlertSound();

        expect(audio.play).toHaveBeenCalled();
    });

    it('should start catch error when playing hearing starting sound', async () => {
        const audio = new Audio();
        const spy = spyOn(logger, 'error');
        spyOn(audio, 'play').and.rejectWith(new Error('TestError, Permission not granted'));
        service.hearingAlertSound = audio;
        service.hearingAlertPlayCount = 1;
        await service.playHearingAlertSound();

        expect(spy).toHaveBeenCalled();
    });

    it('should pause and reset play count when hearing starting sound is stopped', () => {
        const audio = new Audio();
        spyOn(audio, 'pause');
        audio.currentTime = 4;
        service.hearingAlertPlayCount = 4;
        service.hearingAlertSound = audio;

        service.stopHearingAlertSound();

        expect(audio.pause).toHaveBeenCalled();
        expect(audio.currentTime).toBe(0);
        expect(service.hearingAlertPlayCount).toBe(1);
    });
});
