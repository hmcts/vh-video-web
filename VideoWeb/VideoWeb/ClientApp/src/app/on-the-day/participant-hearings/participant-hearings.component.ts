import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import {
  ConferenceForUserResponse,
  UserProfileResponse,
} from 'src/app/services/clients/api-client';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ErrorService } from 'src/app/services/error.service';
import { Subscription } from 'rxjs';
import { ProfileService } from '../../services/api/profile.service';
import { PageUrls } from '../../shared/page-url.constants';
import { Router } from '@angular/router';

@Component({
  selector: 'app-participant-hearings',
  templateUrl: './participant-hearings.component.html',
  styleUrls: ['./participant-hearings.component.css'],
})
export class ParticipantHearingsComponent implements OnInit, OnDestroy {
  conferences: ConferenceForUserResponse[];
  conferencesSubscription: Subscription;
  loadingData: boolean;
  interval: any;
  errorCount: number;
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
    this.profileService.getUserProfile().then(profile => {
      this.profile = profile;
    });
    this.errorCount = 0;
    this.retrieveHearingsForUser();
    this.interval = setInterval(() => {
      this.retrieveHearingsForUser();
    }, 30000);
  }

  @HostListener('window:beforeunload')
  ngOnDestroy(): void {
    clearInterval(this.interval);
    this.conferencesSubscription.unsubscribe();
  }

  retrieveHearingsForUser() {
    this.conferencesSubscription = this.videoWebService
      .getConferencesForIndividual()
      .subscribe(
        (data: ConferenceForUserResponse[]) => {
          this.errorCount = 0;
          this.loadingData = false;
          this.conferences = data;
        },
        error => {
          this.errorCount++;
          this.loadingData = false;
          if (this.errorCount > 3) {
            this.errorService.handleApiError(error);
          } else {
            this.errorService.handleApiError(error, true);
          }
        }
      );
  }

  hasHearings() {
    return this.conferences !== undefined && this.conferences.length > 0;
  }

  goToEquipmentCheck() {
    this.router.navigate([PageUrls.EquipmentCheck]);
  }
}
