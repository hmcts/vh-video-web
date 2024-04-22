import { Component, Input, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Hearing } from 'src/app/shared/models/hearing';
import { FEATURE_FLAGS, LaunchDarklyService } from '../../services/launch-darkly.service';

@Component({
    selector: 'app-admin-hearing',
    templateUrl: './admin-hearing.component.html',
    styleUrls: ['./admin-hearing.component.scss']
})
export class AdminHearingComponent implements OnInit {
    @Input() hearing: Hearing;
    adminIframeUrl: SafeResourceUrl;
    vhoVodafoneFeatureFlag: boolean;
    constructor(
        public sanitizer: DomSanitizer,
        private ldService: LaunchDarklyService
    ) {}

    ngOnInit() {
        this.ldService.getFlag<boolean>(FEATURE_FLAGS.vodafone, false).subscribe(value => {
            this.vhoVodafoneFeatureFlag = value;
        });
        this.sanitiseAndLoadIframe();
    }

    private sanitiseAndLoadIframe() {
        const adminUri = this.hearing.getConference().admin_i_frame_uri;

        this.adminIframeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(adminUri);
    }
}
