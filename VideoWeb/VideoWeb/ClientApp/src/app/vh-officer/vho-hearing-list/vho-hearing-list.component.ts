import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ConferenceStatus } from 'src/app/services/clients/api-client';
import { ClipboardService } from 'ngx-clipboard';
import { HearingSummary } from 'src/app/shared/models/hearing-summary';
import { ParticipantSummary } from '../../shared/models/participant-summary';
import { PerfectScrollbarConfigInterface } from 'ngx-perfect-scrollbar';

@Component({
    selector: 'app-vho-hearing-list',
    templateUrl: './vho-hearing-list.component.html',
    styleUrls: ['./vho-hearing-list.component.scss', '../vho-global-styles.scss']
})
export class VhoHearingListComponent implements OnInit {
    @Input() conferences: HearingSummary[];
    @Output() selectedConference = new EventEmitter<HearingSummary>();
    @Output() selectedParticipant = new EventEmitter<any>();
    currentConference: HearingSummary;

    scrollConfig: PerfectScrollbarConfigInterface = {
        suppressScrollX: true
    };

    constructor(private clipboardService: ClipboardService) {}

    ngOnInit() {}

    isCurrentConference(conference: HearingSummary): boolean {
        return this.currentConference != null && this.currentConference.id === conference.id;
    }

    isOnTime(conference: HearingSummary): boolean {
        return conference.isOnTime() || conference.isStarting();
    }

    isSuspended(conference: HearingSummary): boolean {
        return conference.status === ConferenceStatus.Suspended;
    }

    isDelayed(conference: HearingSummary): boolean {
        return conference.isDelayed();
    }

    isPaused(conference: HearingSummary): boolean {
        return conference.isPaused();
    }

    isInSession(conference: HearingSummary): boolean {
        return conference.isInSession();
    }

    isClosed(conference: HearingSummary): boolean {
        return conference.isClosed();
    }

    getConferenceStatusText(conference: HearingSummary): string {
        const hearing = conference;
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

    showParticipantGraph(selectedParticipant) {
        this.selectedParticipant.emit(selectedParticipant);
    }
}
