import { Component, OnInit, Input, NgZone } from '@angular/core';
import {
  ConferenceResponse, ParticipantResponse, UserRole,
  ParticipantStatus, ConsultationRequestAnswer
} from 'src/app/services/clients/api-client';
import { AdalService } from 'adal-angular4';
import { SnotifyService, SnotifyPosition } from 'ng-snotify';
import { ConsultationService } from 'src/app/services/consultation.service';
import { ServerSentEventsService } from 'src/app/services/server-sent-events.service';
import { ConsultationMessage } from 'src/app/services/models/consultation-message';

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
    private snotifyService: SnotifyService,
    private eventService: ServerSentEventsService,
    private ngZone: NgZone,
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
    if (participant.username === this.adalService.userInfo.userName) {
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
        if (message.result === ConsultationRequestAnswer.Accepted) {
          this.handleAcceptedConsultationRequest(message);
        } else if (message.result === ConsultationRequestAnswer.Rejected) {
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
    this.snotifyService.info(message, {
      position: SnotifyPosition.rightTop,
      showProgressBar: false,
      timeout: 5000,
      closeOnClick: true
    });

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
    this.snotifyService.confirm(toastMessage, {
      position: SnotifyPosition.rightTop,
      showProgressBar: true,
      closeOnClick: false,
      titleMaxLength: 150,
      timeout: 0,
      buttons: [
        {
          text: 'Accept', bold: true, action: (toast) => {
            this.snotifyService.remove(toast.id);
            this.acceptConsultationRequest(requester, requestee);
          }
        },
        {
          text: 'Reject', action: (toast) => {
            this.snotifyService.remove(toast.id);
            this.rejectConsultationRequest(requester, requestee);
          }
        },
      ]
    });

  }

  acceptConsultationRequest(requester: ParticipantResponse, requestee: ParticipantResponse) {
    this.consultationService.respondToConsultationRequest(this.conference, requester, requestee, ConsultationRequestAnswer.Accepted)
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
    this.consultationService.respondToConsultationRequest(this.conference, requester, requestee, ConsultationRequestAnswer.Rejected)
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
    this.snotifyService.success(toastMessage, {
      position: SnotifyPosition.rightTop,
      showProgressBar: false,
      timeout: 5000,
      titleMaxLength: 50
    });
  }

  private handleRejectedConsultationRequest(message: ConsultationMessage) {
    const requestee = this.conference.participants.find(x => x.username === message.requestedFor);

    const toastMessage = requestee.display_name + ' rejected your call';
    this.snotifyService.error(toastMessage, {
      position: SnotifyPosition.rightTop,
      showProgressBar: false,
      timeout: 5000,
      titleMaxLength: 50
    });
  }

  private filterNonJudgeParticipants(): void {
    this.nonJugdeParticipants = this.conference.participants.filter(x => x.role !== UserRole.Judge);
  }

  private filterJudge(): void {
    this.judge = this.conference.participants.find(x => x.role === UserRole.Judge);
  }


}
