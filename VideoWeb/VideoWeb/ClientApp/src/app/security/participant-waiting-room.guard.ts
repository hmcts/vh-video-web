import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { VideoWebService } from '../services/api/video-web.service';
import { Logger } from '../services/logging/logger-base';
import { pageUrls } from '../shared/page-url.constants';
import { SecurityServiceProvider } from './authentication/security-provider.service';
import { FeatureFlagService } from '../services/feature-flag.service';
import { AuthBaseConferenceGuard } from './auth-base-conference.guard';

@Injectable({
    providedIn: 'root'
})
export class ParticipantWaitingRoomGuard extends AuthBaseConferenceGuard {
    constructor(
        securityServiceProviderService: SecurityServiceProvider,
        protected router: Router,
        protected logger: Logger,
        protected featureFlagService: FeatureFlagService,
        videoWebService: VideoWebService
    ) {
        super(
            securityServiceProviderService,
            router,
            logger,
            featureFlagService,
            videoWebService,
            pageUrls.ParticipantHearingList,
            pageUrls.Logout,
            '[ParticipantWaitingRoomGuard]'
        );
    }
}
