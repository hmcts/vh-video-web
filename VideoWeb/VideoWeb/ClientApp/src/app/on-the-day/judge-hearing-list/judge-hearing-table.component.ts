import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ConferenceForUserResponse, ConferenceStatus } from 'src/app/services/clients/api-client';
import { Hearing } from 'src/app/shared/models/hearing';
import { Logger } from 'src/app/services/logging/logger-base';

@Component({
  selector: 'app-judge-hearing-table',
  templateUrl: './judge-hearing-table.component.html',
  styleUrls: ['./judge-hearing-table.component.scss']
})
export class JudgeHearingTableComponent implements OnInit {

  private _conferences: ConferenceForUserResponse[];
  hearings: Hearing[];

  @Input() set conferences(conferences: ConferenceForUserResponse[]) {
    this._conferences = conferences;
    this.hearings = conferences.map(c => new Hearing(c));
  }

  @Output() selectedConference = new EventEmitter<ConferenceForUserResponse>();

  constructor(private logger: Logger) { }

  ngOnInit() {
    this.hearings = this._conferences.map(c => new Hearing(c));
  }

  signIntoConference(hearing: Hearing) {
    this.logger.info(`selected conference to sign into: ${hearing.id}`);
    const conference = this._conferences.find(x => x.id === hearing.id);
    this.selectedConference.emit(conference);
  }

  showConferenceStatus(hearing: Hearing): boolean {
    return hearing.status === ConferenceStatus.Paused ||
      hearing.status === ConferenceStatus.Suspended ||
      hearing.status === ConferenceStatus.Closed;
  }
}
