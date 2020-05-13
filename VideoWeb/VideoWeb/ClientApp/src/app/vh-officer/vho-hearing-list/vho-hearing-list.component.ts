import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ClipboardService } from 'ngx-clipboard';
import { PerfectScrollbarConfigInterface } from 'ngx-perfect-scrollbar';
import { ConferenceStatus, ConferenceResponseVho } from 'src/app/services/clients/api-client';
import { HearingSummary } from 'src/app/shared/models/hearing-summary';
import { ParticipantSummary } from '../../shared/models/participant-summary';
import { Hearing } from 'src/app/shared/models/hearing';

@Component({
    selector: 'app-vho-hearing-list',
    templateUrl: './vho-hearing-list.component.html',
    styleUrls: ['./vho-hearing-list.component.scss', '../vho-global-styles.scss']
})
export class VhoHearingListComponent implements OnInit {
    @Input() conferences: HearingSummary[];
    @Output() selectedConference = new EventEmitter<HearingSummary>();

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

    mapToHearing(conference: HearingSummary): Hearing {
        const hearing = new ConferenceResponseVho({ scheduled_date_time: conference.scheduledDateTime, status: conference.status });
        return new Hearing(hearing);
    }
}
