import { Component, Input, OnInit } from '@angular/core';
import { AdalService } from 'adal-angular4';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ConferenceResponse, ConsultationAnswer, ParticipantResponse, ParticipantStatus, Role } from 'src/app/services/clients/api-client';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { ModalService } from 'src/app/services/modal.service';
import { AdminConsultationMessage } from 'src/app/services/models/admin-consultation-message';
import { ConsultationMessage } from 'src/app/services/models/consultation-message';
import { ParticipantStatusMessage } from 'src/app/services/models/participant-status-message';
import { Hearing } from 'src/app/shared/models/hearing';
import { Participant } from 'src/app/shared/models/participant';

@Component({
    selector: 'app-individual-participant-status-list',
    templateUrl: './individual-participant-status-list.component.html',
    styleUrls: ['./individual-participant-status-list.component.scss']
})
export class IndividualParticipantStatusListComponent implements OnInit {
    @Input() conference: ConferenceResponse;

    nonJugdeParticipants: ParticipantResponse[];
    judge: ParticipantResponse;

    consultationRequestee: Participant;
    consultationRequester: Participant;

    callRingingSound: HTMLAudioElement;
    outgoingCallTimeout: NodeJS.Timer;
    waitingForConsultationResponse: boolean;
    private readonly CALL_TIMEOUT = 120000;

    private readonly REQUEST_PC_MODAL = 'raise-pc-modal';
    private readonly RECIEVE_PC_MODAL = 'receive-pc-modal';
    private readonly ACCEPTED_PC_MODAL = 'accepted-pc-modal';
    private readonly REJECTED_PC_MODAL = 'rejected-pc-modal';
    private readonly VHO_REQUEST_PC_MODAL = 'vho-raise-pc-modal';
    adminConsultationMessage: AdminConsultationMessage;

    constructor(
        private adalService: AdalService,
        private consultationService: ConsultationService,
        private eventService: EventsService,

        private modalService: ModalService,
        private logger: Logger,
        private videoWebService: VideoWebService
    ) {}

    ngOnInit() {
        this.waitingForConsultationResponse = false;
        this.initCallRingingSound();
        this.filterNonJudgeParticipants();
        this.filterJudge();
        this.setupSubscribers();
    }

    initCallRingingSound(): void {
        this.callRingingSound = new Audio();
        this.callRingingSound.src = '/assets/audio/consultation_request.mp3';
        this.callRingingSound.load();
        this.callRingingSound.addEventListener(
            'ended',
            function() {
                this.play();
            },
            false
        );
    }

    stopCallRinging() {
        clearTimeout(this.outgoingCallTimeout);
        this.callRingingSound.pause();
        this.callRingingSound.currentTime = 0;
    }

    async cancelOutgoingCall() {
        if (!this.waitingForConsultationResponse) {
            return;
        }
        this.stopCallRinging();
        this.waitingForConsultationResponse = false;
        this.logger.info('Consultation request timed-out. Cancelling call');
        await this.answerConsultationRequest(ConsultationAnswer.Cancelled);
        this.displayModal(this.REJECTED_PC_MODAL);
    }

    setupSubscribers() {
        this.eventService.getConsultationMessage().subscribe(message => {
            if (message.result === ConsultationAnswer.Accepted) {
                this.handleAcceptedConsultationRequest(message);
            } else if (message.result === ConsultationAnswer.Rejected) {
                this.handleRejectedConsultationRequest(message);
            } else if (message.result === ConsultationAnswer.Cancelled) {
                this.handleCancelledConsultationRequest(message);
            } else {
                this.displayConsultationRequestPopup(message);
            }
        });

        this.eventService.getParticipantStatusMessage().subscribe(message => {
            this.handleParticipantStatusChange(message);
        });

        this.eventService.getAdminConsultationMessage().subscribe(message => {
            if (!message.answer) {
                this.adminConsultationMessage = message;
                this.handleAdminConsultationMessage(message);
            }
        });

        this.eventService.start();
    }

    handleAdminConsultationMessage(message: AdminConsultationMessage) {
        const requestee = this.conference.participants.find(x => x.username === message.requestedFor);
        if (!this.isParticipantAvailable(requestee)) {
            this.logger.info(`Ignoring request for private consultation from Video Hearings Team since participant is not available`);
            return;
        }
        this.logger.info(`Incoming request for private consultation from Video Hearings Team`);
        this.consultationRequestee = new Participant(requestee);
        this.displayModal(this.VHO_REQUEST_PC_MODAL);
        this.startCallRinging(false);
    }

