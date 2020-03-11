import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ConferenceResponse, ConferenceStatus, ConferenceForVhOfficerResponse } from 'src/app/services/clients/api-client';
import { Hearing } from 'src/app/shared/models/hearing';
import { ClipboardService } from 'ngx-clipboard';
import { PackageLost } from '../services/models/package-lost';
import { ParticipantGraphInfo } from '../services/models/participant-graph-info';
import { MonitorGraphService } from '../services/monitor-graph.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';

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

  constructor(private clipboardService: ClipboardService, private monitorGraphService: MonitorGraphService,
  private videoWebService: VideoWebService) { }

  ngOnInit() {}

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

  
   this.videoWebService.getParticipantHeartbeats('3C0392C1-68AA-4551-9597-B2C652FE8E69', '0BFCDE81-153C-4E03-8D03-DC7AFDCACADC')
     .subscribe(s => {
       const data = s;
       this.packageLostArray = s.map(x => {
         return new PackageLost(x.recent_packet_loss, x.browser_name, x.browser_version, x.timestamp.getTime())
       });

     });
    
  }

  closeGraph(value) {
    this.displayGraph = !value;
  }
}
