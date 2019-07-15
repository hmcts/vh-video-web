import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ConferenceResponse } from 'src/app/services/clients/api-client';
import { VhContactDetails } from 'src/app/shared/contact-information';

@Component({
  selector: 'app-contact-us-folding',
  templateUrl: './contact-us-folding.component.html',
  styleUrls: ['./contact-us-folding.component.css']
})
export class ContactUsFoldingComponent implements OnInit {

  private conference: ConferenceResponse;
  expanded: boolean;

  contact = {
    phone: VhContactDetails.phone,
    email: VhContactDetails.adminEmail
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

  toggle() {
    this.expanded = !this.expanded;
  }
}
