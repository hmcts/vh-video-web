import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { AdalService } from 'adal-angular4';
import { Subscription } from 'rxjs';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ConferenceResponse, ConsultationAnswer, ParticipantResponse, ParticipantStatus, Role } from 'src/app/services/clients/api-client';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { AdminConsultationMessage } from 'src/app/services/models/admin-consultation-message';
import { ConsultationMessage } from 'src/app/services/models/consultation-message';
import { ParticipantStatusMessage } from 'src/app/services/models/participant-status-message';
import { Hearing } from 'src/app/shared/models/hearing';
import { Participant } from 'src/app/shared/models/participant';
import { CaseTypeGroup } from 'src/app/waiting-space/models/case-type-group';

@Component({
    selector: 'app-individual-participant-status-list',
    templateUrl: './individual-participant-status-list.component.html',
    styleUrls: ['./individual-participant-status-list.component.scss']
})
export class IndividualParticipantStatusListComponent implements OnInit, OnDestroy {
    @Input() conference: ConferenceResponse;

    nonJugdeParticipants: ParticipantResponse[];
    judge: ParticipantResponse;
    panelMembers: ParticipantResponse[];
    observers: ParticipantResponse[];

    consultationRequestee: Participant;
    consultationRequester: Participant;

    adminConsultationMessage: AdminConsultationMessage;
    eventHubSubscriptions$ = new Subscription();

    constructor(
        private adalService: AdalService,
        private consultationService: ConsultationService,
        private eventService: EventsService,
        private logger: Logger,
        private videoWebService: VideoWebService
    ) {}

    ngOnInit() {
        this.consultationService.resetWaitingForResponse();
        this.filterNonJudgeParticipants();
        this.filterJudge();
        this.filterPanelMembers();
        this.filterObservers();
        this.setupSubscribers();
    }

    ngOnDestroy(): void {
        this.consultationService.clearOutoingCallTimeout();
        this.eventHubSubscriptions$.unsubscribe();
    }

    setupSubscribers() {
        this.eventHubSubscriptions$.add(
            this.eventService.getConsultationMessage().subscribe(message => {
                switch (message.result) {
                    case ConsultationAnswer.Accepted:
                    case ConsultationAnswer.Rejected:
                    case ConsultationAnswer.Cancelled:
                        this.consultationService.handleConsultationResponse(message.result);
                        break;
                    case ConsultationAnswer.NoRoomsAvailable:
                        this.handleNoConsulationRoom();
                        break;
                    default:
                        this.displayConsultationRequestPopup(message);
                        break;
                }
            })
        );

        this.eventHubSubscriptions$.add(
            this.eventService.getParticipantStatusMessage().subscribe(message => {
                this.handleParticipantStatusChange(message);
            })
        );

        this.eventHubSubscriptions$.add(
            this.eventService.getAdminConsultationMessage().subscribe(async message => {
                if (!message.answer) {
                    this.adminConsultationMessage = message;
                    await this.handleAdminConsultationMessage(message);
                }
            })
        );

        this.eventService.start();
    }

    handleNoConsulationRoom() {
        this.consultationService.displayNoConsultationRoomAvailableModal();
    }

    handleParticipantStatusChange(message: ParticipantStatusMessage): void {
        const isCurrentUser = this.adalService.userInfo.userName.toLocaleLowerCase() === message.username.toLowerCase();
        if (isCurrentUser && message.status === ParticipantStatus.InConsultation) {
            this.closeAllPCModals();
        }
        this.filterNonJudgeParticipants();
    }

    async handleAdminConsultationMessage(message: AdminConsultationMessage) {
        const requestee = this.conference.participants.find(x => x.username === message.requestedFor);
        if (!this.isParticipantAvailable(requestee)) {
            this.logger.info(`Ignoring request for private consultation from Video Hearings Team since participant is not available`);
            return;
        }
        this.logger.info(`Incoming request for private consultation from Video Hearings Team`);
        this.consultationRequestee = new Participant(requestee);
        this.consultationService.displayAdminConsultationRequest();
    }

    canCallParticipant(participant: ParticipantResponse): boolean {
        const hearing = new Hearing(this.conference);
        if (hearing.isStarting() || hearing.isDelayed() || hearing.isSuspended()) {
            return false;
        }

        if (participant.username.toLocaleLowerCase().trim() === this.adalService.userInfo.userName.toLocaleLowerCase().trim()) {
            return false;
        }
        return this.isParticipantAvailable(participant);
    }

