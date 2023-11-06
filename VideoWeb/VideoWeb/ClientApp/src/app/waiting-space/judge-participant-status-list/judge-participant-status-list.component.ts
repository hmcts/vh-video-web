import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import {
    ParticipantResponse,
    ParticipantStatus,
    Role,
    UpdateParticipantDisplayNameRequest,
    VideoEndpointResponse
} from 'src/app/services/clients/api-client';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { Hearing } from 'src/app/shared/models/hearing';
import { HearingRole } from '../models/hearing-role-model';
import { WRParticipantStatusListDirective } from '../waiting-room-shared/wr-participant-list-shared.component';
import { FocusService } from 'src/app/services/focus.service';

@Component({
    selector: 'app-judge-participant-status-list',
    templateUrl: './judge-participant-status-list.component.html',
    styleUrls: ['./judge-participant-status-list.component.scss']
})
export class JudgeParticipantStatusListComponent extends WRParticipantStatusListDirective implements OnInit, OnDestroy {
    representativeParticipants: ParticipantResponse[];
    litigantInPerson: boolean;
    individualParticipants: ParticipantResponse[];
    showChangeJudgeDisplayName = false;
    showChangeStaffMemberDisplayName = false;
    newJudgeDisplayName: string;
    newStaffMemberDisplayName: string;
    isUserJudge: boolean;
    isStaffMember: boolean;
    hearing: Hearing;

    constructor(
        protected consultationService: ConsultationService,
        protected eventService: EventsService,
        protected logger: Logger,
        protected videoWebService: VideoWebService,
        protected route: ActivatedRoute,
        protected translateService: TranslateService,
        protected focusService: FocusService
    ) {
        super(consultationService, eventService, videoWebService, logger, translateService, focusService);
    }

    ngOnInit() {
        this.hearing = new Hearing(this.conference);
        this.loggedInUser = this.route.snapshot.data['loggedUser'];
        this.initParticipants();
        this.addSharedEventHubSubcribers();
    }

    ngOnDestroy() {
        this.executeTeardown();
    }

    initParticipants() {
        super.initParticipants();
        this.filterRepresentatives();
        this.isUserJudge = this.loggedInUser?.role === Role.Judge;
        this.isStaffMember = this.loggedInUser?.role === Role.StaffMember;
    }

    getParticipantStatus(participant: ParticipantResponse): string {
        if (participant.status === ParticipantStatus.None) {
            return this.translateService.instant('judge-participant-status-list.not-signed-in');
        }
        if (participant.status === ParticipantStatus.Available || participant.status === ParticipantStatus.InHearing) {
            return this.translateService.instant('judge-participant-status-list.connected');
        }
        return this.translateService.instant('participant-status.' + participant.status.toString().toLowerCase());
    }

    getEndpointStatus(endpoint: VideoEndpointResponse): string {
        return this.translateService.instant('endpoint-status.' + endpoint.status.toString().toLowerCase());
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

    changeJudgeNameShow() {
        this.showChangeJudgeDisplayName = true;
        this.newJudgeDisplayName = this.judge.display_name;
    }

    canChangeStaffMemberName(id: string) {
        return this.isStaffMember && this.loggedInUser.participant_id === id;
    }

    changeStaffMemberNameShow(id: string) {
        this.showChangeStaffMemberDisplayName = true;
        this.newStaffMemberDisplayName = this.staffMembers.find(p => p.id === id).display_name;
    }

    onEnterJudgeDisplayName(value: string) {
        this.newJudgeDisplayName = value;
    }

    onEnterStaffMemberDisplayName(value: string) {
        this.newStaffMemberDisplayName = value;
    }

    removeSpecialCharacters(value: string): string {
        return value.replace(/[^a-zA-Z0-9_ ]/g, '');
    }

    async saveJudgeDisplayName() {
        this.judge.display_name = this.newJudgeDisplayName;
        this.judge.display_name = this.removeSpecialCharacters(this.judge.display_name);
        this.showChangeJudgeDisplayName = false;
        await this.updateJudgeDisplayName();
        this.focusService.restoreFocus();
    }

    async saveStaffMemberDisplayName(id: string) {
        const staffMember = this.staffMembers.find(p => p.id === id);
        staffMember.display_name = this.newStaffMemberDisplayName;
        this.showChangeStaffMemberDisplayName = false;
        await this.updateStaffMemberDisplayName(staffMember);
        this.focusService.restoreFocus();
    }

    cancelStaffMemberDisplayName() {
        this.showChangeStaffMemberDisplayName = false;
        this.focusService.restoreFocus();
    }

    cancelJudgeDisplayName() {
        this.showChangeJudgeDisplayName = false;
        this.focusService.restoreFocus();
    }

    private filterRepresentatives(): void {
        this.representativeParticipants = this.conference.participants.filter(
            x => x.role === Role.Representative && x.hearing_role !== HearingRole.OBSERVER
        );
        this.litigantInPerson = this.representativeParticipants.length === 0;
        this.individualParticipants = this.conference.participants.filter(
            x => x.role === Role.Individual && x.hearing_role !== HearingRole.OBSERVER
        );
    }

    private async updateJudgeDisplayName() {
        const updateParticipantRequest = new UpdateParticipantDisplayNameRequest({
            fullname: this.judge.name,
            display_name: this.judge.display_name,
            representee: this.judge.representee,
            first_name: this.judge.first_name,
            last_name: this.judge.last_name
        });

        try {
            this.logger.debug('[JudgeParticipantStatusList] - Attempting to update judge', {
                judge: this.judge.id,
                displayName: this.judge.display_name
            });
            await this.videoWebService.updateParticipantDetails(this.conference.id, this.judge.id, updateParticipantRequest);
        } catch (error) {
            this.logger.error(`[JudgeParticipantStatusList] - There was an error update judge display name ${this.judge.id}`, error);
        }
    }

    private async updateStaffMemberDisplayName(staffMember: ParticipantResponse) {
        const updateParticipantRequest = new UpdateParticipantDisplayNameRequest({
            fullname: staffMember.name,
            display_name: staffMember.display_name,
            representee: staffMember.representee,
            first_name: staffMember.first_name,
            last_name: staffMember.last_name
        });

        try {
            this.logger.debug('[JudgeParticipantStatusList] - Attempting to update staff member', {
                staffMember: staffMember.id,
                displayName: staffMember.display_name
            });
            await this.videoWebService.updateParticipantDetails(this.conference.id, staffMember.id, updateParticipantRequest);
        } catch (error) {
            this.logger.error(
                `[JudgeParticipantStatusList] - There was an error updating staff member display name ${staffMember.id}`,
                error
            );
        }
    }
}
