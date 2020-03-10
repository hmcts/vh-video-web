import { Component, OnInit, Input } from '@angular/core';
import { ClockService } from 'src/app/services/clock.service';
import { Hearing } from '../../shared/models/hearing';

@Component({
    selector: 'app-analogue-clock',
    templateUrl: './analogue-clock.component.html',
    styleUrls: ['./analogue-clock.component.scss']
})
export class AnalogueClockComponent implements OnInit {
    @Input() hearing: Hearing;

    currentTime: Date;
    hourHand: HTMLElement;
    minuteHand: HTMLElement;
    secondHand: HTMLElement;

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

    private setCurrentTime(): void {
        // initialise ui
        this.hourHand = document.getElementById('hour-hand');
        this.minuteHand = document.getElementById('minute-hand');
        this.secondHand = document.getElementById('second-hand');

        const timeNow = new Date();
        this.updateClockUI(timeNow);
    }
    private updateClockUI(newTime: Date): void {
        const hour_as_degree = ((newTime.getUTCHours() + newTime.getUTCMinutes() / 60) / 12) * 360;
        const minute_as_degree = (newTime.getUTCMinutes() / 60) * 360;
        const second_as_degree = ((newTime.getUTCSeconds() + newTime.getUTCMilliseconds() / 1000) / 60) * 360;
        this.hourHand.style.transform = `rotate(${hour_as_degree}deg)`;
        this.minuteHand.style.transform = `rotate(${minute_as_degree}deg)`;
        this.secondHand.style.transform = `rotate(${second_as_degree}deg)`;
    }
}
