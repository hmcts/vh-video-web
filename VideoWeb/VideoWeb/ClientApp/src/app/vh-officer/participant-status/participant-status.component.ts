import {Component, HostListener, Input, OnDestroy, OnInit} from '@angular/core';
import {ParticipantResponseVho, ParticipantStatus} from 'src/app/services/clients/api-client';
import {Participant} from 'src/app/shared/models/participant';
import {ParticipantStatusModel} from 'src/app/shared/models/participants-status-model';
import {Subscription} from 'rxjs';
import {VideoWebService} from '../../services/api/video-web.service';
import {ErrorService} from '../../services/error.service';
import {Logger} from '../../services/logging/logger-base';

@Component({
  selector: 'app-participant-status',
  templateUrl: './participant-status.component.html',
  styleUrls: ['./participant-status.component.scss']
})
export class ParticipantStatusComponent implements OnInit, OnDestroy {
  _participants: Participant[];
  _judgeStatuses: ParticipantStatus[];
  _venueName: string;
  loadingData: boolean;
  conferencesSubscription: Subscription;

  @Input() set participants(participants: ParticipantStatusModel) {
    this._participants = participants.Participants;
    this._judgeStatuses = participants.JudgeStatuses;
    this._venueName = participants.HearingVenueName;
  }

  constructor(private videoWebService: VideoWebService, private errorService: ErrorService, private logger: Logger) {
    this.loadingData = true;
  }

  ngOnInit(): void {
    this.logger.info('Loading VH Officer Dashboard Participant Status list');
    this.conferencesSubscription = this.videoWebService.getConferenceParticipantContactDetails(this._participants.map(x => x.username)).subscribe(
      (data: ParticipantResponseVho[]) => {
        this.loadingData = false;
        // Map the participant contact details to the this._participants
      },
      (error) => {
        this.logger.error('There was an error getting the VH Officer dashboard participant status list of names', error);
        this.loadingData = false;
        this.errorService.handleApiError(error);
      }
    );
  }

  @HostListener('window:beforeunload')
  ngOnDestroy(): void {
    if (this.conferencesSubscription) {
      this.conferencesSubscription.unsubscribe();
    }
  }

  getParticipantStatusClass(participant: Participant): string {
    switch (participant.status) {
      case ParticipantStatus.None:
      case ParticipantStatus.NotSignedIn:
        return 'participant-not-signed-in';
      case ParticipantStatus.Disconnected:
        return 'participant-disconnected';
      case ParticipantStatus.Available:
        return 'participant-available';
      default:
        return 'participant-default-status';
    }
  }
}
