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
import { JudgeSelfTestComponent } from './judge-self-test/judge-self-test.component';
import { IndependentSelfTestComponent } from './independent-self-test/independent-self-test.component';
import { ParticipantWaitingRoomGuard } from '../security/participant-waiting-room.guard';

export const routes: Routes = [
    {
        path: `${PageUrls.JudgeHearingList}`,
        component: JudgeHearingListComponent,
        canActivate: [JudgeGuard],
        data: { title: 'Judge hearing list' }
    },
    {
        path: `${PageUrls.ParticipantHearingList}`,
        component: ParticipantHearingsComponent,
        canActivate: [ParticipantGuard, ParticipantWaitingRoomGuard],
        data: { title: 'Hearing list' }
    },
    { path: `${PageUrls.Declaration}/:conferenceId`, component: DeclarationComponent, data: { title: 'Declaration' } },
    { path: `${PageUrls.HearingRules}/:conferenceId`, component: HearingRulesComponent, data: { title: 'Hearing rules' } },
    { path: `${PageUrls.EquipmentCheck}/:conferenceId`, component: EquipmentCheckComponent, data: { title: 'Equipment check' } },
    { path: `${PageUrls.EquipmentCheck}`, component: EquipmentCheckComponent },
    { path: `${PageUrls.CameraWorking}/:conferenceId`, component: CameraCheckComponent, data: { title: 'Camera working' } },
    { path: `${PageUrls.MicrophoneWorking}/:conferenceId`, component: MicrophoneCheckComponent, data: { title: 'Microphone working' } },
    { path: `${PageUrls.VideoWorking}/:conferenceId`, component: VideoCheckComponent, data: { title: 'See and hear video' } },
    { path: `${PageUrls.CameraAndMicrophone}/:conferenceId`, component: CameraAndMicrophoneComponent },
    {
        path: `${PageUrls.SwitchOnCameraMicrophone}/:conferenceId`,
        component: SwitchOnCameraMicrophoneComponent,
        data: { title: 'Switch on camera and microphone' }
    },
    { path: `${PageUrls.SwitchOnCameraMicrophone}`, component: SwitchOnCameraMicrophoneComponent },
    {
        path: `${PageUrls.ParticipantSelfTestVideo}/:conferenceId`,
        component: ParticipantSelfTestComponent,
        data: { title: 'Practice video hearing' }
    },
    { path: `${PageUrls.JudgeSelfTestVideo}/:conferenceId`, component: JudgeSelfTestComponent },
    { path: `${PageUrls.IndependentSelfTestVideo}`, component: IndependentSelfTestComponent },
    { path: `${PageUrls.GetHelp}`, component: EquipmentProblemComponent, data: { title: 'Get help' } },
    { path: `${PageUrls.SignonAComputer}`, component: SignonAComputerComponent },
    { path: `${PageUrls.Introduction}/:conferenceId`, component: IntroductionComponent, data: { title: 'Introduction' } }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class OnTheDayRoutingModule {}
