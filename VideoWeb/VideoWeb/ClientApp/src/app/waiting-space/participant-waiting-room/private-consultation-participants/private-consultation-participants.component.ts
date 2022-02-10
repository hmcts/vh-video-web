import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { LinkType, ParticipantResponse, ParticipantStatus, VideoEndpointResponse } from 'src/app/services/clients/api-client';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { ParticipantStatusMessage } from 'src/app/services/models/participant-status-message';
import { RoomTransfer } from 'src/app/shared/models/room-transfer';
import { HearingRole } from '../../models/hearing-role-model';
import { WRParticipantStatusListDirective } from '../../waiting-room-shared/wr-participant-list-shared.component';
import { ParticipantListItem } from '../participant-list-item';

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
        this.johGroups();
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

    get endpointInRoom(): boolean {
        return this.conference.endpoints.some(x => this.isParticipantInCurrentRoom(x));
    }

    canCallEndpoint(endpoint: VideoEndpointResponse): boolean {
        return (
            !this.isParticipantInCurrentRoom(endpoint) &&
            this.isEndpointAvailable(endpoint) &&
            !this.endpointInRoom &&
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
        return this.sortAndMapToListItem(
            this.nonJudgeParticipants.filter(x => x.hearing_role !== HearingRole.WITNESS && x.hearing_role !== HearingRole.INTERPRETER)
        );
    }

    johGroups(): void {
        const johGroupsUnmapped = [[...this.panelMembers], [...this.wingers]];
        this.johGroupResult = johGroupsUnmapped.map(array =>
            array.map(c => {
                return this.mapResponseToListItem(c);
            })
        );
    }

    async handleParticipantStatusChange(message: ParticipantStatusMessage): Promise<void> {
        await super.handleParticipantStatusChange(message);
        this.johGroups();
    }

    getWitnessesAndObservers(): ParticipantListItem[] {
        if (!this.isJohConsultation()) {
            return [];
        }
        const witnesses = this.sortAndMapToListItem(
            this.nonJudgeParticipants.filter(participant => participant.hearing_role === HearingRole.WITNESS)
        );
        const observers = this.sortAndMapToListItem(this.observers);
        return [...witnesses, ...observers];
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

    async handleRoomChange(message: RoomTransfer): Promise<void> {
        this.filterNonJudgeParticipants();
        this.johGroups();
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
        return participantResponses
            .sort((a, b) => a.display_name.localeCompare(b.display_name))
            .map(c => {
                return this.mapResponseToListItem(c);
            });
    }
}
