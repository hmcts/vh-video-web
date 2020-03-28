import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProfileService } from '../services/api/profile.service';
import { UserProfileResponse, Role } from '../services/clients/api-client';
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
    ) { }

    ngOnInit() {
        this.profileService.getUserProfile()
            .then(profile => {
                if (profile.role === UserRole.Individual || profile.role === UserRole.Representative) {
                    this.navigateToHearingList(profile);
                } else {
                    if (this.deviceTypeService.isDesktop()) {
                        this.navigateToHearingList(profile);
                    } else {
                        this.router.navigate([PageUrls.SignonAComputer]);
                    }
                }
            })
            .catch(error => this.errorService.handleApiError(error));
    }

    navigateToHearingList(userProfile: UserProfileResponse) {
        if (userProfile.role === Role.Judge) {
            this.router.navigate([PageUrls.JudgeHearingList]);
        } else if (userProfile.role === Role.VideoHearingsOfficer) {
            this.router.navigate([PageUrls.AdminHearingList]);
        } else if (userProfile.role === Role.Representative || userProfile.role === Role.Individual) {
            this.router.navigate([PageUrls.ParticipantHearingList]);
        } else {
            this.router.navigate([PageUrls.Unauthorised]);
        }
    }
}
