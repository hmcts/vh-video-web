import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProfileService } from '../../services/api/profile.service';
import { DeviceTypeService } from '../../services/device-type.service';
import { ErrorService } from '../../services/error.service';
import { pageUrls } from '../../shared/page-url.constants';
import { UserProfileResponse, Role } from '../../services/clients/api-client';
import { ConfigService } from 'src/app/services/api/config.service';
import { take } from 'rxjs/operators';

@Component({
    selector: 'app-navigator',
    templateUrl: './navigator.component.html'
})
export class NavigatorComponent implements OnInit {
    constructor(
        private router: Router,
        private profileService: ProfileService,
        private errorService: ErrorService,
        private deviceTypeService: DeviceTypeService,
        private configService: ConfigService
    ) {}

    ngOnInit() {
        this.configService
            .getClientSettings()
            .pipe(take(1))
            .subscribe(settings => {
                console.log('settings', settings);
                if (
                    this.deviceTypeService.isDesktop() ||
                    (this.deviceTypeService.isIOS() && this.deviceTypeService.isTablet() && settings.enable_ios_tablet_support) ||
                    (this.deviceTypeService.isIOS() && this.deviceTypeService.isMobile() && settings.enable_ios_mobile_support) ||
                    (this.deviceTypeService.isAndroid() && settings.enable_android_support)
                ) {
                    this.profileService
                        .getUserProfile()
                        .then(profile => this.navigateToHearingList(profile))
                        .catch(error => this.errorService.handleApiError(error));
                } else {
                    this.router.navigate([pageUrls.UnsupportedDevice]);
                }
            });
    }

    navigateToHearingList(userProfile: UserProfileResponse) {
        if (userProfile.role === Role.Judge || userProfile.role === Role.JudicialOfficeHolder) {
            this.router.navigate([pageUrls.JudgeHearingList]);
        } else if (userProfile.role === Role.StaffMember) {
            this.router.navigate([pageUrls.StaffMemberHearingList]);
        } else if (userProfile.role === Role.VideoHearingsOfficer) {
            this.router.navigate([pageUrls.AdminVenueList]);
        } else if (
            userProfile.role === Role.Representative ||
            userProfile.role === Role.Individual ||
            userProfile.role === Role.QuickLinkParticipant ||
            userProfile.role === Role.QuickLinkObserver
        ) {
            this.router.navigate([pageUrls.ParticipantHearingList]);
        } else {
            this.router.navigate([pageUrls.Unauthorised]);
        }
    }
}
