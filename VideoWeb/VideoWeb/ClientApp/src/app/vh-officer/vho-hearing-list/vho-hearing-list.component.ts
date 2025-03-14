import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ConferenceResponse, ParticipantResponse } from 'src/app/services/clients/api-client';
import { Hearing } from 'src/app/shared/models/hearing';
import { HearingSummary } from 'src/app/shared/models/hearing-summary';
import { ParticipantSummary } from '../../shared/models/participant-summary';
import { FEATURE_FLAGS } from 'src/app/services/launch-darkly.service';

@Component({
    standalone: false,
    selector: 'app-vho-hearing-list',
    templateUrl: './vho-hearing-list.component.html',
    styleUrls: ['./vho-hearing-list.component.scss', '../vho-global-styles.scss', '../hearing-status/hearing-status.component.scss']
})
export class VhoHearingListComponent {
    @Input() conferences: HearingSummary[];
    @Output() selectedConference = new EventEmitter<HearingSummary>();

    featureFlags = FEATURE_FLAGS;

    currentConference: HearingSummary;

    get noConferences(): boolean {
        return this.conferences == null || this.conferences.length === 0;
    }

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

    getParticipantsForConference(conference: HearingSummary): ParticipantSummary[] {
        return conference.getParticipants();
    }

    mapToHearing(conference: HearingSummary, participants: ParticipantResponse[] = null): Hearing {
        const hearing = new ConferenceResponse({
            id: conference.id,
            scheduled_date_time: conference.scheduledDateTime,
            status: conference.status,
            participants: participants
        });
        return new Hearing(hearing);
    }

    mapToHearingWithParticipants(conference: HearingSummary): Hearing {
        const participants = conference
            .getParticipants()
            .map(x => new ParticipantResponse({ id: x.id, display_name: x.displayName, role: x.role }));
        return this.mapToHearing(conference, participants);
    }

    trackConference(index: number, conference: HearingSummary) {
        return conference.id;
    }
}
