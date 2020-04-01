import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { VhoHearingsComponent } from '../vh-officer/hearings/vho-hearings.component';
import { ParticipantStatusComponent } from '../vh-officer/participant-status/participant-status.component';
import { TasksTableComponent } from '../vh-officer/tasks-table/tasks-table.component';
import { VhoHearingListComponent } from '../vh-officer/vho-hearing-list/vho-hearing-list.component';
import { ParticipantInfoTooltipComponent } from './participant-info-tooltip/participant-info-tooltip.component';
import { VhOfficerRoutingModule } from './vh-officer-routing.module';
import { ClipboardModule } from 'ngx-clipboard';
import { VhoHearingsFilterComponent } from '../vh-officer/vho-herings-filter/vho-hearings-filter.component';
import { HearingsFilterOptionsService } from '../vh-officer/services/hearings-filter-options.service';
import { VhoChatComponent } from './vho-chat/vho-chat.component';
import { ParticipantNetworkStatusComponent } from './participant-network-status/participant-network-status.component';
import { ChartsModule } from 'ng2-charts';
import { MonitoringGraphComponent } from '../vh-officer/monitoring-graph/monitoring-graph.component';
import { PerfectScrollbarModule, PERFECT_SCROLLBAR_CONFIG, PerfectScrollbarConfigInterface } from 'ngx-perfect-scrollbar';

const DEFAULT_PERFECT_SCROLLBAR_CONFIG: PerfectScrollbarConfigInterface = {
  suppressScrollX: true
};

@NgModule({
  declarations: [
    VhoHearingsComponent,
    TasksTableComponent,
    VhoHearingListComponent,
    ParticipantStatusComponent,
    ParticipantInfoTooltipComponent,
    VhoHearingsFilterComponent,
    VhoChatComponent,
    ParticipantNetworkStatusComponent,
    MonitoringGraphComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    ChartsModule,
    ClipboardModule,
    VhOfficerRoutingModule,
    PerfectScrollbarModule

    ],
    providers: [
      HearingsFilterOptionsService,
      {
        provide: PERFECT_SCROLLBAR_CONFIG,
        useValue: DEFAULT_PERFECT_SCROLLBAR_CONFIG
      },
    ],
    exports: [MonitoringGraphComponent]
})
export class VhOfficerModule { }
