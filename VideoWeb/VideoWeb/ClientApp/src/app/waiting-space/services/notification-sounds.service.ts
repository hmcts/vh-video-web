import { Injectable } from '@angular/core';
import { Logger } from 'src/app/services/logging/logger-base';

@Injectable()
export class NotificationSoundsService {
    consultationRequestSound: HTMLAudioElement;
    hearingStartingAnnounced: boolean;
    hearingAlertSound: HTMLAudioElement;
    hearingAlertPlayCount: number;

    private readonly loggerPrefix = '[NotificationSoundsService] -';

    constructor(private logger: Logger) {}

    async initConsultationRequestRingtone() {
        this.consultationRequestSound = new Audio();
        const response = await fetch('/assets/audio/consultation_request.txt');
        this.consultationRequestSound.src = `data:audio/mpeg;base64,${await response.text()}`;
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
        await this.consultationRequestSound.play().catch(err => {
            this.logger.error(`${this.loggerPrefix} failed to play consultation request ringtone`, err, {
                errorMessage: this.consultationRequestSound.error
            });
        });
    }

    stopConsultationRequestRingtone() {
        this.consultationRequestSound.pause();
        this.consultationRequestSound.currentTime = 0;
    }

    async playHearingAlertSound() {
        if (!this.hearingAlertSound) {
            await this.initHearingAlertSound();
        }
        if (this.hearingAlertPlayCount >= 3) {
            this.hearingAlertPlayCount = 1;
        }
        this.logger.debug(`${this.loggerPrefix} playing hearing starting sound`);
        return this.hearingAlertSound.play().catch(err => {
            this.logger.error(`${this.loggerPrefix} failed to play hearing alert sound`, err, {
                errorMessage: this.hearingAlertSound.error
            });
        });
    }

    stopHearingAlertSound() {
        this.hearingAlertSound.pause();
        this.hearingAlertSound.currentTime = 0;
        this.hearingAlertPlayCount = 1;
    }

    async initHearingAlertSound() {
        this.hearingAlertPlayCount = 1;
        this.hearingAlertSound = new Audio();
        const response = await fetch('/assets/audio/hearing_starting_soon.txt');
        this.hearingAlertSound.src = `data:audio/mpeg;base64,${await response.text()}`;
        this.hearingAlertSound.load();
        const self = this;
        this.hearingAlertSound.addEventListener(
            'ended',
            function () {
                self.hearingAlertPlayCount++;
                if (self.hearingAlertPlayCount <= 3) {
                    this.play();
                }
            },
            false
        );
    }
}
