import { Component, OnInit, OnDestroy } from '@angular/core';
import { Location } from '@angular/common';

@Component({
  selector: 'app-error',
  templateUrl: './error.component.html'
})
export class ErrorComponent implements OnInit, OnDestroy {

  returnTimeout: NodeJS.Timer;
  private readonly CALL_TIMEOUT = 30000;

  constructor(private location: Location) { }

  ngOnInit() {
    this.returnTimeout = setTimeout(async () => {
      this.location.back();
    }, this.CALL_TIMEOUT);
  }

  ngOnDestroy(): void {
    clearTimeout(this.returnTimeout);
  }

}
