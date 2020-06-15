import { NotificationSoundsService } from './notification-sounds.service';

describe('NotificationSoundsService', () => {
    let service: NotificationSoundsService;

    beforeEach(() => {
        service = new NotificationSoundsService();
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
});
