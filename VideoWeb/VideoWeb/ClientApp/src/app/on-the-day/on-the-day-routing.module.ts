import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DeclarationComponent } from './declaration/declaration.component';
import { HearingRulesComponent } from './hearing-rules/hearing-rules.component';
import { EquipmentCheckComponent } from './equipment-check/equipment-check.component';
import { CameraAndMicrophoneComponent } from './camera-and-microphone/camera-and-microphone.component';
import { JudgeHearingListComponent } from './judge-hearing-list/judge-hearing-list.component';
import { ParticipantHearingsComponent } from './participant-hearings/participant-hearings.component';
import { JudgeGuard } from '../security/judge.guard';
import { ParticipantGuard } from '../security/participant.guard';
import { CameraCheckComponent } from './camera-check/camera-check.component';
import { MicrophoneCheckComponent } from './microphone-check/microphone-check.component';
import { VideoCheckComponent } from './video-check/video-check.component';
import { SwitchOnCameraMicrophoneComponent } from './switch-on-camera-microphone/switch-on-camera-microphone.component';
import { PageUrls } from '../shared/page-url.constants';
import { SelfTestComponent } from './self-test/self-test.component';
import { EquipmentProblemComponent } from '../shared/equipment-problem/equipment-problem.component';

export const routes: Routes = [
  { path: `${PageUrls.JudgeHearingList}`, component: JudgeHearingListComponent, canActivate: [JudgeGuard] },
  { path: `${PageUrls.ParticipantHearingList}`, component: ParticipantHearingsComponent, canActivate: [ParticipantGuard] },
  { path: `${PageUrls.Declaration}/:conferenceId`, component: DeclarationComponent },
  { path: `${PageUrls.HearingRules}/:conferenceId`, component: HearingRulesComponent },
  { path: `${PageUrls.EquipmentCheck}/:conferenceId`, component: EquipmentCheckComponent },
  { path: `${PageUrls.CameraWorking}/:conferenceId`, component: CameraCheckComponent },
  { path: `${PageUrls.MicrophoneWorking}/:conferenceId`, component: MicrophoneCheckComponent },
  { path: `${PageUrls.VideoWorking}/:conferenceId`, component: VideoCheckComponent },
  { path: `${PageUrls.CameraAndMicrophone}/:conferenceId`, component: CameraAndMicrophoneComponent },
  { path: `${PageUrls.SwitchOnCameraMicrophone}/:conferenceId`, component: SwitchOnCameraMicrophoneComponent},
  { path: `${PageUrls.SelfTestVideo}/:conferenceId`, component: SelfTestComponent},
  { path: `${PageUrls.EquipmentProblems}`, component: EquipmentProblemComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OnTheDayRoutingModule { }
