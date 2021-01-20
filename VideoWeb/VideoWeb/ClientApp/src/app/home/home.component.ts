import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProfileService } from '../services/api/profile.service';
import { DeviceTypeService } from '../services/device-type.service';
import { ErrorService } from '../services/error.service';
import { pageUrls } from '../shared/page-url.constants';
import { UserProfileResponse, Role } from '../services/clients/api-client';

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
    ) {}

    ngOnInit() {
        if (this.deviceTypeService.isDesktop() || this.deviceTypeService.isTablet() || this.deviceTypeService.isMobile()) {
            this.profileService
                .getUserProfile()
                .then(profile => this.navigateToHearingList(profile))
                .catch(error => this.errorService.handleApiError(error));
        } else {
            this.router.navigate([pageUrls.UnsupportedDevice]);
        }
    }

    navigateToHearingList(userProfile: UserProfileResponse) {
        if (userProfile.role === Role.Judge) {
            this.router.navigate([pageUrls.JudgeHearingList]);
        } else if (userProfile.role === Role.VideoHearingsOfficer) {
            this.router.navigate([pageUrls.AdminVenueList]);
        } else if (
            userProfile.role === Role.Representative ||
            userProfile.role === Role.Individual ||
            userProfile.role === Role.JudicialOfficeHolder
        ) {
            this.router.navigate([pageUrls.ParticipantHearingList]);
        } else {
            this.router.navigate([pageUrls.Unauthorised]);
        }
    }
}
