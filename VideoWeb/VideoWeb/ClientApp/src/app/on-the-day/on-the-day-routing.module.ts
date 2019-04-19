import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DeclarationComponent } from './declaration/declaration.component';
import { HearingRulesComponent } from './hearing-rules/hearing-rules.component';
import { EquipmentCheckComponent } from './equipment-check/equipment-check.component';
import { CameraAndMicrophoneComponent } from './camera-and-microphone/camera-and-microphone.component';
import { JudgeHearingListComponent } from './judge-hearing-list/judge-hearing-list.component';
import { ParticipantHearingsComponent } from './participant-hearings/participant-hearings.component';
import { VhoHearingsComponent } from './vho-hearings/vho-hearings.component';
import { JudgeGuard } from '../security/judge.guard';
import { AdminGuard } from '../security/admin.guard';
import { ParticipantGuard } from '../security/participant.guard';
import { CameraCheckComponent } from './camera-check/camera-check.component';
import { MicrophoneCheckComponent } from './microphone-check/microphone-check.component';
import { VideoCheckComponent } from './video-check/video-check.component';
import { SwitchOnCameraMicrophoneComponent } from './switch-on-camera-microphone/switch-on-camera-microphone.component';

export const routes: Routes = [
  { path: 'judge/hearing-list', component: JudgeHearingListComponent, canActivate: [JudgeGuard] },
  { path: 'participant/hearing-list', component: ParticipantHearingsComponent, canActivate: [ParticipantGuard] },
  { path: 'admin/hearing-list', component: VhoHearingsComponent, canActivate: [AdminGuard] },
  { path: 'declaration/:conferenceId', component: DeclarationComponent },
  { path: 'hearing-rules/:conferenceId', component: HearingRulesComponent },
  { path: 'equipment-check/:conferenceId', component: EquipmentCheckComponent },
  { path: 'camera-working/:conferenceId', component: CameraCheckComponent },
  { path: 'microphone-working/:conferenceId', component: MicrophoneCheckComponent },
  { path: 'see-and-hear-video/:conferenceId', component: VideoCheckComponent },
  { path: 'camera-and-microphone/:conferenceId', component: CameraAndMicrophoneComponent },
  { path: 'switch-on-camera-microphone/:conferenceId', component: SwitchOnCameraMicrophoneComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OnTheDayRoutingModule { }
