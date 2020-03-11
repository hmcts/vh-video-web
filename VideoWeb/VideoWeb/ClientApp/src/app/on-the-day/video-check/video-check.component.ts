import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AdalService } from 'adal-angular4';
import { SelfTestFailureReason } from 'src/app/services/clients/api-client';
import { ErrorService } from 'src/app/services/error.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { VideoWebService } from '../../services/api/video-web.service';
import { EquipmentCheckBaseComponent } from '../abstract/equipment-check-base.component';

@Component({
    selector: 'app-video-check',
    templateUrl: './video-check.component.html'
})
export class VideoCheckComponent extends EquipmentCheckBaseComponent implements OnInit {
    constructor(
        protected router: Router,
        protected route: ActivatedRoute,
        protected fb: FormBuilder,
        protected videoWebService: VideoWebService,
        protected adalService: AdalService,
        protected errorService: ErrorService,
        protected logger: Logger
    ) {
        super(router, route, fb, videoWebService, adalService, errorService, logger);
    }

    ngOnInit() {
        this.getConference();
        this.initForm();
    }

    getEquipmentCheck(): string {
        return 'Video';
    }

    getFailureReason(): SelfTestFailureReason {
        return SelfTestFailureReason.Video;
    }

    navigateToNextPage(): void {
        this.router.navigate([PageUrls.HearingRules, this.conferenceId]);
    }
}
