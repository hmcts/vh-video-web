import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ConferenceForVhOfficerResponse, ConferenceStatus } from 'src/app/services/clients/api-client';
import { ClipboardService } from 'ngx-clipboard';
import { HearingSummary } from 'src/app/shared/models/hearing-summary';

@Component({
    selector: 'app-vho-hearing-list',
    templateUrl: './vho-hearing-list.component.html',
    styleUrls: ['./vho-hearing-list.component.scss']
})
export class VhoHearingListComponent implements OnInit {
    @Input() conferences: ConferenceForVhOfficerResponse[];
    @Output() selectedConference = new EventEmitter<ConferenceForVhOfficerResponse>();
    currentConference: ConferenceForVhOfficerResponse;

    constructor(private clipboardService: ClipboardService) {}

    ngOnInit() {}

    isCurrentConference(conference: ConferenceForVhOfficerResponse): boolean {
        return this.currentConference != null && this.currentConference.id === conference.id;
    }

    isOnTime(conference: ConferenceForVhOfficerResponse): boolean {
        return new HearingSummary(conference).isOnTime() || new HearingSummary(conference).isStarting();
    }

    isSuspended(conference: ConferenceForVhOfficerResponse): boolean {
        return conference.status === ConferenceStatus.Suspended;
    }

    isDelayed(conference: ConferenceForVhOfficerResponse): boolean {
        return new HearingSummary(conference).isDelayed();
    }

    isPaused(conference: ConferenceForVhOfficerResponse): boolean {
        return new HearingSummary(conference).isPaused();
    }

    isInSession(conference: ConferenceForVhOfficerResponse): boolean {
        return new HearingSummary(conference).isInSession();
    }

    isClosed(conference: ConferenceForVhOfficerResponse): boolean {
        return new HearingSummary(conference).isClosed();
    }

    getConferenceStatusText(conference: ConferenceForVhOfficerResponse): string {
        const hearing = new HearingSummary(conference);
        if (hearing.getConference().status === ConferenceStatus.NotStarted) {
            if (hearing.isDelayed()) {
                return 'Delayed';
            } else {
                return 'Not Started';
            }
        } else if (hearing.isSuspended()) {
            return 'Suspended';
        } else if (hearing.isPaused()) {
            return 'Paused';
        } else if (hearing.isClosed()) {
            return 'Closed';
        } else if (hearing.isInSession()) {
            return 'In Session';
        }
        return '';
    }

    getDuration(conference: ConferenceForVhOfficerResponse): string {
        return new HearingSummary(conference).getDurationAsText();
    }

    selectConference(conference: ConferenceForVhOfficerResponse) {
        this.currentConference = conference;
        this.selectedConference.emit(conference);
    }

    copyToClipboard(conference: ConferenceForVhOfficerResponse) {
        this.clipboardService.copyFromContent(conference.id);
    }
}
