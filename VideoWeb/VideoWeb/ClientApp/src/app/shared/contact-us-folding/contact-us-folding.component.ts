import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ConferenceResponse } from 'src/app/services/clients/api-client';
import { VideoWebService } from 'src/app/services/api/video-web.service';

@Component({
  selector: 'app-contact-us-folding',
  templateUrl: './contact-us-folding.component.html',
  styleUrls: ['./contact-us-folding.component.css']
})
export class ContactUsFoldingComponent implements OnInit {

  private conference: ConferenceResponse;

  contact = {
    phone: '0300 303 0655',
    email: 'admin@videohearings.hmcts.net'
  };

  constructor(
    private route: ActivatedRoute,
    private videoWebService: VideoWebService
  ) { }

  ngOnInit() {
    const conferenceId = this.route.snapshot.paramMap.get('conferenceId');
    if (conferenceId) {
      this.getConference(conferenceId);
    }
  }

  getConference(conferenceId: string): void {
    this.videoWebService.getConferenceById(conferenceId)
      .subscribe((data: ConferenceResponse) => {
        this.conference = data;
      });
  }

  get caseNumber(): string {
    if (this.conference == null) {
      return '';
    } else {
      return this.conference.case_number;
    }
  }
}
