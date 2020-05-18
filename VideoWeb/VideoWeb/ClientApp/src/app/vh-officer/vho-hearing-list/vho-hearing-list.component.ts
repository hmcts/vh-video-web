import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ClipboardService } from 'ngx-clipboard';
import { ConferenceResponseVho } from 'src/app/services/clients/api-client';
import { Hearing } from 'src/app/shared/models/hearing';
import { HearingSummary } from 'src/app/shared/models/hearing-summary';
import { ParticipantSummary } from '../../shared/models/participant-summary';

@Component({
    selector: 'app-vho-hearing-list',
    templateUrl: './vho-hearing-list.component.html',
    styleUrls: ['./vho-hearing-list.component.scss', '../vho-global-styles.scss']
})
export class VhoHearingListComponent implements OnInit {
    @Input() conferences: HearingSummary[];
    @Output() selectedConference = new EventEmitter<HearingSummary>();

    currentConference: HearingSummary;

    constructor(private clipboardService: ClipboardService) {}

    ngOnInit() {}

    isCurrentConference(conference: HearingSummary): boolean {
        return this.currentConference != null && this.currentConference.id === conference.id;
    }

    getDuration(conference: HearingSummary): string {
        return conference.getDurationAsText();
    }

    selectConference(conference: HearingSummary) {
        this.currentConference = conference;
        this.selectedConference.emit(conference);
    }

    copyToClipboard(conference: HearingSummary) {
        this.clipboardService.copyFromContent(conference.id);
    }

    getParticipantsForConference(conference: HearingSummary): ParticipantSummary[] {
        return conference.getParticipants();
    }

    mapToHearing(conference: HearingSummary): Hearing {
        const hearing = new ConferenceResponseVho({ scheduled_date_time: conference.scheduledDateTime, status: conference.status });
        return new Hearing(hearing);
    }
}
