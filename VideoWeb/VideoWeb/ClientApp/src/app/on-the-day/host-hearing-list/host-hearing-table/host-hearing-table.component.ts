import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ConferenceForHostResponse, ConferenceStatus } from 'src/app/services/clients/api-client';
import { Logger } from 'src/app/services/logging/logger-base';
import { JudgeHearingSummary } from 'src/app/shared/models/JudgeHearingSummary';
import { ParticipantSummary } from 'src/app/shared/models/participant-summary';
import { convertStringToTranslationId } from 'src/app/shared/translation-id-converter';

@Component({
    selector: 'app-host-hearing-table',
    templateUrl: './host-hearing-table.component.html',
    styleUrls: ['./host-hearing-table.component.scss']
})
export class HostHearingTableComponent implements OnInit {
    @Output() selectedConference = new EventEmitter<ConferenceForHostResponse>();
    hearings: JudgeHearingSummary[];

    private conferenceForHostResponse: ConferenceForHostResponse[];

    constructor(private logger: Logger) {}

    @Input() set conferences(conferences: ConferenceForHostResponse[]) {
        this.conferenceForHostResponse = conferences;
        this.hearings = conferences.map(c => new JudgeHearingSummary(c));
    }

    ngOnInit() {
        this.hearings = this.conferenceForHostResponse.map(c => new JudgeHearingSummary(c));
        const last = this.hearings.pop();
        this.hearings.push(last);
    }

    stringToTranslateId(str: string) {
        return convertStringToTranslationId(str);
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
