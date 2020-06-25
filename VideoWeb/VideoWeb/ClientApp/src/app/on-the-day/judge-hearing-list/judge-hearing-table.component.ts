import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ConferenceForJudgeResponse, ConferenceStatus } from 'src/app/services/clients/api-client';
import { Logger } from 'src/app/services/logging/logger-base';
import { HearingSummary } from 'src/app/shared/models/hearing-summary';
import { JudgeHearingSummary } from 'src/app/shared/models/JudgeHearingSummary';
import { ParticipantSummary } from 'src/app/shared/models/participant-summary';

@Component({
    selector: 'app-judge-hearing-table',
    templateUrl: './judge-hearing-table.component.html',
    styleUrls: ['./judge-hearing-table.component.scss']
})
export class JudgeHearingTableComponent implements OnInit {
    private conferenceForJudgeResponse: ConferenceForJudgeResponse[];
    hearings: JudgeHearingSummary[];

    @Input() set conferences(conferences: ConferenceForJudgeResponse[]) {
        this.conferenceForJudgeResponse = conferences;
        this.hearings = conferences.map(c => new JudgeHearingSummary(c));
    }

    @Output() selectedConference = new EventEmitter<ConferenceForJudgeResponse>();

    constructor(private logger: Logger) {}

    ngOnInit() {
        this.hearings = this.conferenceForJudgeResponse.map(c => new HearingSummary(c));
    }

    getRepresentative(participants: ParticipantSummary[]): ParticipantSummary {
        return participants.find(x => x.representee && x.representee.trim() !== '');
    }

    getIndividual(participants: ParticipantSummary[]): ParticipantSummary {
        return participants.find(x => !x.representee || x.representee.trim() === '');
    }

    getParticipantsCount(hearing: JudgeHearingSummary): number {
        return hearing.applicants.length + hearing.respondents.length;
    }

    signIntoConference(hearing: JudgeHearingSummary) {
        this.logger.info(`selected conference to sign into: ${hearing.id}`);
        const conference = this.conferenceForJudgeResponse.find(x => x.id === hearing.id);
        this.selectedConference.emit(conference);
    }

    showConferenceStatus(hearing: JudgeHearingSummary): boolean {
        return (
            hearing.status === ConferenceStatus.Paused ||
            hearing.status === ConferenceStatus.Suspended ||
            hearing.status === ConferenceStatus.Closed
        );
    }
}
