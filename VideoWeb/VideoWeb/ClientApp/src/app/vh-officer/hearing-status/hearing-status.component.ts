import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-hearing-status',
  templateUrl: './hearing-status.component.html',
  styleUrls: ['./hearing-status.component.scss']
})
export class HearingStatusComponent implements OnInit {

  @Input() hearingStatus: string;
  status: string;
  constructor() { }

  ngOnInit() {
    this.status = this.hearingStatus.toLowerCase();
  }
}
