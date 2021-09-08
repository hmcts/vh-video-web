import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ConferenceForHostResponse, ConferenceStatus } from 'src/app/services/clients/api-client';
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
        console.log('Faz - conferences', conferences);
        this.hearings = conferences.map(c => new JudgeHearingSummary(c));
    }

    @Output() selectedConference = new EventEmitter<ConferenceForHostResponse>();

    constructor(private logger: Logger, private translate: TranslateService) {}

    getTranslation(key: string) {
        return this.translate.instant(`judge-hearing-table.${key}`);
    }

    ngOnInit() {
        this.hearings = this.conferenceForHostResponse.map(c => new JudgeHearingSummary(c));
        const last = this.hearings.pop();

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
            hearing.status === ConferenceStatus.Closed
        );
    }
}
