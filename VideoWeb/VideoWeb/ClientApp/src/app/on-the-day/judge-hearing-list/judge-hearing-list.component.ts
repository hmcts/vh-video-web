import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { ProfileService } from 'src/app/services/api/profile.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import {
  ConferenceForUserResponse, UserProfileResponse,
  UpdateParticipantStatusEventRequest, EventType
} from 'src/app/services/clients/api-client';
import { ErrorService } from 'src/app/services/error.service';
import { VhContactDetails } from 'src/app/shared/contact-information';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { Logger } from 'src/app/services/logging/logger-base';
import { Subscription } from 'rxjs';
import { SessionStorage } from 'src/app/services/session-storage';
import { EventStatusModel } from 'src/app/services/models/event-status.model';

import * as $ from 'jquery';

@Component({
  selector: 'app-judge-hearing-list',
  templateUrl: './judge-hearing-list.component.html',
  styleUrls: ['./judge-hearing-list.component.scss']
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
  private readonly eventStatusCache: SessionStorage<EventStatusModel>;
  readonly JUDGE_STATUS_KEY = 'vh.judge.status';
  $pushEventSubcription: Subscription;

  constructor(
    private videoWebService: VideoWebService,
    private errorService: ErrorService,
    private router: Router,
    private profileService: ProfileService,
    private logger: Logger,
  ) {
    this.loadingData = true;
    this.eventStatusCache = new SessionStorage(this.JUDGE_STATUS_KEY);
  }

  ngOnInit() {
    this.profileService.getUserProfile().then((profile) => {
      this.profile = profile;
    });
    this.postJudgeEvent();
    this.retrieveHearingsForUser();
    this.interval = setInterval(() => {
      this.retrieveHearingsForUser();
    }, 30000);
  }

  @HostListener('window:beforeunload')
  ngOnDestroy(): void {
    this.logger.debug('Clearing intervals and subscriptions for Judge/Clerk');
    clearInterval(this.interval);
    this.conferencesSubscription.unsubscribe();
    if (this.$pushEventSubcription) {
      this.$pushEventSubcription.unsubscribe();
    }
    this.enableFullScreen(false);
  }

  retrieveHearingsForUser() {
    this.conferencesSubscription = this.videoWebService.getConferencesForJudge().subscribe((data: ConferenceForUserResponse[]) => {
      this.loadingData = false;
      this.conferences = data;
      if (this.conferences.length > 0) {
        this.enableFullScreen(true);
      }
    },
      (error) => {
        this.loadingData = false;
        this.enableFullScreen(false);
        this.errorService.handleApiError(error);
      });
  }

  postJudgeEvent() {
    const eventStatusDetails = this.eventStatusCache.get();
    if (eventStatusDetails) {
      this.$pushEventSubcription = this.videoWebService.raiseParticipantEvent(eventStatusDetails.ConferenceId,
        new UpdateParticipantStatusEventRequest({
          participant_id: eventStatusDetails.ParticipantId, event_type: EventType.JudgeUnavailable
        })).subscribe(x => { this.eventStatusCache.clear(); },
          (error) => {
            console.error(error);
          });
    }
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
    this.router.navigate([PageUrls.EquipmentCheck]);
  }

  enableFullScreen(fullScreen: boolean) {
    const masterContainerCount = $('div[id*=\'master-container\']').length;
    if (masterContainerCount > 1) {
      throw new Error('Multiple master containers in DOM');
    }

    const masterContainer = document.getElementById('master-container');
    if (!masterContainer) {
      return;
    }

    if (fullScreen) {
      masterContainer.classList.add('fullscreen');
    } else {
      masterContainer.classList.remove('fullscreen');
    }
  }
}
