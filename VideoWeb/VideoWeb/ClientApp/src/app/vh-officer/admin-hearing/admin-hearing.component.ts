import { Component, OnInit, Input } from '@angular/core';
import { Hearing } from 'src/app/shared/models/hearing';
import { SafeResourceUrl, DomSanitizer } from '@angular/platform-browser';

@Component({
    selector: 'app-admin-hearing',
    templateUrl: './admin-hearing.component.html',
    styleUrls: ['./admin-hearing.component.scss']
})
export class AdminHearingComponent implements OnInit {
    @Input() hearing: Hearing;
    adminIframe: SafeResourceUrl;
    constructor(public sanitizer: DomSanitizer) {}

    ngOnInit() {
        this.sanitiseAndLoadIframe();
    }

    private sanitiseAndLoadIframe() {
        const adminUri = this.hearing.getConference().admin_i_frame_uri;

        this.adminIframe = this.sanitizer.bypassSecurityTrustResourceUrl(adminUri);
    }
}
