import { Injectable } from '@angular/core';

@Injectable()
export class NotificationSoundsService {
    consultationRequestSound: HTMLAudioElement;

    initConsultationRequestRingtone(): void {
        this.consultationRequestSound = new Audio();
        this.consultationRequestSound.src = '/assets/audio/consultation_request.mp3';
        this.consultationRequestSound.load();
        this.consultationRequestSound.addEventListener(
            'ended',
            function () {
                console.log('ended sound');
                this.play();
            },
            false
        );
    }

    async playConsultationRequestRingtone() {
        await this.consultationRequestSound.play();
    }

    stopConsultationRequestRingtone() {
        this.consultationRequestSound.pause();
        this.consultationRequestSound.currentTime = 0;
    }
}
