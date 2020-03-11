import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ConferenceForVhOfficerResponse, ConferenceStatus } from 'src/app/services/clients/api-client';
import { ClipboardService } from 'ngx-clipboard';
import { HearingSummary } from 'src/app/shared/models/hearing-summary';
import { ParticipantGraphInfo } from '../services/models/participant-graph-info';
import { PackageLost } from '../services/models/package-lost';
import { VideoWebService } from '../../services/api/video-web.service';

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

  constructor(private clipboardService: ClipboardService,
    private videoWebService: VideoWebService) { }

  ngOnInit() { }

  isCurrentConference(conference: ConferenceForVhOfficerResponse): boolean {
    return this.currentConference != null && this.currentConference.id === conference.id;
  }

  isOnTime(conference: ConferenceForVhOfficerResponse): boolean {
    return new HearingSummary(conference).isOnTime() || new HearingSummary(conference).isStarting();
  }

  isSuspended(conference: ConferenceForVhOfficerResponse): boolean {
    return conference.status === ConferenceStatus.Suspended;
  }

  isDelayed(conference: ConferenceForVhOfficerResponse): boolean {
    return new HearingSummary(conference).isDelayed();
  }

  isPaused(conference: ConferenceForVhOfficerResponse): boolean {
    return new HearingSummary(conference).isPaused();
  }

  isInSession(conference: ConferenceForVhOfficerResponse): boolean {
    return new HearingSummary(conference).isInSession();
  }

  isClosed(conference: ConferenceForVhOfficerResponse): boolean {
    return new HearingSummary(conference).isClosed();
  }

  getConferenceStatusText(conference: ConferenceForVhOfficerResponse): string {
    const hearing = new HearingSummary(conference);
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

  getDuration(conference: ConferenceForVhOfficerResponse): string {
    return new HearingSummary(conference).getDurationAsText();
  }

  selectConference(conference: ConferenceForVhOfficerResponse) {
    this.currentConference = conference;
    this.selectedConference.emit(conference);
    this.closeGraph(true);
  }

  copyToClipboard(conference: ConferenceForVhOfficerResponse) {
    this.clipboardService.copyFromContent(conference.id);
  }

  showMonitoringGraph() {
    this.displayGraph = !this.displayGraph
    let confId = '3C0392C1-68AA-4551-9597-B2C652FE8E69';
    let partId = '0BFCDE81-153C-4E03-8D03-DC7AFDCACADC';

    if (this.currentConference && this.currentConference.participants && this.currentConference.participants.length > 0) {
      this.selectedParticipant = new ParticipantGraphInfo(this.currentConference.participants[0].display_name, this.currentConference.participants[0].status);
      confId = this.currentConference.id;
      partId = this.currentConference.participants[0].id;
    } else {
      this.selectedParticipant = new ParticipantGraphInfo('Ms Steve Adams', 'In hearing');
    }


    this.videoWebService.getParticipantHeartbeats(confId, partId)
      .subscribe(s => {
        this.packageLostArray = s.map(x => {
          return new PackageLost(x.recent_packet_loss, x.browser_name, x.browser_version, x.timestamp.getTime())
        });

      });

  }

  closeGraph(value) {
    this.displayGraph = !value;
  }
}
