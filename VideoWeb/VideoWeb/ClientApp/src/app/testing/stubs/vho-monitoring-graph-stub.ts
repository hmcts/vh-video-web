import { Component, Input, Output, EventEmitter } from '@angular/core';
import { PackageLost } from '../../vh-officer/services/models/package-lost';
import { ParticipantGraphInfo } from '../../vh-officer/services/models/participant-graph-info';

@Component({ selector: 'app-monitoring-graph', template: '' })
export class VhoMonitoringGraphStubComponent {
  @Input('pakagesLostData')
  set packagesLostData(packagesLost: PackageLost[]) { }

  @Input()
  participantGraphInfo: ParticipantGraphInfo;

  @Output()
  closeGraph: EventEmitter<boolean> = new EventEmitter<boolean>();
}
