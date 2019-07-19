import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { AnalogueClockComponent } from './analogue-clock/analogue-clock.component';
import {
  IndividualParticipantStatusListComponent
} from './individual-participant-status-list/individual-participant-status-list.component';
import { JudgeHearingPageComponent } from './judge-hearing-page/judge-hearing-page.component';
import { JudgeWaitingRoomComponent } from './judge-waiting-room/judge-waiting-room.component';
import { ParticipantStatusListComponent } from './participant-status-list/participant-status-list.component';
import { ParticipantWaitingRoomComponent } from './participant-waiting-room/participant-waiting-room.component';
import { WaitingSpaceRoutingModule } from './waiting-space-routing.module';


@NgModule({
  imports: [
    SharedModule,
    WaitingSpaceRoutingModule
  ],
  declarations: [
    ParticipantStatusListComponent,
    IndividualParticipantStatusListComponent,
    ParticipantWaitingRoomComponent,
    JudgeWaitingRoomComponent,
    JudgeHearingPageComponent,
    AnalogueClockComponent
  ]
})
export class WaitingSpaceModule { }
