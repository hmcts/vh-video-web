import { Component, Input, OnInit } from '@angular/core';
import { AdalService } from 'adal-angular4';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import {
    ConferenceResponse,
    ParticipantResponse,
    ParticipantStatus,
    Role,
    UpdateParticipantRequest,
    VideoEndpointResponse
} from 'src/app/services/clients/api-client';
import { Logger } from 'src/app/services/logging/logger-base';
import { HearingRole } from '../models/hearing-role-model';

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
    endpoints: VideoEndpointResponse[];
    showChangeJudgeDisplayName = false;
    newJudgeDisplayName: string;

    observers: ParticipantResponse[];
    panelMembers: ParticipantResponse[];
    wingers: ParticipantResponse[];

    constructor(private adalService: AdalService, private videoWebService: VideoWebService, private logger: Logger) {}

    ngOnInit() {
        this.filterNonJudgeParticipants();
        this.filterJudge();
        this.filterRepresentatives();
        this.filterObservers();
        this.filterPanelMembers();
        this.filterWingers();
        this.endpoints = this.conference.endpoints;
    }

    private filterNonJudgeParticipants(): void {
        this.nonJudgeParticipants = this.conference.participants.filter(
            x =>
                x.role !== Role.Judge &&
                x.hearing_role !== HearingRole.OBSERVER &&
                x.hearing_role !== HearingRole.PANEL_MEMBER &&
                x.hearing_role !== HearingRole.WINGER
        );
    }

    private filterObservers(): void {
        this.observers = this.conference.participants.filter(x => x.hearing_role === HearingRole.OBSERVER);
    }

    private filterPanelMembers(): void {
        this.panelMembers = this.conference.participants.filter(x => x.hearing_role === HearingRole.PANEL_MEMBER);
    }

    private filterWingers(): void {
        this.wingers = this.conference.participants.filter(x => x.hearing_role === HearingRole.WINGER);
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

    getEndpointStatus(endpoint: VideoEndpointResponse): string {
        return this.camelToSpaced(endpoint.status.toString());
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

    getEndpointStatusCss(endpoint: VideoEndpointResponse): string {
        return this.camelToSnake(endpoint.status.toString());
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
        this.representativeParticipants = this.conference.participants.filter(
            x =>
                x.role === Role.Representative &&
                x.hearing_role !== HearingRole.OBSERVER &&
                x.hearing_role !== HearingRole.PANEL_MEMBER &&
                x.hearing_role !== HearingRole.WINGER
        );
        this.litigantInPerson = this.representativeParticipants.length === 0;
        this.individualParticipants = this.conference.participants.filter(
            x =>
                x.role === Role.Individual &&
                x.hearing_role !== HearingRole.OBSERVER &&
                x.hearing_role !== HearingRole.PANEL_MEMBER &&
                x.hearing_role !== HearingRole.WINGER
        );
    }

    changeJudgeNameShow() {
        this.showChangeJudgeDisplayName = true;
        this.newJudgeDisplayName = this.judge.display_name;
    }

    onEnterJudgeDisplayName(value: string) {
        this.newJudgeDisplayName = value;
    }

    async saveJudgeDisplayName() {
        this.judge.display_name = this.newJudgeDisplayName;
        this.showChangeJudgeDisplayName = false;
        await this.updateParticipant();
    }

    cancelJudgeDisplayName() {
        this.showChangeJudgeDisplayName = false;
    }

    private async updateParticipant() {
        const updateParticipantRequest = new UpdateParticipantRequest({
            fullname: this.judge.name,
            display_name: this.judge.display_name,
            representee: this.judge.representee,
            first_name: this.judge.first_name,
            last_name: this.judge.last_name
        });

        try {
            await this.videoWebService.updateParticipantDetails(this.conference.id, this.judge.id, updateParticipantRequest);
        } catch (error) {
            this.logger.error(`There was an error update judge display name ${this.judge.id}`, error);
        }
    }

    getParticipantsCount(): number {
        return this.nonJudgeParticipants.length + this.observers.length + this.panelMembers.length + this.wingers.length;
    }

    isCaseTypeNone(participant: ParticipantResponse): boolean {
        return participant.case_type_group === 'None';
    }
}
