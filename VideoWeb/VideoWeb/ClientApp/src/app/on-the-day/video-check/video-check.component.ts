import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SelfTestFailureReason } from 'src/app/services/clients/api-client';
import { ErrorService } from 'src/app/services/error.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { VideoWebService } from '../../services/api/video-web.service';
import { EquipmentCheckBaseComponentDirective } from '../abstract/equipment-check-base.component';
import { ParticipantStatusUpdateService } from 'src/app/services/participant-status-update.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-video-check',
    templateUrl: './video-check.component.html'
})
export class VideoCheckComponent extends EquipmentCheckBaseComponentDirective implements OnInit {
    backLinkText: string;
    backLinkPath: string;
    constructor(
        protected router: Router,
        protected route: ActivatedRoute,
        protected fb: FormBuilder,
        protected videoWebService: VideoWebService,
        protected errorService: ErrorService,
        protected logger: Logger,
        protected participantStatusUpdateService: ParticipantStatusUpdateService,
        protected translateService: TranslateService
    ) {
        super(router, route, fb, videoWebService, errorService, logger, participantStatusUpdateService);
    }

    ngOnInit() {
        this.getConference();
        this.initForm();
    }

    getEquipmentCheck(): string {
        return this.translateService.instant('video-check.video');
    }

    getFailureReason(): SelfTestFailureReason {
        return SelfTestFailureReason.Video;
    }

    navigateToNextPage(): void {
        this.router.navigate([pageUrls.HearingRules, this.conferenceId]);
    }
}
