import { NgModule } from '@angular/core';

import { WaitingSpaceRoutingModule } from './waiting-space-routing.module';
import { ParticipantStatusListComponent } from './participant-status-list/participant-status-list.component';
import { ParticipantWaitingRoomComponent } from './participant-waiting-room/participant-waiting-room.component';
import { SharedModule } from '../shared/shared.module';
import { JudgeWaitingRoomComponent } from './judge-waiting-room/judge-waiting-room.component';
import { JudgeHearingPageComponent } from './judge-hearing-page/judge-hearing-page.component';
import { AnalogueClockComponent } from './analogue-clock/analogue-clock.component';

@NgModule({
  imports: [
    SharedModule,
    WaitingSpaceRoutingModule
  ],
  declarations: [
    ParticipantStatusListComponent,
    ParticipantWaitingRoomComponent,
    JudgeWaitingRoomComponent,
    JudgeHearingPageComponent,
    AnalogueClockComponent
  ]
})
export class WaitingSpaceModule { }
