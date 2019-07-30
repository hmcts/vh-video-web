import { Component, Input, NgZone, OnInit, Output } from '@angular/core';
import { AdalService } from 'adal-angular4';
import { SnotifyButton } from 'ng-snotify';
import {
  ConferenceResponse, ConsultationAnswer, ParticipantResponse, ParticipantStatus, UserRole
} from 'src/app/services/clients/api-client';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import { EventsService } from 'src/app/services/events.service';
import { ConsultationMessage } from 'src/app/services/models/consultation-message';
import { NotificationService } from 'src/app/services/notification.service';
import { ModalService } from 'src/app/services/modal.service';
import { Logger } from 'src/app/services/logging/logger-base';
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

  constructor(
    private adalService: AdalService,
    private consultationService: ConsultationService,
    private eventService: EventsService,
    private ngZone: NgZone,
    private modalService: ModalService,
    private logger: Logger
  ) { }

  ngOnInit() {
    this.filterNonJudgeParticipants();
    this.filterJudge();
    this.setupSubscribers();
  }

  private setupSubscribers() {
    this.eventService.start();

    this.eventService.getConsultationMessage().subscribe(message => {
      this.ngZone.run(() => {
        if (message.result === ConsultationAnswer.Accepted) {
          this.handleAcceptedConsultationRequest(message);
        } else if (message.result === ConsultationAnswer.Rejected) {
          this.handleRejectedConsultationRequest(message);
        } else {
          this.displayConsultationRequestPopup(message);
        }
      });
    });
  }

  isParticipantAvailable(participant: ParticipantResponse): boolean {
    return participant.status === ParticipantStatus.Available;
  }

  getParticipantStatusText(participant: ParticipantResponse): string {
    return participant.status === ParticipantStatus.Available ? 'Available' : 'Unavailable';
  }

  canCallParticipant(participant: ParticipantResponse): boolean {
    if (this.judge.username.toLocaleLowerCase().trim() === this.adalService.userInfo.userName.toLocaleLowerCase().trim()) {
      return false;
    }
    if (participant.username.toLocaleLowerCase().trim() === this.adalService.userInfo.userName.toLocaleLowerCase().trim()) {
      return false;
    }
    return this.isParticipantAvailable(participant);
  }

  begingCallWith(participant: ParticipantResponse): void {
    if (this.canCallParticipant(participant)) {
      this.modalService.open('raise-pc-modal');
      const requestee = this.conference.participants.find(x => x.id === participant.id);
      const requester = this.conference.participants.find
        (x => x.username.toLowerCase() === this.adalService.userInfo.userName.toLocaleLowerCase());

      this.consultationRequestee = new Participant(requestee);
      this.logger.event(`${requester.username} requesting private consultation with ${requestee.username}`);
      this.consultationService.raiseConsultationRequest(this.conference, requester, requestee)
        .subscribe(() => {
          this.logger.info('Raised consultation request event');
        },
          error => {
            this.logger.error('Failed to raise consultation request', error);
          }
        );
    }
  }

  cancelConsultationRequest() {
    this.modalService.close('raise-pc-modal');
  }

  private displayConsultationRequestPopup(message: ConsultationMessage) {
    const requester = this.conference.participants.find(x => x.username === message.requestedBy);
    const requestee = this.conference.participants.find(x => x.username === message.requestedFor);
    this.consultationRequester = new Participant(requester);
    this.consultationRequestee = new Participant(requestee);
    this.modalService.open('receive-pc-modal');
  }

  async answerConsultationRequest(answer: ConsultationAnswer) {
    this.modalService.close('receive-pc-modal');
    this.logger.event(`${this.consultationRequestee.displayName} responded to consultation: ${answer}`);

    try {
      await this.consultationService.respondToConsultationRequest(
        this.conference, this.consultationRequester.base,
        this.consultationRequestee.base,
        ConsultationAnswer.Accepted).toPromise();
    } catch (error) {
      this.logger.error('Failed to respond to consultation request', error);
    }
  }

  private handleAcceptedConsultationRequest(message: ConsultationMessage) {
    this.modalService.close('raise-pc-modal');
    const requester = this.conference.participants.find(x => x.username === message.requestedBy);
    const requestee = this.conference.participants.find(x => x.username === message.requestedFor);
    this.consultationRequester = new Participant(requester);
    this.consultationRequestee = new Participant(requestee);
    this.modalService.open('accepted-pc-modal');
  }

  private handleRejectedConsultationRequest(message: ConsultationMessage) {
    this.modalService.close('raise-pc-modal');
    const requester = this.conference.participants.find(x => x.username === message.requestedBy);
    const requestee = this.conference.participants.find(x => x.username === message.requestedFor);
    this.consultationRequester = new Participant(requester);
    this.consultationRequestee = new Participant(requestee);
    this.modalService.open('rejected-pc-modal');
  }

  closeConsultationRejection() {
    this.modalService.close('rejected-pc-modal');
  }

  private filterNonJudgeParticipants(): void {
    this.nonJugdeParticipants = this.conference.participants.filter(x => x.role !== UserRole.Judge);
  }

  private filterJudge(): void {
    this.judge = this.conference.participants.find(x => x.role === UserRole.Judge);
  }
}
