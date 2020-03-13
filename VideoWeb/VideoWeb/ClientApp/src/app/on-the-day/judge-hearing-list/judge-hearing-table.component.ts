import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ConferenceForUserResponse, ConferenceStatus } from 'src/app/services/clients/api-client';
import { Logger } from 'src/app/services/logging/logger-base';
import { HearingSummary } from 'src/app/shared/models/hearing-summary';
import { ParticipantSummary } from 'src/app/shared/models/participant-summary';

@Component({
    selector: 'app-judge-hearing-table',
    templateUrl: './judge-hearing-table.component.html',
    styleUrls: ['./judge-hearing-table.component.scss']
})
export class JudgeHearingTableComponent implements OnInit {
    private _conferences: ConferenceForUserResponse[];
    hearings: HearingSummary[];

    @Input() set conferences(conferences: ConferenceForUserResponse[]) {
        this._conferences = conferences;
        this.hearings = conferences.map(c => new HearingSummary(c));
    }

    @Output() selectedConference = new EventEmitter<ConferenceForUserResponse>();

    constructor(private logger: Logger) {}

    ngOnInit() {
        this.hearings = this._conferences.map(c => new HearingSummary(c));
    }

    getRepresentative(participants: ParticipantSummary[]): ParticipantSummary {
        return participants.find(x => x.representee !== null);
    }

    getIndividual(participants: ParticipantSummary[]): ParticipantSummary {
        return participants.find(x => x.representee === null);
    }

    signIntoConference(hearing: HearingSummary) {
        this.logger.info(`selected conference to sign into: ${hearing.id}`);
        const conference = this._conferences.find(x => x.id === hearing.id);
        this.selectedConference.emit(conference);
    }

    showConferenceStatus(hearing: HearingSummary): boolean {
        return (
            hearing.status === ConferenceStatus.Paused ||
            hearing.status === ConferenceStatus.Suspended ||
            hearing.status === ConferenceStatus.Closed
        );
    }
}
