import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ParticipantStatus, Role, UpdateParticipantDisplayNameRequest } from 'src/app/services/clients/api-client';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { Hearing } from 'src/app/shared/models/hearing';
import { HearingRole } from '../models/hearing-role-model';
import { WRParticipantStatusListDirective } from '../waiting-room-shared/wr-participant-list-shared.component';
import { FocusService } from 'src/app/services/focus.service';
import { VHEndpoint, VHParticipant } from '../store/models/vh-conference';
import { ConferenceState } from '../store/reducers/conference.reducer';
import { Store } from '@ngrx/store';
import { ConferenceActions } from '../store/actions/conference.actions';

@Component({
    selector: 'app-judge-participant-status-list',
    templateUrl: './judge-participant-status-list.component.html',
    styleUrls: ['./judge-participant-status-list.component.scss']
})
export class JudgeParticipantStatusListComponent extends WRParticipantStatusListDirective implements OnInit, OnDestroy {
    representativeParticipants: VHParticipant[];
    litigantInPerson: boolean;
    individualParticipants: VHParticipant[];
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
        protected focusService: FocusService,
        private store: Store<ConferenceState>
    ) {
        super(consultationService, eventService, videoWebService, logger, translateService, focusService);
    }

    ngOnInit() {
        this.hearing = new Hearing(this.conference as any); // TODO: create a new Hearing ctor that accepts VHConference
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

    getParticipantStatus(participant: VHParticipant): string {
        if (participant.status === ParticipantStatus.None) {
            return this.translateService.instant('judge-participant-status-list.not-signed-in');
        }
        if (participant.status === ParticipantStatus.Available || participant.status === ParticipantStatus.InHearing) {
            return this.translateService.instant('judge-participant-status-list.connected');
        }
        return this.translateService.instant('participant-status.' + participant.status.toString().toLowerCase());
    }

    getEndpointStatus(endpoint: VHEndpoint): string {
        return this.translateService.instant('endpoint-status.' + endpoint.status.toString().toLowerCase());
    }

    getParticipantStatusCss(participant: VHParticipant): string {
        if (participant.status === ParticipantStatus.None) {
            return this.camelToSnake(ParticipantStatus.NotSignedIn.toString());
        } else {
            return this.camelToSnake(participant.status.toString());
        }
    }

    getEndpointStatusCss(endpoint: VHEndpoint): string {
        return this.camelToSnake(endpoint.status.toString());
    }

    changeJudgeNameShow() {
        this.showChangeJudgeDisplayName = true;
        this.newJudgeDisplayName = this.judge.displayName;
        this.focusService.storeFocus();
    }

    canChangeStaffMemberName(id: string) {
        return this.isStaffMember && this.loggedInUser.participant_id === id;
    }

    changeStaffMemberNameShow(id: string) {
        this.focusService.storeFocus();
        this.showChangeStaffMemberDisplayName = true;
        this.newStaffMemberDisplayName = this.staffMembers.find(p => p.id === id).displayName;
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
        const displayName = this.removeSpecialCharacters(this.newJudgeDisplayName);
        this.store.dispatch(
            ConferenceActions.updateJudgeDisplayName({
                participantId: this.judge.id,
                displayName: displayName,
                conferenceId: this.conference.id
            })
        );
        this.showChangeJudgeDisplayName = false;
        await this.updateJudgeDisplayName();
        this.focusService.restoreFocus();
    }

    async saveStaffMemberDisplayName(id: string) {
        const displayName = this.removeSpecialCharacters(this.newStaffMemberDisplayName);
        this.store.dispatch(
            ConferenceActions.updateStaffMemberDisplayName({
                participantId: id,
                displayName: displayName,
                conferenceId: this.conference.id
            })
        );
        this.showChangeStaffMemberDisplayName = false;
        const updatedStaffMember = this.staffMembers.find(p => p.id === id);
        await this.updateStaffMemberDisplayName(updatedStaffMember);
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
            x => x.role === Role.Representative && x.hearingRole !== HearingRole.OBSERVER
        );
        this.litigantInPerson = this.representativeParticipants.length === 0;
        this.individualParticipants = this.conference.participants.filter(
            x => x.role === Role.Individual && x.hearingRole !== HearingRole.OBSERVER
        );
    }

    private async updateJudgeDisplayName() {
        const updateParticipantRequest = new UpdateParticipantDisplayNameRequest({
            fullname: this.judge.name,
            display_name: this.judge.displayName,
            representee: this.judge.representee,
            first_name: this.judge.firstName,
            last_name: this.judge.lastName
        });

        try {
            this.logger.debug('[JudgeParticipantStatusList] - Attempting to update judge', {
                judge: this.judge.id,
                displayName: this.judge.displayName
            });
            await this.videoWebService.updateParticipantDisplayName(this.conference.id, this.judge.id, updateParticipantRequest);
        } catch (error) {
            this.logger.error(`[JudgeParticipantStatusList] - There was an error update judge display name ${this.judge.id}`, error);
        }
    }

    private async updateStaffMemberDisplayName(staffMember: VHParticipant) {
        const updateParticipantRequest = new UpdateParticipantDisplayNameRequest({
            fullname: staffMember.name,
            display_name: staffMember.displayName,
            representee: staffMember.representee,
            first_name: staffMember.firstName,
            last_name: staffMember.lastName
        });

        try {
            this.logger.debug('[JudgeParticipantStatusList] - Attempting to update staff member', {
                staffMember: staffMember.id,
                displayName: staffMember.displayName
            });
            await this.videoWebService.updateParticipantDisplayName(this.conference.id, staffMember.id, updateParticipantRequest);
        } catch (error) {
            this.logger.error(
                `[JudgeParticipantStatusList] - There was an error updating staff member display name ${staffMember.id}`,
                error
            );
        }
    }
}
