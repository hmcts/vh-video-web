import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { OnTheDayRoutingModule } from './on-the-day-routing.module';
import { DeclarationComponent } from './declaration/declaration.component';
import { HearingRulesComponent } from './hearing-rules/hearing-rules.component';
import { EquipmentCheckComponent } from './equipment-check/equipment-check.component';
import { CameraAndMicrophoneComponent } from './camera-and-microphone/camera-and-microphone.component';
import { HearingListTableComponent } from './hearing-list-table/hearing-list-table.component';
import { ParticipantHearingsComponent } from './participant-hearings/participant-hearings.component';
import { JudgeHearingListComponent } from './judge-hearing-list/judge-hearing-list.component';
import { JudgeHearingTableComponent } from './judge-hearing-table/judge-hearing-table.component';
@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    OnTheDayRoutingModule
  ],
  declarations: [
    DeclarationComponent,
    HearingRulesComponent,
    HearingListTableComponent,
    ParticipantHearingsComponent,
    EquipmentCheckComponent,
    CameraAndMicrophoneComponent,
    JudgeHearingListComponent,
    JudgeHearingTableComponent
  ],
  exports: [
    DeclarationComponent
  ]
})
export class OnTheDayModule { }
