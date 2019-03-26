import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {DeclarationComponent} from './declaration/declaration.component';
import {WaitingRoomComponent} from './waiting-room/waiting-room.component';
import {HearingRulesComponent} from './hearing-rules/hearing-rules.component';
import { EquipmentCheckComponent } from './equipment-check/equipment-check.component';
import { CameraAndMicrophoneComponent } from './camera-and-microphone/camera-and-microphone.component';
import { NoHearingsComponent } from './no-hearings/no-hearings.component';
import { HearingListComponent } from './hearing-list/hearing-list.component';
import { JudgeHearingTableComponent } from './judge-hearing-table/judge-hearing-table.component';

export const routes: Routes = [
  { path: 'declaration', component: DeclarationComponent },
  { path: 'waiting-room', component: WaitingRoomComponent },
  { path: 'hearing-rules', component: HearingRulesComponent },
  { path: 'equipment-check', component: EquipmentCheckComponent },
  { path: 'camera-and-microphone', component: CameraAndMicrophoneComponent },
  { path: 'no-hearings', component: NoHearingsComponent },
  { path: 'hearing-list', component: HearingListComponent },
  { path: 'judge-hearing-table', component: JudgeHearingTableComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OnTheDayRoutingModule { }
