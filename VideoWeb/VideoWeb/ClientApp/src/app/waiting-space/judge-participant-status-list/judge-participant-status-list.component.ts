import { Component, Input, OnInit } from '@angular/core';
import { AdalService } from 'adal-angular4';
import {
    ConferenceResponse,
    ParticipantResponse,
    ParticipantStatus,
    Role,
    UpdateParticipantRequest
} from 'src/app/services/clients/api-client';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { Logger } from 'src/app/services/logging/logger-base';

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
    showChangeJudgeDisplayName = false;
    newJudgeDisplayName: string;

    constructor(private adalService: AdalService, private videoWebService: VideoWebService, private logger: Logger) { }

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
        const splitWord = word.split(/(?=[A-Z])/).join(' ');
        const lowcaseWord = splitWord.toLowerCase();
        return lowcaseWord.charAt(0).toUpperCase() + lowcaseWord.slice(1);
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

    changeJudgeNameShow() {
        this.showChangeJudgeDisplayName = true;
        this.newJudgeDisplayName = this.judge.display_name;
    }

    onEnterJudgeDisplayName(value: string) {
        this.newJudgeDisplayName = value;
    }

    saveJudgeDisplayName() {
        this.judge.display_name = this.newJudgeDisplayName;
        this.showChangeJudgeDisplayName = false;
        this.updateParticipant();
    }

    cancelJudgeDisplayName() {
        this.showChangeJudgeDisplayName = false;
    }

    private updateParticipant() {
        const updateParticipantRequest = new UpdateParticipantRequest({
            fullname: this.judge.name,
            display_name: this.judge.display_name,
            representee: this.judge.representee,
            first_name: this.judge.first_name,
            last_name: this.judge.last_name
        });

        this.videoWebService.updateParticipantDetails(this.conference.id, this.judge.id, updateParticipantRequest).catch(error => {
            this.logger.error(`There was an error update judge display name ${this.judge.id}`, error);
        });
    }
}
