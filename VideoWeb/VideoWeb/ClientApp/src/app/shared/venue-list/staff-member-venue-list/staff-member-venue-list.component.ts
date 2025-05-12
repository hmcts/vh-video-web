import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { VhoQueryService } from 'src/app/vh-officer/services/vho-query-service.service';
import { pageUrls } from '../../page-url.constants';
import { VenueListComponentDirective } from '../venue-list.component';
import { ProfileService } from 'src/app/services/api/profile.service';
import { LaunchDarklyService } from '../../../services/launch-darkly.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
    standalone: false,
    selector: 'app-staff-member-venue-list',
    templateUrl: '../venue-list.component.html',
    styleUrls: ['../venue-list.component.scss']
})
export class StaffMemberVenueListComponent extends VenueListComponentDirective {
    constructor(
        protected videoWebService: VideoWebService,
        protected router: Router,
        protected vhoQueryService: VhoQueryService,
        protected logger: Logger,
        protected ldService: LaunchDarklyService,
        protected profileService: ProfileService,
        protected translateService: TranslateService
    ) {
        super(videoWebService, router, vhoQueryService, logger, ldService, profileService, translateService);
    }

    get showVhoSpecificContent(): boolean {
        return false;
    }

    goToHearingList() {
        this.router.navigateByUrl(pageUrls.StaffMemberHearingList);
    }
}
