import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {TranslateService} from '@ngx-translate/core';
import {ConsultationService} from 'src/app/services/api/consultation.service';
import {VideoWebService} from 'src/app/services/api/video-web.service';
import {
    LinkType,
    ParticipantResponse,
    ParticipantStatus,
    Role,
    VideoEndpointResponse
} from 'src/app/services/clients/api-client';
import {EventsService} from 'src/app/services/events.service';
import {Logger} from 'src/app/services/logging/logger-base';
import {ParticipantStatusMessage} from 'src/app/services/models/participant-status-message';
import {RoomTransfer} from 'src/app/shared/models/room-transfer';
import {HearingRole} from '../../models/hearing-role-model';
import {WRParticipantStatusListDirective} from '../../waiting-room-shared/wr-participant-list-shared.component';
import {ParticipantListItem} from '../participant-list-item';

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
        protected translateService: TranslateService
    ) {
        super(consultationService, eventService, videoWebService, logger, translateService);
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

    canCallEndpoint(endpoint: VideoEndpointResponse): boolean {
        return (
            !this.isParticipantInCurrentRoom(endpoint) &&
            this.isEndpointAvailable(endpoint) &&
            this.participantEndpoints.some(x => x.id === endpoint.id)
        );
    }

    getRowClasses(participant: any): string {
        return this.isParticipantInCurrentRoom(participant) ? 'yellow' : '';
    }

    isJohInCurrentRoom(participant: ParticipantResponse): boolean {
        return (
            this.isParticipantInCurrentRoom(participant) &&
            (this.isParticipantPanelMember(participant.hearing_role) ||
                participant.hearing_role === HearingRole.WINGER ||
                participant.hearing_role === HearingRole.JUDGE)
        );
    }

    isJohConsultation(): boolean {
        return this.roomLabel?.toLowerCase().includes('judgejohconsultationroom');
    }

    getPrivateConsultationParticipants(): ParticipantListItem[] {
        const participants = this.nonJudgeParticipants.filter(x => x.hearing_role !== HearingRole.INTERPRETER);
        return participants.map(c => {
            return this.mapResponseToListItem(c);
        });
    }

    setJohGroupResult(): void {
        const johGroupsUnmapped = [[...this.panelMembers], [...this.wingers]];
        this.johGroupResult = johGroupsUnmapped.map(array =>
            array.map(c => {
                return this.mapResponseToListItem(c);
            })
        );
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

    getParticipantStatus(participant: any): string {
        return this.participantCallStatuses[participant.id];
    }

    isParticipantAvailable(participant: any): boolean {
        const availableStatuses = ['Available', 'Connected', 'InConsultation'];
        return availableStatuses.indexOf(participant.status) >= 0;
    }

    isParticipantInCurrentRoom(participant: any): boolean {
        return participant.current_room?.label === this.roomLabel;
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

    canCallParticipant(participant: ParticipantResponse): boolean {
        return !this.isParticipantInCurrentRoom(participant) && participant.status === ParticipantStatus.Available;
    }

    trackParticipant(index: number, item: ParticipantListItem) {
        return item.status;
    }

    private mapResponseToListItem(participantResponse: ParticipantResponse): ParticipantListItem {
        const participant: ParticipantListItem = { ...participantResponse };
        const interpreterLink = participantResponse.linked_participants?.find(x => x.link_type === LinkType.Interpreter);
        if (interpreterLink) {
            participant.interpreter = this.conference.participants.find(x => x.id === interpreterLink.linked_id);
        }
        return participant;
    }

    private sortAndMapToListItem(participantResponses: Array<ParticipantResponse>): Array<ParticipantListItem> {
        return participantResponses.map(c => {
            return this.mapResponseToListItem(c);
        });
    }

    participantHasInviteRestrictions(participant: ParticipantListItem): boolean {
        const userIsJudicial = (this.loggedInUser.role == Role.Judge || this.loggedInUser.role == Role.StaffMember ||  this.loggedInUser.role == Role.JudicialOfficeHolder);
        if(!userIsJudicial)
            switch (participant.hearing_role) {
                case HearingRole.INTERPRETER:
                case HearingRole.WINGER:
                case HearingRole.WITNESS:
                case HearingRole.OBSERVER:
                case HearingRole.JUDGE:
                case HearingRole.STAFF_MEMBER:
                case HearingRole.PANEL_MEMBER:
                    return true
                default: return false
            }
        return false;
    }
}
