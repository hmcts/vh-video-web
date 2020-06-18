import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { JudgeGuard } from '../security/judge.guard';
import { ParticipantGuard } from '../security/participant.guard';
import { EquipmentProblemComponent } from '../shared/equipment-problem/equipment-problem.component';
import { pageUrls } from '../shared/page-url.constants';
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
import { SignonAComputerComponent } from '../shared/signon-a-computer/signon-a-computer.component';
import { ParticipantStatusGuard } from '../security/participant-status.guard';

export const routes: Routes = [
    {
        path: `${pageUrls.JudgeHearingList}`,
        component: JudgeHearingListComponent,
        canActivate: [JudgeGuard],
        data: { title: 'Judge hearing list' }
    },
    {
        path: `${pageUrls.ParticipantHearingList}`,
        component: ParticipantHearingsComponent,
        canActivate: [ParticipantGuard],
        data: { title: 'Hearing list' }
    },
    {
        path: `${pageUrls.Declaration}/:conferenceId`,
        component: DeclarationComponent,
        data: { title: 'Declaration' },
        canActivate: [ParticipantStatusGuard]
    },
    {
        path: `${pageUrls.HearingRules}/:conferenceId`,
        component: HearingRulesComponent,
        data: { title: 'Hearing rules' },
        canActivate: [ParticipantStatusGuard]
    },
    {
        path: `${pageUrls.EquipmentCheck}/:conferenceId`,
        component: EquipmentCheckComponent,
        data: { title: 'Equipment check' },
        canActivate: [ParticipantStatusGuard]
    },
    { path: `${pageUrls.EquipmentCheck}`, component: EquipmentCheckComponent },
    {
        path: `${pageUrls.CameraWorking}/:conferenceId`,
        component: CameraCheckComponent,
        data: { title: 'Camera working' },
        canActivate: [ParticipantStatusGuard]
    },
    {
        path: `${pageUrls.MicrophoneWorking}/:conferenceId`,
        component: MicrophoneCheckComponent,
        data: { title: 'Microphone working' },
        canActivate: [ParticipantStatusGuard]
    },
    {
        path: `${pageUrls.VideoWorking}/:conferenceId`,
        component: VideoCheckComponent,
        data: { title: 'See and hear video' },
        canActivate: [ParticipantStatusGuard]
    },
    { path: `${pageUrls.CameraAndMicrophone}/:conferenceId`, component: CameraAndMicrophoneComponent },
    {
        path: `${pageUrls.SwitchOnCameraMicrophone}/:conferenceId`,
        component: SwitchOnCameraMicrophoneComponent,
        data: { title: 'Switch on camera and microphone' },
        canActivate: [ParticipantStatusGuard]
    },
    {
        path: `${pageUrls.SwitchOnCameraMicrophone}`,
        component: SwitchOnCameraMicrophoneComponent
    },
    {
        path: `${pageUrls.ParticipantSelfTestVideo}/:conferenceId`,
        component: ParticipantSelfTestComponent,
        data: { title: 'Practice video hearing' },
        canActivate: [ParticipantStatusGuard]
    },
    { path: `${pageUrls.JudgeSelfTestVideo}/:conferenceId`, component: JudgeSelfTestComponent },
    { path: `${pageUrls.IndependentSelfTestVideo}`, component: IndependentSelfTestComponent },
    { path: `${pageUrls.GetHelp}`, component: EquipmentProblemComponent, data: { title: 'Get help' } },
    { path: `${pageUrls.SignonAComputer}`, component: SignonAComputerComponent },
    {
        path: `${pageUrls.Introduction}/:conferenceId`,
        component: IntroductionComponent,
        data: { title: 'Introduction' },
        canActivate: [ParticipantStatusGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class OnTheDayRoutingModule {}
