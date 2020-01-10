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

@NgModule({
  declarations: [
    VhoHearingsComponent,
    TasksTableComponent,
    VhoHearingListComponent,
    ParticipantStatusComponent,
    ParticipantInfoTooltipComponent,
    VhoHearingsFilterComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    ClipboardModule,
    VhOfficerRoutingModule
  ]
})
export class VhOfficerModule { }
