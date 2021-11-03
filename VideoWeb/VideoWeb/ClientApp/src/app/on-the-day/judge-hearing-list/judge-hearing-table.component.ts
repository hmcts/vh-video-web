import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ConferenceForHostResponse, ConferenceStatus } from 'src/app/services/clients/api-client';
import { HearingVenueFlagsService } from 'src/app/services/hearing-venue-flags.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { JudgeHearingSummary } from 'src/app/shared/models/JudgeHearingSummary';
import { ParticipantSummary } from 'src/app/shared/models/participant-summary';

@Component({
    selector: 'app-judge-hearing-table',
    templateUrl: './judge-hearing-table.component.html',
    styleUrls: ['./judge-hearing-table.component.scss']
})
export class JudgeHearingTableComponent implements OnInit {
    private conferenceForHostResponse: ConferenceForHostResponse[];
    hearings: JudgeHearingSummary[];

    @Input() set conferences(conferences: ConferenceForHostResponse[]) {
        this.conferenceForHostResponse = conferences;
        this.hearings = conferences.map(c => new JudgeHearingSummary(c));
    }

    @Output() selectedConference = new EventEmitter<ConferenceForHostResponse>();

    constructor(private logger: Logger, private hearingVenueFlagsService: HearingVenueFlagsService) {}

    ngOnInit() {
        this.hearings = this.conferenceForHostResponse.map(c => new JudgeHearingSummary(c));
        const last = this.hearings.pop();
        this.hearingVenueFlagsService.setHearingVenueIsScottish(false);
        this.hearings.push(last);
    }

    stringToTranslateId(str: string) {
        return str.replace(/\s/g, '-').toLowerCase();
    }

    getRepresentative(participants: ParticipantSummary[]): ParticipantSummary {
        return participants.find(x => x.representee && x.representee.trim() !== '');
    }

    getIndividual(participants: ParticipantSummary[]): ParticipantSummary {
        return participants.find(x => !x.representee || x.representee.trim() === '');
    }

    signIntoConference(hearing: JudgeHearingSummary) {
        this.logger.debug(`[JudgeHearingList] - Selected conference ${hearing.id}`);
        const conference = this.conferenceForHostResponse.find(x => x.id === hearing.id);
        this.selectedConference.emit(conference);
    }

    showConferenceStatus(hearing: JudgeHearingSummary): boolean {
        return (
            hearing.status === ConferenceStatus.Paused ||
            hearing.status === ConferenceStatus.Suspended ||
            hearing.status === ConferenceStatus.Closed ||
            hearing.status === ConferenceStatus.InSession
        );
    }
}
