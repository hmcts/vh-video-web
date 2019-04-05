import { Component, OnInit, NgZone } from '@angular/core';
import { VideoWebService } from 'src/app/services/video-web.service';
import { ConferenceForUserResponse, ConferenceResponse } from 'src/app/services/clients/api-client';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ServerSentEventsService } from 'src/app/services/server-sent-events.service';
import { ConsultationMessage } from 'src/app/services/models/consultation-message';
import { HelpMessage } from 'src/app/services/models/help-message';

@Component({
  selector: 'app-vho-hearings',
  templateUrl: './vho-hearings.component.html',
  styleUrls: ['./vho-hearings.component.css']
})
export class VhoHearingsComponent implements OnInit {

  selectedConferenceUrl: SafeResourceUrl;
  conferences: ConferenceForUserResponse[];
  selectedConference: ConferenceResponse;
  loadingData: boolean;
  interval: any;

  constructor(
    private videoWebService: VideoWebService,
    private eventService: ServerSentEventsService,
    private ngZone: NgZone,
    public sanitizer: DomSanitizer
  ) {
    this.loadingData = true;
  }

  ngOnInit() {
    this.setupSubscribers();
    this.retrieveHearingsForUser();
    this.interval = setInterval(() => {
      this.retrieveHearingsForUser();
    }, 30000);
  }

  retrieveHearingsForUser() {
    this.videoWebService.getConferencesForUser().subscribe((data: ConferenceForUserResponse[]) => {
      this.loadingData = false;
      this.conferences = data;
    },
      () => {
        this.loadingData = false;
      });
  }

  hasHearings() {
    return this.conferences !== undefined && this.conferences.length > 0;
  }

  displayAdminViewForConference(conference: ConferenceForUserResponse) {
    this.videoWebService.getConferenceById(conference.id)
      .subscribe((data: ConferenceResponse) => {
        this.selectedConference = data;
        this.sanitiseAndLoadIframe();
      });
  }

  getDuration(duration: number): string {
    const h = Math.floor(duration / 60);
    const m = duration % 60;
    const hours = h < 1 ? `${h} hours` : `${h} hour`;
    const minutes = `${m} minutes`;
    if (h > 0) {
      return `${hours} and ${minutes}`;
    } else {
      return `${minutes}`;
    }
  }

  private sanitiseAndLoadIframe() {
    const adminUri = this.selectedConference.admin_i_frame_uri;
    this.selectedConferenceUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      adminUri
    );
  }

  private setupSubscribers() {
    this.eventService.start();

    this.eventService.getConsultationMessage().subscribe(message => {
      this.ngZone.run(() => {
        this.handleConsultationMessage(message)
      });
    });

    this.eventService.getHelpMessage().subscribe(message => {
      this.ngZone.run(() => {
        this.handleHelpMessage(message);
      });
    });
  }

  handleConsultationMessage(message: ConsultationMessage): void {
    throw Error('Not Implemented');
  }

  handleHelpMessage(message: HelpMessage): void {
    throw Error('Not Implemented');
  }
}
