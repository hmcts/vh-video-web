import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { CameraAndMicrophoneComponent } from './camera-and-microphone/camera-and-microphone.component';
import { CameraCheckComponent } from './camera-check/camera-check.component';
import { DeclarationComponent } from './declaration/declaration.component';
import { EquipmentCheckComponent } from './equipment-check/equipment-check.component';
import { HearingRulesComponent } from './hearing-rules/hearing-rules.component';
import { JudgeHearingListComponent } from './judge-hearing-list/judge-hearing-list.component';
import { JudgeHearingTableComponent } from './judge-hearing-list/judge-hearing-table.component';
import { MicrophoneCheckComponent } from './microphone-check/microphone-check.component';
import { OnTheDayRoutingModule } from './on-the-day-routing.module';
import { HearingListTableComponent } from './participant-hearings/hearing-list-table.component';
import { ParticipantHearingsComponent } from './participant-hearings/participant-hearings.component';
import { SelfTestComponent } from './self-test/self-test.component';
import { SwitchOnCameraMicrophoneComponent } from './switch-on-camera-microphone/switch-on-camera-microphone.component';
import { ParticipantStatusComponent } from './vho-hearings/participant-status.component';
import { TasksTableComponent } from './vho-hearings/tasks-table.component';
import { VhoHearingListComponent } from './vho-hearings/vho-hearing-list.component';
import { VhoHearingsComponent } from './vho-hearings/vho-hearings.component';
import { VideoCheckComponent } from './video-check/video-check.component';

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
    JudgeHearingTableComponent,
    VhoHearingsComponent,
    CameraCheckComponent,
    MicrophoneCheckComponent,
    VideoCheckComponent,
    SwitchOnCameraMicrophoneComponent,
    TasksTableComponent,
    VhoHearingListComponent,
    SelfTestComponent,
    ParticipantStatusComponent
  ],
  exports: [
    DeclarationComponent
  ]
})
export class OnTheDayModule { }
