import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {DeclarationComponent} from './declaration/declaration.component';
import {HearingRulesComponent} from './hearing-rules/hearing-rules.component';
import { EquipmentCheckComponent } from './equipment-check/equipment-check.component';
import { CameraAndMicrophoneComponent } from './camera-and-microphone/camera-and-microphone.component';
import { JudgeHearingListComponent } from './judge-hearing-list/judge-hearing-list.component';

export const routes: Routes = [
  { path: 'judge-hearing-list', component: JudgeHearingListComponent},
  { path: 'declaration', component: DeclarationComponent },
  { path: 'hearing-rules', component: HearingRulesComponent },
  { path: 'equipment-check', component: EquipmentCheckComponent },
  { path: 'camera-and-microphone', component: CameraAndMicrophoneComponent },
  { path: 'judge-hearing-list', component: JudgeHearingListComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OnTheDayRoutingModule { }
