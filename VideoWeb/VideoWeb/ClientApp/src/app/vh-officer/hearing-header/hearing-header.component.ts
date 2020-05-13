import { Component, OnInit, Input } from '@angular/core';
import { ConferenceResponse } from 'src/app/services/clients/api-client';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { Logger } from 'src/app/services/logging/logger-base';

@Component({
  selector: 'app-hearing-header',
  templateUrl: './hearing-header.component.html',
  styleUrls: ['./hearing-header.component.scss']
})
export class HearingHeaderComponent implements OnInit {

  @Input() conferenceId: string;
  conference: ConferenceResponse;

  constructor(private videoWebService: VideoWebService, private logger: Logger) { }

  ngOnInit() {
    this.videoWebService
      .getConferenceByIdVHO(this.conferenceId)
      .then(response => (this.conference = response))
      .catch(err => this.logger.error(`Failed to get conference data for ${this.conferenceId}`, err));
  }
}
