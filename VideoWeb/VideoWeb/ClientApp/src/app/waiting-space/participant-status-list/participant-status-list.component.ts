import { Component, Input, NgZone, OnInit } from '@angular/core';
import { AdalService } from 'adal-angular4';
import { SnotifyButton } from 'ng-snotify';
import {
  ConferenceResponse, ConsultationAnswer, ParticipantResponse, ParticipantStatus, UserRole
} from 'src/app/services/clients/api-client';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import { EventsService } from 'src/app/services/events.service';
import { ConsultationMessage } from 'src/app/services/models/consultation-message';
import { NotificationService } from 'src/app/services/notification.service';
import { ParticipantStatusMessage } from 'src/app/services/models/participant-status-message';

@Component({
  selector: 'app-participant-status-list',
  templateUrl: './participant-status-list.component.html',
  styleUrls: ['./participant-status-list.component.scss']
})
export class ParticipantStatusListComponent implements OnInit {

  @Input() conference: ConferenceResponse;

  nonJugdeParticipants: ParticipantResponse[];
  judge: ParticipantResponse;

  constructor(
    private adalService: AdalService,
    private consultationService: ConsultationService,
    private eventService: EventsService,
    private ngZone: NgZone,
    private notificationService: NotificationService
  ) { }

  ngOnInit() {
    this.filterNonJudgeParticipants();
    this.filterJudge();
    this.setupSubscribers();
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
      this.raiseConsultationRequestEvent(participant);
    }
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

  private raiseConsultationRequestEvent(participant: ParticipantResponse): void {
    const requestee = this.conference.participants.find(x => x.id === participant.id);
    const requester = this.conference.participants.find
      (x => x.username.toLowerCase() === this.adalService.userInfo.userName.toLocaleLowerCase());

    const message = 'Requesting consultation with ' + requestee.display_name;
    this.notificationService.info(message, 5000, true);

    this.consultationService.raiseConsultationRequest(this.conference, requester, requestee)
      .subscribe(() => {
        console.info('Raised consultation request event');
      },
        error => {
          console.error(error);
        }
      );
  }

  private displayConsultationRequestPopup(message: ConsultationMessage) {
    const requester = this.conference.participants.find(x => x.username === message.requestedBy);
    const requestee = this.conference.participants.find(x => x.username === message.requestedFor);

    const toastMessage = requester.display_name + ' would like to speak to you. Would you like to join a private room?';
    const buttons: SnotifyButton[] = [
      {
        text: 'Accept', bold: true, action: (toast) => {
          this.notificationService.clearNotification(toast.id);
          this.acceptConsultationRequest(requester, requestee);
        }
      },
      {
        text: 'Reject', action: (toast) => {
          this.notificationService.clearNotification(toast.id);
          this.rejectConsultationRequest(requester, requestee);
        }
      },
    ];
    this.notificationService.confirm(toastMessage, buttons, 0, true);
  }

  acceptConsultationRequest(requester: ParticipantResponse, requestee: ParticipantResponse) {
    this.consultationService.respondToConsultationRequest(this.conference, requester, requestee, ConsultationAnswer.Accepted)
      .subscribe(() => {
        console.info('accepted consultation request from ' + requester.display_name);
      },
        error => {
          alert('Failed to send response, check logs');
          console.error(error);
        }
      );
  }

  rejectConsultationRequest(requester: ParticipantResponse, requestee: ParticipantResponse) {
    this.consultationService.respondToConsultationRequest(this.conference, requester, requestee, ConsultationAnswer.Rejected)
      .subscribe(() => {
        console.info(requestee.display_name + ' rejected called request from ' + requester.display_name);
      },
        error => {
          alert('Failed to send response, check logs');
          console.error(error);
        }
      );
  }

  private handleAcceptedConsultationRequest(message: ConsultationMessage) {
    const requestee = this.conference.participants.find(x => x.username === message.requestedFor);

    const toastMessage = requestee.display_name + ' accepted your call. Please wait to be transferred.';
    this.notificationService.success(toastMessage, 5000);
  }

  private handleRejectedConsultationRequest(message: ConsultationMessage) {
    const requestee = this.conference.participants.find(x => x.username === message.requestedFor);

    const toastMessage = requestee.display_name + ' rejected your call';
    this.notificationService.error(toastMessage, 5000);
  }

  private filterNonJudgeParticipants(): void {
    this.nonJugdeParticipants = this.conference.participants.filter(x => x.role !== UserRole.Judge
      && x.role === UserRole.Representative);
  }

  private filterJudge(): void {
    this.judge = this.conference.participants.find(x => x.role === UserRole.Judge);
  }
}
