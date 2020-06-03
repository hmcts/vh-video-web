import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ConferenceResponseVho, ParticipantResponseVho } from 'src/app/services/clients/api-client';
import { Hearing } from 'src/app/shared/models/hearing';
import { HearingSummary } from 'src/app/shared/models/hearing-summary';
import { ParticipantSummary } from '../../shared/models/participant-summary';

@Component({
    selector: 'app-vho-hearing-list',
    templateUrl: './vho-hearing-list.component.html',
    styleUrls: ['./vho-hearing-list.component.scss', '../vho-global-styles.scss', '../hearing-status/hearing-status.component.scss']
})
export class VhoHearingListComponent implements OnInit {
    @Input() conferences: HearingSummary[];
    @Output() selectedConference = new EventEmitter<HearingSummary>();

    currentConference: HearingSummary;

    constructor() {}

    ngOnInit() { }

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

    mapToHearing(conference: HearingSummary, participants: ParticipantResponseVho[] = null): Hearing {
        const hearing = new ConferenceResponseVho({
            id: conference.id, scheduled_date_time: conference.scheduledDateTime, status: conference.status,
            participants: participants
        });
        return new Hearing(hearing);
    }

    mapToHearingWithParticipants(conference: HearingSummary): Hearing {
        const participants = conference.getParticipants()
            .map(x => new ParticipantResponseVho({ id: x.id, name: x.displayName, username: x.username, role: x.role }));
        return this.mapToHearing(conference, participants);
    }
}
