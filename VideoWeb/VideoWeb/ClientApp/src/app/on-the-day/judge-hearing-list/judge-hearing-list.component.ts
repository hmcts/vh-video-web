import { Component, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ConferenceForUserResponse, UserProfileResponse } from 'src/app/services/clients/api-client';
import { ErrorService } from 'src/app/services/error.service';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { Router } from '@angular/router';
import { ProfileService } from 'src/app/services/api/profile.service';

@Component({
  selector: 'app-judge-hearing-list',
  templateUrl: './judge-hearing-list.component.html'
})

export class JudgeHearingListComponent implements OnInit {

  contact = {
    phone: '0300 303 0655'
  };

  conferences: ConferenceForUserResponse[];
  hearingListForm: FormGroup;
  loadingData: boolean;
  interval: any;
  today = new Date();
  profile: UserProfileResponse;

  constructor(
    private videoWebService: VideoWebService,
    private errorService: ErrorService,
    private router: Router,
    private profileService: ProfileService
  ) {
    this.loadingData = true;
  }

  ngOnInit() {
    this.profileService.getUserProfile().then((profile) => {
      this.profile = profile;
    });
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
      (error) => {
        this.loadingData = false;
        this.errorService.handleApiError(error);

      });
  }

  get courtName(): string {
    return (this.profile) ? `${this.profile.first_name}, ${this.profile.last_name}` : '';
    // if (this.profile) {
    //   return `${this.profile.first_name}, ${this.profile.last_name}`;
    // } else {
    //   return '';
    // }
  }

  hasHearings() {
    return this.conferences !== undefined && this.conferences.length > 0;
  }

  onConferenceSelected(conference: ConferenceForUserResponse) {
    this.router.navigate([PageUrls.JudgeWaitingRoom, conference.id]);
  }

  goToEquipmentCheck() {
    this.router.navigate([PageUrls.EquipmentCheck, this.conferences[0].id]);
  }
}
