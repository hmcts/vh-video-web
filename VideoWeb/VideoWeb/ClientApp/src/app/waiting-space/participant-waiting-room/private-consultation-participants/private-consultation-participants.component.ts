import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ConferenceStatus, LinkType, ParticipantStatus, Role } from 'src/app/services/clients/api-client';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { ParticipantStatusMessage } from 'src/app/services/models/participant-status-message';
import { RoomTransfer } from 'src/app/shared/models/room-transfer';
import { HearingRole } from '../../models/hearing-role-model';
import { WRParticipantStatusListDirective } from '../../waiting-room-shared/wr-participant-list-shared.component';
import { ParticipantListItem } from '../participant-list-item';
import { FocusService } from 'src/app/services/focus.service';
import { VHEndpoint, VHParticipant } from '../../store/models/vh-conference';

@Component({
    selector: 'app-private-consultation-participants',
    templateUrl: './private-consultation-participants.component.html',
    styleUrls: ['./private-consultation-participants.component.scss']
})
export class PrivateConsultationParticipantsComponent extends WRParticipantStatusListDirective implements OnInit, OnDestroy {
    @Input() roomLabel: string;
    participantCallStatuses = {};
    johGroupResult: ParticipantListItem[][];

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
        this.loggerPrefix = '[PrivateConsultationParticipantsComponent] - ';
    }

    ngOnInit(): void {
        this.loggedInUser = this.route.snapshot.data['loggedUser'];
        this.initParticipants();
        this.setupSubscribers();
        this.setupInviteStatusSubscribers();
    }

    initParticipants() {
        super.initParticipants();
        this.setJohGroupResult();
    }

    ngOnDestroy() {
        this.executeTeardown();
    }

    setupInviteStatusSubscribers() {
        this.logger.debug(`${this.loggerPrefix} Subscribing to ConsultationRequestResponseMessage`);
        this.eventHubSubscriptions$.add(
            this.eventService.getConsultationRequestResponseMessage().subscribe(message => {
                if (message.roomLabel === this.roomLabel && message.conferenceId === this.conference.id) {
                    this.participantCallStatuses[message.requestedFor] = message.answer;
                    setTimeout(() => {
                        if (this.participantCallStatuses[message.requestedFor] === message.answer) {
                            this.participantCallStatuses[message.requestedFor] = null;
                        }
                    }, 10000);
                }
            })
        );

        this.logger.debug(`${this.loggerPrefix} Subscribing to RequestedConsultationMessage`);
        this.eventHubSubscriptions$.add(
            this.eventService.getRequestedConsultationMessage().subscribe(message => {
                // Set 'Calling...'
                // No need to timeout here the text because when the notification times out it will send another event.
                if (message.roomLabel === this.roomLabel && message.conferenceId === this.conference.id) {
                    this.participantCallStatuses[message.requestedFor] = 'Calling';
                }
            })
        );

        this.logger.debug(`${this.loggerPrefix} Subscribing to ParticipantStatusMessage`);
        this.eventHubSubscriptions$.add(
            this.eventService.getParticipantStatusMessage().subscribe(message => {
                // If the participant state changes reset the state.
                this.participantCallStatuses[message.participantId] = null;
            })
        );
    }

    canCallEndpoint(endpoint: VHEndpoint): boolean {
        return (
            !this.isParticipantInCurrentRoom(endpoint) &&
            this.isEndpointAvailable(endpoint) &&
            this.participantEndpoints.some(x => x.id === endpoint.id)
        );
    }

    getRowClasses(participant: any): string {
        return this.isParticipantInCurrentRoom(participant) ? 'yellow' : '';
    }

    isJohInCurrentRoom(participant: VHParticipant): boolean {
        return (
            this.isParticipantInCurrentRoom(participant) &&
            (this.isParticipantPanelMember(participant.hearingRole) ||
                participant.hearingRole === HearingRole.WINGER ||
                participant.hearingRole === HearingRole.JUDGE)
        );
    }

    isJohConsultation(): boolean {
        return this.roomLabel?.toLowerCase().includes('judgejohconsultationroom');
    }

    isPrivateConsultation(): boolean {
        return this.roomLabel?.toLowerCase().includes('participantconsultationroom');
    }

    getConsultationParticipants(): ParticipantListItem[] {
        let participants = this.nonJudgeParticipants.filter(x => x.hearingRole !== HearingRole.INTERPRETER);
        if (this.isPrivateConsultation()) {
            participants = participants.filter(x => x.hearingRole !== HearingRole.WITNESS);
        }

        return participants.map(c => this.mapResponseToListItem(c));
    }

    setJohGroupResult(): void {
        const johGroupsUnmapped = [[...this.panelMembers], [...this.wingers]];
        this.johGroupResult = johGroupsUnmapped.map(array => array.map(c => this.mapResponseToListItem(c)));
    }

    async handleParticipantStatusChange(message: ParticipantStatusMessage): Promise<void> {
        await super.handleParticipantStatusChange(message);
        this.setJohGroupResult();
    }

    getObservers(): ParticipantListItem[] {
        if (!this.isJohConsultation()) {
            return [];
        }
        const observers = this.sortAndMapToListItem(this.observers);
        return [...observers];
    }

    getParticipantStatus(participant: VHParticipant | VHEndpoint): string {
        return this.participantCallStatuses[participant.id];
    }

    isParticipantAvailable(participant: VHParticipant): boolean {
        const availableStatuses = ['Available', 'Connected', 'InConsultation'];
        return availableStatuses.indexOf(participant.status) >= 0;
    }

    isEndpointAvailable(endpoint: VHEndpoint): boolean {
        // this is a workaround because the endpoint status when the hearing started is 'Connected'
        const isHearingOn = this.conference.status === ConferenceStatus.InSession;
        const availableStatuses = ['Available', 'Connected', 'InConsultation'];
        return availableStatuses.indexOf(endpoint.status) >= 0 && !isHearingOn;
    }

    isParticipantInCurrentRoom(participant: VHParticipant | VHEndpoint): boolean {
        return participant.room?.label === this.roomLabel;
    }

    setupSubscribers(): void {
        this.addSharedEventHubSubcribers();

        this.eventHubSubscriptions$.add(
            this.eventService.getRoomTransfer().subscribe(message => {
                this.handleRoomChange(message);
            })
        );
    }

    handleRoomChange(message: RoomTransfer): void {
        this.filterNonJudgeParticipants();
        this.setJohGroupResult();
    }

    canCallParticipant(participant: VHParticipant): boolean {
        return !this.isParticipantInCurrentRoom(participant) && participant.status === ParticipantStatus.Available;
    }

    trackParticipant(index: number, item: ParticipantListItem) {
        return item.status;
    }
    participantHasInviteRestrictions(participant: ParticipantListItem): boolean {
        const loggedInUserParticipant = this.conference.participants.find(x => x.id === this.loggedInUser.participant_id);
        if (this.consultationRules.participantsAreScreenedFromEachOther(loggedInUserParticipant, participant)) {
            return true;
        }

        const participantsInRoom = this.consultationRules.getParticipantsInRoom(this.roomLabel);
        if (
            participantsInRoom.some(participantInRoom =>
                this.consultationRules.participantsAreScreenedFromEachOther(participant, participantInRoom)
            )
        ) {
            return true;
        }

        const userIsJudicial =
            this.loggedInUser.role === Role.Judge ||
            this.loggedInUser.role === Role.StaffMember ||
            this.loggedInUser.role === Role.JudicialOfficeHolder;
        if (!userIsJudicial) {
            switch (participant.hearingRole) {
                case HearingRole.WINGER:
                case HearingRole.WITNESS:
                case HearingRole.OBSERVER:
                case HearingRole.JUDGE:
                case HearingRole.STAFF_MEMBER:
                case HearingRole.PANEL_MEMBER:
                    return true;
                default:
                    return false;
            }
        }

        return false;
    }

    private mapResponseToListItem(vhParticipant: VHParticipant): ParticipantListItem {
        const participant: ParticipantListItem = { ...vhParticipant };
        const interpreterLink = vhParticipant.linkedParticipants?.find(x => x.linkedType === LinkType.Interpreter);
        if (interpreterLink) {
            participant.interpreter = this.conference.participants.find(x => x.id === interpreterLink.linkedType);
        }
        return participant;
    }

    private sortAndMapToListItem(participantResponses: Array<VHParticipant>): Array<ParticipantListItem> {
        return participantResponses.map(c => this.mapResponseToListItem(c));
    }
}
