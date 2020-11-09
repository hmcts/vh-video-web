import { Injectable } from '@angular/core';

@Injectable()
export class NotificationSoundsService {
    consultationRequestSound: HTMLAudioElement;
    hearingStartingAnnounced: boolean;
    currentPlayCount: number;
    hearingAlertSound: HTMLAudioElement;

    initConsultationRequestRingtone(): void {
        this.consultationRequestSound = new Audio();
        this.consultationRequestSound.src = '/assets/audio/consultation_request.mp3';
        this.consultationRequestSound.load();
        this.consultationRequestSound.addEventListener(
            'ended',
            function () {
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

    initHearingAlert() {
        this.hearingStartingAnnounced = false;
        this.currentPlayCount = 1;

        this.hearingAlertSound = new Audio();
        this.hearingAlertSound.src = '/assets/audio/hearing_starting_soon.mp3';
        this.hearingAlertSound.load();
        const self = this;
        this.hearingAlertSound.addEventListener(
            'ended',
            function () {
                self.currentPlayCount++;
                if (self.currentPlayCount <= 3) {
                    this.play();
                }
            },
            false
        );
    }
}
