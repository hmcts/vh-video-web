import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ConferenceForUserResponse, ConferenceResponse, ConferenceStatus } from 'src/app/services/clients/api-client';
import { Hearing } from 'src/app/shared/models/hearing';

@Component({
  selector: 'app-vho-hearing-list',
  templateUrl: './vho-hearing-list.component.html',
  styleUrls: ['./vho-hearing-list.component.scss']
})
export class VhoHearingListComponent implements OnInit {

  @Input() conferences: ConferenceForUserResponse[];
  @Output() selectedConference = new EventEmitter<ConferenceForUserResponse>();
  currentConference: ConferenceForUserResponse;

  constructor() { }

  ngOnInit() {
  }

  isCurrentConference(conference: ConferenceForUserResponse): boolean {
    return this.currentConference != null && this.currentConference.id === conference.id;
  }

  isOnTime(conference: ConferenceResponse): boolean {
    return new Hearing(conference).isOnTime();
  }

  isSuspended(conference: ConferenceResponse): boolean {
    return conference.status === ConferenceStatus.Suspended;
  }

  isDelayed(conference: ConferenceResponse): boolean {
    return new Hearing(conference).isDelayed();
  }

  isPaused(conference: ConferenceResponse): boolean {
    return new Hearing(conference).isPaused();
  }

  isInSession(conference: ConferenceResponse): boolean {
    return new Hearing(conference).isInSession();
  }

  isClosed(conference: ConferenceResponse): boolean {
    return new Hearing(conference).isClosed();
  }

  getConferenceStatusText(conference: ConferenceResponse): string {
    const hearing = new Hearing(conference);
    if (hearing.getConference().status === ConferenceStatus.NotStarted) {
      if (hearing.isDelayed()) {
        return 'Delayed';
      } else {
        return 'Ready';
      }
    } else if (hearing.isSuspended()) {
      return 'Suspended';
    } else if (hearing.isPaused()) {
      return 'Paused';
    } else if (hearing.isClosed()) {
      return 'Closed';
    } else if (hearing.isInSession()) {
      return 'In Session';
    }
    return '';
  }

  getDuration(conference: ConferenceResponse): string {
    return new Hearing(conference).getDurationAsText();
  }

  selectConference(conference: ConferenceForUserResponse) {
    this.currentConference = conference;
    this.selectedConference.emit(conference);
  }
}
