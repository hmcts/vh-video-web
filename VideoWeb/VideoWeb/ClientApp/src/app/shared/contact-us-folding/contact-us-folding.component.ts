import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ConferenceResponse } from 'src/app/services/clients/api-client';
import { VhContactDetails } from 'src/app/shared/contact-information';
import { ErrorService } from 'src/app/services/error.service';

@Component({
    selector: 'app-contact-us-folding',
    templateUrl: './contact-us-folding.component.html'
})
export class ContactUsFoldingComponent implements OnInit {
    private conference: ConferenceResponse;
    expanded: boolean;

    contact = {
        phone: VhContactDetails.phone,
        email: VhContactDetails.adminEmail
    };

    constructor(private route: ActivatedRoute, private videoWebService: VideoWebService, private errorService: ErrorService) {}

    ngOnInit() {
        const conferenceId = this.route.snapshot.paramMap.get('conferenceId');
        if (conferenceId) {
            this.getConference(conferenceId);
        }
    }

    getConference(conferenceId: string): void {
        this.videoWebService.getConferenceById(conferenceId).subscribe(
            conference => (this.conference = conference),
            error => {
                if (!this.errorService.returnHomeIfUnauthorised(error)) {
                    this.errorService.handleApiError(error);
                }
            }
        );
    }

    get caseNumber(): string {
        if (this.conference == null) {
            return '';
        } else {
            return this.conference.case_number;
        }
    }

    toggle() {
        this.expanded = !this.expanded;
    }
}
