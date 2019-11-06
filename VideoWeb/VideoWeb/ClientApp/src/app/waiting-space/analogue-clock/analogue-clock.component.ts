import { Component, OnInit, Input } from '@angular/core';
import { ClockService } from 'src/app/services/clock.service';
import { Hearing } from '../../shared/models/hearing';
import * as moment from 'moment';

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

  constructor(
    private clockService: ClockService
  ) { }

  ngOnInit() {
    this.setCurrentTime();

    this.hourHand = document.getElementById('hour-hand');
    this.minuteHand = document.getElementById('minute-hand');
    this.secondHand = document.getElementById('second-hand');
    this.clockService.getClock().subscribe((time) => {
      this.currentTime = time;
      this.updateclock();
    });
  }

  updateclock() {
    if (!this.hearing) {
      return;
    }
    const hour_as_degree = (this.currentTime.getHours() + this.currentTime.getMinutes() / 60) / 12 * 360;
    const minute_as_degree = this.currentTime.getMinutes() / 60 * 360;
    const second_as_degree = (this.currentTime.getSeconds() + this.currentTime.getMilliseconds() / 1000) / 60 * 360;
    this.hourHand.style.transform = `rotate(${hour_as_degree}deg)`;
    this.minuteHand.style.transform = `rotate(${minute_as_degree}deg)`;
    this.secondHand.style.transform = `rotate(${second_as_degree}deg)`;
  }

  private setCurrentTime(): void {
    // initialise ui
    this.hourHand = document.getElementById('hour-hand');
    this.minuteHand = document.getElementById('minute-hand');
    this.secondHand = document.getElementById('second-hand');

    // get utc time now.
    const timeNow = moment.utc();
    const init_hour_as_degree = (timeNow.hour() + timeNow.minute() / 60) / 12 * 360;
    const init_minute_as_degree = timeNow.minute() / 60 * 360;
    const init_second_as_degree = (timeNow.second() + timeNow.millisecond() / 1000) / 60 * 360;

    // set the time.
    this.hourHand.style.transform = `rotate(${init_hour_as_degree}deg)`;
    this.minuteHand.style.transform = `rotate(${init_minute_as_degree}deg)`;
    this.secondHand.style.transform = `rotate(${init_second_as_degree}deg)`;
  }
}
