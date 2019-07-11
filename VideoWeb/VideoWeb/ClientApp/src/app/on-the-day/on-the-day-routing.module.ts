import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { JudgeGuard } from '../security/judge.guard';
import { ParticipantGuard } from '../security/participant.guard';
import { EquipmentProblemComponent } from '../shared/equipment-problem/equipment-problem.component';
import { PageUrls } from '../shared/page-url.constants';
import { SignonAComputerComponent } from '../shared/signon-a-computer/signon-a-computer.component';
import { CameraAndMicrophoneComponent } from './camera-and-microphone/camera-and-microphone.component';
import { CameraCheckComponent } from './camera-check/camera-check.component';
import { DeclarationComponent } from './declaration/declaration.component';
import { EquipmentCheckComponent } from './equipment-check/equipment-check.component';
import { HearingRulesComponent } from './hearing-rules/hearing-rules.component';
import { IntroductionComponent } from './introduction/introduction.component';
import { JudgeHearingListComponent } from './judge-hearing-list/judge-hearing-list.component';
import { MicrophoneCheckComponent } from './microphone-check/microphone-check.component';
import { ParticipantHearingsComponent } from './participant-hearings/participant-hearings.component';
import { ParticipantSelfTestComponent } from './participant-self-test/participant-self-test.component';
import { SwitchOnCameraMicrophoneComponent } from './switch-on-camera-microphone/switch-on-camera-microphone.component';
import { VideoCheckComponent } from './video-check/video-check.component';

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
  { path: `${PageUrls.SwitchOnCameraMicrophone}/:conferenceId`, component: SwitchOnCameraMicrophoneComponent },
  { path: `${PageUrls.ParticipantSelfTestVideo}/:conferenceId`, component: ParticipantSelfTestComponent },
  { path: `${PageUrls.GetHelp}`, component: EquipmentProblemComponent },
  { path: `${PageUrls.SignonAComputer}`, component: SignonAComputerComponent},
  { path: `${PageUrls.Introduction}/:conferenceId`, component: IntroductionComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OnTheDayRoutingModule { }
