import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { NotificationSoundsService } from './notification-sounds.service';

describe('NotificationSoundsService', () => {
    let service: NotificationSoundsService;

    beforeEach(() => {
        service = new NotificationSoundsService(new MockLogger());
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
        spyOn(audio, 'play');
        service.consultationRequestSound = audio;

        service.playConsultationRequestRingtone();

        expect(audio.play).toHaveBeenCalled();
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
        spyOn(audio, 'play');

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
        spyOn(audio, 'play');
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
        spyOn(audio, 'play');
        service.hearingAlertSound = audio;
        service.hearingAlertPlayCount = 1;
        service.playHearingAlertSound();

        expect(audio.play).toHaveBeenCalled();
    });

    it('should start playing hearing starting sound', () => {
        const audio = new Audio();
        spyOn(audio, 'play');
        service.hearingAlertSound = audio;
        service.hearingAlertPlayCount = 1;
        service.playHearingAlertSound();

        expect(audio.play).toHaveBeenCalled();
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
