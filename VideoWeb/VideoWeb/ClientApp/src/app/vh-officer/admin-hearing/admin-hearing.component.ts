import { Component, Input, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Hearing } from 'src/app/shared/models/hearing';

@Component({
    selector: 'app-admin-hearing',
    templateUrl: './admin-hearing.component.html',
    styleUrls: ['./admin-hearing.component.scss']
})
export class AdminHearingComponent implements OnInit {
    @Input() hearing: Hearing;
    adminIframeUrl: SafeResourceUrl;
    constructor(public sanitizer: DomSanitizer) { }

    ngOnInit() {
        this.sanitiseAndLoadIframe();
    }

    private sanitiseAndLoadIframe() {
        const adminUri = this.hearing.getConference().admin_i_frame_uri;

        this.adminIframeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(adminUri);
    }
}
