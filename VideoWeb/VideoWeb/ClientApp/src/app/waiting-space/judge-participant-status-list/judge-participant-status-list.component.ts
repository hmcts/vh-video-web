import { Component, Input, OnInit } from '@angular/core';
import { AdalService } from 'adal-angular4';
import { ConferenceResponse, ParticipantResponse, ParticipantStatus, Role } from 'src/app/services/clients/api-client';

@Component({
    selector: 'app-judge-participant-status-list',
    templateUrl: './judge-participant-status-list.component.html',
    styleUrls: ['./judge-participant-status-list.component.scss']
})
export class JudgeParticipantStatusListComponent implements OnInit {
    @Input() conference: ConferenceResponse;

    nonJudgeParticipants: ParticipantResponse[];
    judge: ParticipantResponse;
    representativeParticipants: ParticipantResponse[];
    litigantInPerson: boolean;
    individualParticipants: ParticipantResponse[];

    constructor(private adalService: AdalService) {}

    ngOnInit() {
        this.filterNonJudgeParticipants();
        this.filterJudge();

        this.filterRepresentatives();
    }

    private filterNonJudgeParticipants(): void {
        this.nonJudgeParticipants = this.conference.participants.filter(x => x.role !== Role.Judge);
    }

    private filterJudge(): void {
        this.judge = this.conference.participants.find(x => x.role === Role.Judge);
    }

    getParticipantStatus(participant: ParticipantResponse): string {
        if (participant.status === ParticipantStatus.None) {
            return this.camelToSpaced(ParticipantStatus.NotSignedIn.toString());
        }
        if (participant.status === ParticipantStatus.Available || participant.status === ParticipantStatus.InHearing) {
            return 'Connected';
        }
        return this.camelToSpaced(participant.status.toString());
    }

    private camelToSpaced(word: string) {
        return word.split(/(?=[A-Z])/).join(' ');
    }

    getParticipantStatusCss(participant: ParticipantResponse): string {
        if (participant.status === ParticipantStatus.None) {
            return this.camelToSnake(ParticipantStatus.NotSignedIn.toString());
        } else {
            return this.camelToSnake(participant.status.toString());
        }
    }

    private camelToSnake(word: string) {
        return word
            .split(/(?=[A-Z])/)
            .join('_')
            .toLowerCase();
    }

    isUserJudge(): boolean {
        const participant = this.conference.participants.find(
            x => x.username.toLowerCase() === this.adalService.userInfo.userName.toLocaleLowerCase()
        );
        return participant.role === Role.Judge;
    }

    private filterRepresentatives(): void {
        this.representativeParticipants = this.conference.participants.filter(x => x.role === Role.Representative);
        this.litigantInPerson = this.representativeParticipants.length === 0;
        this.individualParticipants = this.conference.participants.filter(x => x.role === Role.Individual);
    }
}