    handleParticipantStatusChange(message: ParticipantStatusMessage): void {
        // const isCurrentUser = this.adalService.userInfo.userName.toLocaleLowerCase() === message.email.toLowerCase();
        const isCurrentUser = this.conference.participants.find(p => p.id === message.participantId);
        if (isCurrentUser && message.status === ParticipantStatus.InConsultation) {
            this.closeAllPCModals();
        }
        this.filterNonJudgeParticipants();
    }

    isParticipantAvailable(participant: ParticipantResponse): boolean {
        return participant.status === ParticipantStatus.Available;
    }

    getParticipantStatusText(participant: ParticipantResponse): string {
        return participant.status === ParticipantStatus.Available ? 'Available' : 'Unavailable';
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
        this.displayModal(this.REQUEST_PC_MODAL);
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
            await this.startCallRinging(true);
        } catch (error) {
            this.logger.error('Failed to raise consultation request', error);
        }
    }

    async startCallRinging(outgoingCall: boolean) {
        if (outgoingCall) {
            this.waitingForConsultationResponse = true;
            this.outgoingCallTimeout = setTimeout(async () => {
                await this.cancelOutgoingCall();
            }, this.CALL_TIMEOUT);
        }
        if (this.adminConsultationMessage) {
            this.outgoingCallTimeout = setTimeout(async () => {
                this.stopCallRinging();
                this.closeAllPCModals();
            }, this.CALL_TIMEOUT);
        }
        await this.callRingingSound.play();
    }

    async cancelConsultationRequest() {
        this.stopCallRinging();
        this.closeAllPCModals();
        this.answerConsultationRequest(ConsultationAnswer.Cancelled);
    }

    private displayConsultationRequestPopup(message: ConsultationMessage) {
        const requester = this.conference.participants.find(x => x.username === message.requestedBy);
        const requestee = this.conference.participants.find(x => x.username === message.requestedFor);
        this.logger.info(`Incoming request for private consultation from ${requester.display_name}`);
        this.consultationRequester = new Participant(requester);
        this.consultationRequestee = new Participant(requestee);
        this.displayModal(this.RECIEVE_PC_MODAL);
        this.startCallRinging(false);
    }

    async answerConsultationRequest(answer: string) {
        const consultationAnswer = ConsultationAnswer[answer];
        this.waitingForConsultationResponse = false;
        this.closeAllPCModals();
        this.stopCallRinging();
        this.logger.event(`${this.consultationRequestee.displayName} responded to consultation: ${answer}`);
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
        this.waitingForConsultationResponse = false;
        this.closeAllPCModals();
        this.stopCallRinging();
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

    private handleAcceptedConsultationRequest(message: ConsultationMessage) {
        this.stopCallRinging();
        this.initConsultationParticipants(message);
        this.displayModal(this.ACCEPTED_PC_MODAL);
    }

    private handleRejectedConsultationRequest(message: ConsultationMessage) {
        this.stopCallRinging();
        this.initConsultationParticipants(message);
        this.displayModal(this.REJECTED_PC_MODAL);
    }

    private handleCancelledConsultationRequest(message: ConsultationMessage) {
        this.initConsultationParticipants(message);
        this.stopCallRinging();
        this.closeAllPCModals();
    }

    displayModal(modalId: string) {
        this.closeAllPCModals();
        this.modalService.open(modalId);
    }

    private closeAllPCModals(): void {
        this.modalService.close(this.REQUEST_PC_MODAL);
        this.modalService.close(this.RECIEVE_PC_MODAL);
        this.modalService.close(this.ACCEPTED_PC_MODAL);
        this.modalService.close(this.REJECTED_PC_MODAL);
        this.modalService.close(this.VHO_REQUEST_PC_MODAL);
    }

    closeConsultationRejection() {
        this.stopCallRinging();
        this.closeAllPCModals();
        this.waitingForConsultationResponse = false;
    }

    private initConsultationParticipants(message: ConsultationMessage): void {
        const requester = this.conference.participants.find(x => x.username === message.requestedBy);
        const requestee = this.conference.participants.find(x => x.username === message.requestedFor);
        this.consultationRequester = new Participant(requester);
        this.consultationRequestee = new Participant(requestee);
    }

    private filterNonJudgeParticipants(): void {
        this.nonJugdeParticipants = this.conference.participants.filter(x => x.role !== Role.Judge);
    }

    private filterJudge(): void {
        this.judge = this.conference.participants.find(x => x.role === Role.Judge);
    }
}
