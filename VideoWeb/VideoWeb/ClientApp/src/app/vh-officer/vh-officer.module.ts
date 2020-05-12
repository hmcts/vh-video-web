import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { VhoHearingsComponent } from './hearings/vho-hearings.component';
import { ParticipantStatusComponent } from './participant-status/participant-status.component';
import { TasksTableComponent } from './tasks-table/tasks-table.component';
import { VhoHearingListComponent } from './vho-hearing-list/vho-hearing-list.component';
import { ParticipantInfoTooltipComponent } from './participant-info-tooltip/participant-info-tooltip.component';
import { VhOfficerRoutingModule } from './vh-officer-routing.module';
import { ClipboardModule } from 'ngx-clipboard';
import { VhoHearingsFilterComponent } from './vho-herings-filter/vho-hearings-filter.component';
import { HearingsFilterOptionsService } from './services/hearings-filter-options.service';
import { VhoChatComponent } from './vho-chat/vho-chat.component';
import { ParticipantNetworkStatusComponent } from './participant-network-status/participant-network-status.component';
import { ChartsModule } from 'ng2-charts';
import { MonitoringGraphComponent } from './monitoring-graph/monitoring-graph.component';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { VenueListComponent } from './venue-list/venue-list.component';
import { ParticipantStatusReader } from '../shared/models/participant-status-reader';
import { VHODashboardHelper } from './helper';
import { PendingTasksComponent } from './pending-tasks/pending-tasks.component';
import { UnreadMessagesComponent } from './unread-messages/unread-messages.component';
import { CommandCentreComponent } from './command-centre/command-centre.component';
import { CommandCentreMenuComponent } from './command-centre-menu/command-centre-menu.component';
import { AdminImComponent } from './admin-im/admin-im.component';
import { AdminHearingComponent } from './admin-hearing/admin-hearing.component';

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
        MonitoringGraphComponent,
        VenueListComponent,
        PendingTasksComponent,
        UnreadMessagesComponent,
        CommandCentreComponent,
        CommandCentreMenuComponent,
        AdminImComponent,
        AdminHearingComponent
    ],
    imports: [
        CommonModule,
        SharedModule,
        ChartsModule,
        ClipboardModule,
        VhOfficerRoutingModule,
        PerfectScrollbarModule,
        NgMultiSelectDropDownModule.forRoot()
    ],
    providers: [HearingsFilterOptionsService, ParticipantStatusReader, VHODashboardHelper],
    exports: [MonitoringGraphComponent]
})
export class VhOfficerModule {}
