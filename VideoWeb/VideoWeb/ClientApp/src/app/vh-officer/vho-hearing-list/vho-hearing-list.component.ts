import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ConferenceResponse, ConferenceStatus, ConferenceForVhOfficerResponse } from 'src/app/services/clients/api-client';
import { Hearing } from 'src/app/shared/models/hearing';
import { ClipboardService } from 'ngx-clipboard';
import { PackageLost } from '../services/models/package-lost';
import { ParticipantGraphInfo } from '../services/models/participant-graph-info';
import { MonitorGraphService } from '../services/monitor-graph.service';

@Component({
  selector: 'app-vho-hearing-list',
  templateUrl: './vho-hearing-list.component.html',
  styleUrls: ['./vho-hearing-list.component.scss']
})
export class VhoHearingListComponent implements OnInit {
  @Input() conferences: ConferenceForVhOfficerResponse[];
  @Output() selectedConference = new EventEmitter<ConferenceForVhOfficerResponse>();
  currentConference: ConferenceForVhOfficerResponse;

  displayGraph = false;
  packageLostArray: PackageLost[];
  selectedParticipant: ParticipantGraphInfo;

  constructor(private clipboardService: ClipboardService, private monitorGraphService: MonitorGraphService) { }

  ngOnInit() { this.packageLostArray = this.monitorGraphService.getTestData(); }

  isCurrentConference(conference: ConferenceForVhOfficerResponse): boolean {
    return this.currentConference != null && this.currentConference.id === conference.id;
  }

  isOnTime(conference: ConferenceResponse): boolean {
    return new Hearing(conference).isOnTime() || new Hearing(conference).isStarting();
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
        return 'Not Started';
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

  selectConference(conference: ConferenceForVhOfficerResponse) {
    this.currentConference = conference;
    this.selectedConference.emit(conference);
  }

  copyToClipboard(conference: ConferenceForVhOfficerResponse) {
    this.clipboardService.copyFromContent(conference.id);
  }

  showMonitoringGraph() {
    this.displayGraph = !this.displayGraph;
    this.selectedParticipant = new ParticipantGraphInfo('Ms Steve Adams', 'In hearing');
  }

  closeGraph(value) {
    this.displayGraph = !value;
  }
}
