import { Component, Input } from '@angular/core';
import { Hearing } from 'src/app/shared/models/hearing';

@Component({
  selector: 'app-hearing-status',
  templateUrl: './hearing-status.component.html',
  styleUrls: ['./hearing-status.component.scss']
})
export class HearingStatusComponent {

  @Input() hearing: Hearing;
  constructor() { }
}
