import { Component, OnDestroy, OnInit } from '@angular/core';
import { AdalService } from 'adal-angular4';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import {
    ParticipantResponse,
    ParticipantStatus,
    Role,
    UpdateParticipantRequest,
    VideoEndpointResponse
} from 'src/app/services/clients/api-client';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { CaseTypeGroup } from 'src/app/waiting-space/models/case-type-group';
import { WRParticipantStatusListDirective } from '../waiting-room-shared/wr-participant-list-shared.component';

@Component({
    selector: 'app-judge-participant-status-list',
    templateUrl: './judge-participant-status-list.component.html',
    styleUrls: ['./judge-participant-status-list.component.scss']
})
export class JudgeParticipantStatusListComponent extends WRParticipantStatusListDirective implements OnInit, OnDestroy {
    representativeParticipants: ParticipantResponse[];
    litigantInPerson: boolean;
    individualParticipants: ParticipantResponse[];
    endpoints: VideoEndpointResponse[];
    showChangeJudgeDisplayName = false;
    newJudgeDisplayName: string;

    observers: ParticipantResponse[];
    panelMembers: ParticipantResponse[];

    constructor(
        protected adalService: AdalService,
        protected consultationService: ConsultationService,
        protected eventService: EventsService,
        protected logger: Logger,
        protected videoWebService: VideoWebService
    ) {
        super(adalService, consultationService, eventService, videoWebService, logger);
    }

    ngOnInit() {
        this.consultationService.resetWaitingForResponse();
        this.initParticipants();
        this.setupSubscribers();
    }

    ngOnDestroy() {
        this.executeTeardown();
    }

    initParticipants() {
        super.initParticipants();
        this.filterRepresentatives();
    }

    setupSubscribers(): void {
        this.addSharedEventHubSubcribers();
        this.eventService.start();
    }

    canCallParticipant(participant: ParticipantResponse): boolean {
        return false;
    }

    canCallEndpoint(endpoint: VideoEndpointResponse): boolean {
        return false;
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
                x.case_type_group !== CaseTypeGroup.OBSERVER &&
                x.case_type_group !== CaseTypeGroup.PANEL_MEMBER
        );
        this.litigantInPerson = this.representativeParticipants.length === 0;
        this.individualParticipants = this.conference.participants.filter(
            x =>
                x.role === Role.Individual &&
                x.case_type_group !== CaseTypeGroup.OBSERVER &&
                x.case_type_group !== CaseTypeGroup.PANEL_MEMBER
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
}