    async begingCallWith(participant: ParticipantResponse): Promise<void> {
        if (!this.canCallParticipant(participant)) {
            return;
        }
        const requestee = this.conference.participants.find(x => x.id === participant.id);
        const requester = this.conference.participants.find(
            x => x.username.toLowerCase() === this.adalService.userInfo.userName.toLocaleLowerCase()
        );

        this.consultationRequester = new Participant(requester);
        this.consultationRequestee = new Participant(requestee);
        this.logger.event(`${this.videoWebService.getObfuscatedName(requester.username)} requesting private consultation with
        ${this.videoWebService.getObfuscatedName(requestee.username)}`);
        this.logger.info(`Individual participant status list: Conference Id: ${this.conference.id}
        Participant ${requester.id}, ${this.videoWebService.getObfuscatedName(requester.name)}
        calling Participant ${requestee.id}, ${this.videoWebService.getObfuscatedName(requestee.name)}`);

        try {
            await this.consultationService.raiseConsultationRequest(this.conference, requester, requestee);
            this.logger.info('Raised consultation request event');
        } catch (error) {
            this.logger.error('Failed to raise consultation request', error);
        }
    }

    async cancelConsultationRequest() {
        await this.answerConsultationRequest(ConsultationAnswer.Cancelled);
    }

    private async displayConsultationRequestPopup(message: ConsultationMessage) {
        this.initConsultationParticipants(message);

        this.logger.info(
            `Incoming request for private consultation from ${this.videoWebService.getObfuscatedName(
                this.consultationRequester.displayName
            )}`
        );
        this.consultationService.displayIncomingPrivateConsultation();
    }

    async answerConsultationRequest(consultationAnswer: ConsultationAnswer) {
        this.logger.event(`${this.consultationRequestee.displayName} responded to consultation: ${consultationAnswer}`);
        try {
            await this.consultationService.respondToConsultationRequest(
                this.conference,
                this.consultationRequester.base,
                this.consultationRequestee.base,
                consultationAnswer
            );
        } catch (error) {
            this.logger.error('Failed to respond to consultation request', error);
        }
    }

    async acceptVhoConsultationRequest(): Promise<void> {
        const displayName = this.videoWebService.getObfuscatedName(this.consultationRequestee.displayName);
        this.logger.event(`${displayName} responded to vho consultation: ${ConsultationAnswer.Accepted}`);
        try {
            await this.consultationService.respondToAdminConsultationRequest(
                this.conference,
                this.consultationRequestee.base,
                ConsultationAnswer.Accepted,
                this.adminConsultationMessage.roomType
            );
        } catch (error) {
            this.logger.error('Failed to respond to admin consultation request', error);
        }
    }

    closeAllPCModals(): void {
        this.consultationService.clearModals();
    }

    private initConsultationParticipants(message: ConsultationMessage): void {
        const requester = this.conference.participants.find(x => x.username === message.requestedBy);
        const requestee = this.conference.participants.find(x => x.username === message.requestedFor);
        this.consultationRequester = new Participant(requester);
        this.consultationRequestee = new Participant(requestee);
    }

    getParticipantStatusText(participant: ParticipantResponse): string {
        return participant.status === ParticipantStatus.Available ? 'Available' : 'Unavailable';
    }

    isParticipantAvailable(participant: ParticipantResponse): boolean {
        return participant.status === ParticipantStatus.Available;
    }

    private filterNonJudgeParticipants(): void {
        this.nonJugdeParticipants = this.conference.participants.filter(
            x => x.role !== Role.Judge && x.case_type_group !== CaseTypeGroup.OBSERVER && x.case_type_group !== CaseTypeGroup.PANEL_MEMBER
        );
    }

    private filterJudge(): void {
        this.judge = this.conference.participants.find(x => x.role === Role.Judge);
    }

    private filterPanelMembers(): void {
        this.panelMembers = this.conference.participants.filter(x => x.case_type_group === CaseTypeGroup.PANEL_MEMBER);
    }

    private filterObservers(): void {
        this.observers = this.conference.participants.filter(x => x.case_type_group === CaseTypeGroup.OBSERVER);
    }

    get getNumberParticipants() {
        return this.nonJugdeParticipants.length + this.observers.length + this.panelMembers.length;
    }
}
