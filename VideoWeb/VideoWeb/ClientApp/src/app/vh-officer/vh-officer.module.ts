import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { NgSelectModule } from '@ng-select/ng-select';
import { ChartsModule } from 'ng2-charts';
import { ClipboardModule } from 'ngx-clipboard';
import { ParticipantStatusReader } from '../shared/models/participant-status-reader';
import { SharedModule } from '../shared/shared.module';
import { AdminHearingComponent } from './admin-hearing/admin-hearing.component';
import { AdminImListComponent } from './admin-im-list/admin-im-list.component';
import { AdminImComponent } from './admin-im/admin-im.component';
import { CommandCentreMenuComponent } from './command-centre-menu/command-centre-menu.component';
import { CommandCentreComponent } from './command-centre/command-centre.component';
import { CopyIdComponent } from './copy-id/copy-id.component';
import { HearingHeaderComponent } from './hearing-header/hearing-header.component';
import { HearingStatusComponent } from './hearing-status/hearing-status.component';
import { MonitoringGraphComponent } from './monitoring-graph/monitoring-graph.component';
import { ParticipantInfoTooltipComponent } from './participant-info-tooltip/participant-info-tooltip.component';
import { ParticipantNetworkStatusComponent } from './participant-network-status/participant-network-status.component';
import { ParticipantStatusComponent } from './participant-status/participant-status.component';
import { PendingTasksComponent } from './pending-tasks/pending-tasks.component';
import { HearingsFilterOptionsService } from './services/hearings-filter-options.service';
import { VhoQueryService } from './services/vho-query-service.service';
import { TasksTableComponent } from './tasks-table/tasks-table.component';
import { UnreadMessagesParticipantComponent } from './unread-messages-participant/unread-messages-participant.component';
import { UnreadMessagesComponent } from './unread-messages/unread-messages.component';
import { VenueListComponent } from './venue-list/venue-list.component';
import { VhOfficerRoutingModule } from './vh-officer-routing.module';
import { VhoChatComponent } from './vho-chat/vho-chat.component';
import { VhoHearingListComponent } from './vho-hearing-list/vho-hearing-list.component';
import { VhoHearingsFilterComponent } from './vho-hearings-filter/vho-hearings-filter.component';

@NgModule({
    declarations: [
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
        AdminHearingComponent,
        AdminImListComponent,
        HearingHeaderComponent,
        HearingStatusComponent,
        CopyIdComponent,
        UnreadMessagesParticipantComponent
    ],
    imports: [CommonModule, SharedModule, ChartsModule, ClipboardModule, VhOfficerRoutingModule, NgSelectModule],
    providers: [HearingsFilterOptionsService, ParticipantStatusReader, VhoQueryService],
    exports: [MonitoringGraphComponent, HearingHeaderComponent, HearingStatusComponent]
})
export class VhOfficerModule {}
