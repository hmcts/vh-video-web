import { NgModule } from '@angular/core';

import { OnDaySetupRoutingModule } from './on-day-setup-routing.module';
import { ParticipantHearingsComponent } from './participant-hearings/participant-hearings.component';
import { SharedModule } from '../shared/shared.module';
import { HearingListTableComponent } from './hearing-list-table/hearing-list-table.component';

@NgModule({
  imports: [
    SharedModule,
    OnDaySetupRoutingModule
  ],
  declarations: [ParticipantHearingsComponent, HearingListTableComponent]
})
export class OnDaySetupModule { }
