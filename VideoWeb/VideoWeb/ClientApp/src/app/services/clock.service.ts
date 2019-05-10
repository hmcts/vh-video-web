import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ClockServiceService {

  private clock: Observable<Date>;

  constructor() {
    this.clock = new Observable<Date>(function subscribe(subscriber) {
      setInterval(() => {
        subscriber.next(new Date());
      }, 1000);
    });
  }

  getClock(): Observable<Date> {
    return this.clock;
  }
}
