import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { OnTheDayRoutingModule } from './on-the-day-routing.module';
import { DeclarationComponent } from './declaration/declaration.component';
import { WaitingRoomComponent } from './waiting-room/waiting-room.component';
import { HearingRulesComponent } from './hearing-rules/hearing-rules.component';
import { EquipmentCheckComponent } from './equipment-check/equipment-check.component';
import { CameraAndMicrophoneComponent } from './camera-and-microphone/camera-and-microphone.component';

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    OnTheDayRoutingModule
  ],
  declarations: [
    DeclarationComponent,
    WaitingRoomComponent,
    HearingRulesComponent,
    EquipmentCheckComponent,
    CameraAndMicrophoneComponent
  ],
  exports: [
    DeclarationComponent,
    WaitingRoomComponent
  ]
})
export class OnTheDayModule { }
