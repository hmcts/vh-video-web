import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AdalService } from 'adal-angular4';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ParticipantResponse, ParticipantStatus, VideoEndpointResponse } from 'src/app/services/clients/api-client';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { Hearing } from 'src/app/shared/models/hearing';
import { HearingRole } from '../models/hearing-role-model';
import { WRParticipantStatusListDirective } from '../waiting-room-shared/wr-participant-list-shared.component';

@Component({
    selector: 'app-individual-participant-status-list',
    templateUrl: './individual-participant-status-list.component.html',
    styleUrls: ['./individual-participant-status-list.component.scss']
})
export class IndividualParticipantStatusListComponent extends WRParticipantStatusListDirective implements OnInit, OnDestroy {
    wingers: ParticipantResponse[];
    constructor(
        protected adalService: AdalService,
        protected consultationService: ConsultationService,
        protected eventService: EventsService,
        protected logger: Logger,
        protected videoWebService: VideoWebService,
        protected route: ActivatedRoute
    ) {
        super(adalService, consultationService, eventService, videoWebService, logger);
    }

    ngOnInit() {
        this.loggedInUser = this.route.snapshot.data['loggedUser'];
        this.initParticipants();
        this.setupSubscribers();
    }

    ngOnDestroy(): void {
        this.executeTeardown();
    }

    setupSubscribers() {
        this.addSharedEventHubSubcribers();
    }

    canCallParticipant(participant: ParticipantResponse): boolean {
        const hearing = new Hearing(this.conference);
        if (hearing.isStarting() || hearing.isDelayed() || hearing.isSuspended()) {
            return false;
        }

        const requester = this.conference.participants.find(x => x.id === this.loggedInUser.participant_id);
        if (
            requester.hearing_role === HearingRole.OBSERVER ||
            requester.hearing_role === HearingRole.PANEL_MEMBER ||
            requester.hearing_role === HearingRole.WINGER ||
            requester.hearing_role === HearingRole.WITNESS
        ) {
            return false;
        }

        if (participant.id === this.loggedInUser.participant_id) {
            return false;
        }
        return this.isParticipantAvailable(participant);
    }

    canCallEndpoint(endpoint: VideoEndpointResponse): boolean {
        const hearing = new Hearing(this.conference);
        if (hearing.isStarting() || hearing.isDelayed() || hearing.isSuspended()) {
            return false;
        }
        if (!endpoint.defence_advocate_username) {
            return false;
        }
        if (
            endpoint.defence_advocate_username.toLocaleLowerCase().trim() !== this.adalService.userInfo.userName.toLocaleLowerCase().trim()
        ) {
            return false;
        }

        return this.isEndpointAvailable(endpoint);
    }

    getParticipantStatusText(participant: ParticipantResponse): string {
        return participant.status === ParticipantStatus.Available ? 'Available' : 'Unavailable';
    }

    getParticipantStatusCss(participant: ParticipantResponse): string {
        if (participant.status !== ParticipantStatus.Available && participant.status !== ParticipantStatus.InConsultation) {
            return 'unavailable';
        } else if (participant.status === ParticipantStatus.InConsultation) {
            return 'in-consultation';
        }
    }

    getParticipantStatus(participant: ParticipantResponse): string {
        if (participant.status !== ParticipantStatus.Available && participant.status !== ParticipantStatus.InConsultation) {
            return 'Unavailable';
        }

        if (participant.status === ParticipantStatus.InConsultation && participant.current_room != null) {
            return (
                'In ' +
                this.camelToSpaced(participant.current_room.label.replace('ParticipantConsultationRoom', 'MeetingRoom')).toLowerCase() +
                (participant.current_room.locked ? ' <span class="fas fa-lock-alt"></span>' : '')
            );
        }
    }
}
