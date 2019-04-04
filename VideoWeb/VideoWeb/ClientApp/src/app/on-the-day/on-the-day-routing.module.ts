import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {DeclarationComponent} from './declaration/declaration.component';
import {HearingRulesComponent} from './hearing-rules/hearing-rules.component';
import { EquipmentCheckComponent } from './equipment-check/equipment-check.component';
import { CameraAndMicrophoneComponent } from './camera-and-microphone/camera-and-microphone.component';
import { JudgeHearingListComponent } from './judge-hearing-list/judge-hearing-list.component';
import { ParticipantHearingsComponent } from './participant-hearings/participant-hearings.component';

export const routes: Routes = [
  { path: 'judge-hearing-list', component: JudgeHearingListComponent},
  { path: 'declaration/:conferenceId', component: DeclarationComponent },
  { path: 'hearing-rules/:conferenceId', component: HearingRulesComponent },
  { path: 'equipment-check/:conferenceId', component: EquipmentCheckComponent },
  { path: 'camera-and-microphone/:conferenceId', component: CameraAndMicrophoneComponent },
  { path: 'judge-hearing-list', component: JudgeHearingListComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OnTheDayRoutingModule { }
