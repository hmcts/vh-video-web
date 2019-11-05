import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProfileService } from '../services/api/profile.service';
import { UserProfileResponse, UserRole } from '../services/clients/api-client';
import { DeviceTypeService } from '../services/device-type.service';
import { ErrorService } from '../services/error.service';
import { PageUrls } from '../shared/page-url.constants';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit {

  constructor(
    private router: Router,
    private profileService: ProfileService,
    private errorService: ErrorService,
    private deviceTypeService: DeviceTypeService
  ) {
  }

  ngOnInit() {
    if (this.deviceTypeService.isDesktop()) {
      this.profileService.getUserProfile()
        .then((profile) => this.navigateToHearingList(profile))
        .catch((error) => this.errorService.handleApiError(error));
    } else {
      this.router.navigate([PageUrls.SignonAComputer]);
    }
  }

  navigateToHearingList(userProfile: UserProfileResponse) {
    if (userProfile.role === UserRole.Judge) {
      this.router.navigate([PageUrls.JudgeHearingList]);
    } else if (userProfile.role === UserRole.VideoHearingsOfficer) {
      this.router.navigate([PageUrls.AdminHearingList]);
    } else if (userProfile.role === UserRole.Individual || userProfile.role === UserRole.Representative) {
      this.router.navigate([PageUrls.ParticipantHearingList]);
    } else {
      this.router.navigate([PageUrls.Unauthorised]);
    }
  }
}
