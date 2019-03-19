import { NgModule } from '@angular/core';

import { OnDaySetupRoutingModule } from './on-day-setup-routing.module';
import { ParticipantHearingsComponent } from './participant-hearings/participant-hearings.component';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  imports: [
    SharedModule,
    OnDaySetupRoutingModule
  ],
  declarations: [ParticipantHearingsComponent]
})
export class OnDaySetupModule { }
