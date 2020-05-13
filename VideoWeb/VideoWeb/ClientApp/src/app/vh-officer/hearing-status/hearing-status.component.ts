import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-hearing-status',
  templateUrl: './hearing-status.component.html',
  styleUrls: ['./hearing-status.component.scss']
})
export class HearingStatusComponent implements OnInit {

  @Input() conferenceStatus: string;
  status: string;
  constructor() { }

  ngOnInit() {
    this.status = this.conferenceStatus.toLowerCase();
  }
}
