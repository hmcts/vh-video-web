import { Component, OnInit, Input, ViewChild, ElementRef } from '@angular/core';
import { ClockService } from 'src/app/services/clock.service';
import { Hearing } from '../../shared/models/hearing';

@Component({
    selector: 'app-analogue-clock',
    templateUrl: './analogue-clock.component.html',
    styleUrls: ['./analogue-clock.component.scss']
})
export class AnalogueClockComponent implements OnInit {
    @Input() hearing: Hearing;
    @Input() isWitness: boolean;
    @Input() isJudicialOfficeHolder = false;

    @ViewChild('hourHand') hourHand: ElementRef;
    @ViewChild('minuteHand') minuteHand: ElementRef;
    @ViewChild('secondHand') secondHand: ElementRef;

    currentTime: Date;

    constructor(private clockService: ClockService) {}

    ngOnInit() {
        this.setCurrentTime();

        this.clockService.getClock().subscribe(time => {
            this.currentTime = time;
            this.updateclock();
        });
    }

    updateclock() {
        if (!this.hearing) {
            return;
        }
        this.updateClockUI(this.currentTime);
    }

    get isOnTime() {
        return (
            (this.isWitness && this.hearing.isStarting()) ||
            this.hearing.isOnTime() ||
            this.hearing.isPaused() ||
            this.hearing.isClosed() ||
            (this.isWitness && this.hearing.isDelayed()) ||
            (this.isJudicialOfficeHolder && !this.hearing.isSuspended())
        );
    }

    get isDelayed() {
        return (!this.isWitness && !this.isJudicialOfficeHolder && this.hearing.isDelayed()) || this.hearing.isSuspended();
    }

    get isStarting() {
        return (!this.isWitness && !this.isJudicialOfficeHolder && this.hearing.isStarting()) || this.hearing.isInSession();
    }

    private setCurrentTime(): void {
        const timeNow = new Date();
        this.updateClockUI(timeNow);
    }

    private updateClockUI(newTime: Date): void {
        if (this.hourHand && this.minuteHand && this.secondHand) {
            const hourAsDegree = ((newTime.getHours() + newTime.getHours() / 60) / 12) * 360;
            const minuteAsDegree = (newTime.getMinutes() / 60) * 360;
            const secondAsDegree = (newTime.getSeconds() / 60) * 360;
            this.hourHand.nativeElement.style.transform = `rotate(${hourAsDegree}deg)`;
            this.minuteHand.nativeElement.style.transform = `rotate(${minuteAsDegree}deg)`;
            this.secondHand.nativeElement.style.transform = `rotate(${secondAsDegree}deg)`;
        }
    }
}
