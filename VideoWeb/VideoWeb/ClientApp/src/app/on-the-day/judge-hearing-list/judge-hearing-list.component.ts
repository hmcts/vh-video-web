import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { ProfileService } from 'src/app/services/api/profile.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ConferenceForUserResponse, UserProfileResponse } from 'src/app/services/clients/api-client';
import { ErrorService } from 'src/app/services/error.service';
import { VhContactDetails } from 'src/app/shared/contact-information';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { Logger } from 'src/app/services/logging/logger-base';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-judge-hearing-list',
  templateUrl: './judge-hearing-list.component.html'
})

export class JudgeHearingListComponent implements OnInit, OnDestroy {

  contact = {
    phone: VhContactDetails.phone
  };

  conferences: ConferenceForUserResponse[];
  conferencesSubscription: Subscription;
  hearingListForm: FormGroup;
  loadingData: boolean;
  interval: any;
  today = new Date();
  profile: UserProfileResponse;

  constructor(
    private videoWebService: VideoWebService,
    private errorService: ErrorService,
    private router: Router,
    private profileService: ProfileService,
    private logger: Logger
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

  ngOnDestroy(): void {
    this.logger.debug('Clearing intervals and subscriptions for Judge/Clerk');
    clearInterval(this.interval);
    this.conferencesSubscription.unsubscribe();
  }

  retrieveHearingsForUser() {
    this.conferencesSubscription = this.videoWebService.getConferencesForJudge().subscribe((data: ConferenceForUserResponse[]) => {
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
  }

  hasHearings() {
    return this.conferences !== undefined && this.conferences.length > 0;
  }

  onConferenceSelected(conference: ConferenceForUserResponse) {
    this.logger.event('signing into judge waiting room', { conference: conference.id });
    this.router.navigate([PageUrls.JudgeWaitingRoom, conference.id]);
  }

  goToEquipmentCheck() {
    this.router.navigate([PageUrls.EquipmentCheck, this.conferences[0].id]);
  }
}
