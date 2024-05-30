import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { JudgeOrJudicialOfficeHolderGuard } from '../security/judge-or-judicial-office-holder.guard';
import { ParticipantGuard } from '../security/participant.guard';
import { EquipmentProblemComponent } from '../shared/equipment-problem/equipment-problem.component';
import { pageUrls } from '../shared/page-url.constants';
import { CameraAndMicrophoneComponent } from './camera-and-microphone/camera-and-microphone.component';
import { CameraCheckComponent } from './camera-check/camera-check.component';
import { DeclarationComponent } from './declaration/declaration.component';
import { EquipmentCheckComponent } from './equipment-check/equipment-check.component';
import { HearingRulesComponent } from './hearing-rules/hearing-rules.component';
import { IntroductionComponent } from './introduction/introduction.component';
import { JudgeHearingListComponent } from './host-hearing-list/judge-hearing-list/judge-hearing-list.component';
import { MicrophoneCheckComponent } from './microphone-check/microphone-check.component';
import { ParticipantHearingsComponent } from './participant-hearings/participant-hearings.component';
import { ParticipantSelfTestComponent } from './participant-self-test/participant-self-test.component';
import { SwitchOnCameraMicrophoneComponent } from './switch-on-camera-microphone/switch-on-camera-microphone.component';
import { VideoCheckComponent } from './video-check/video-check.component';
import { JudgeSelfTestComponent } from './judge-self-test/judge-self-test.component';
import { IndependentSelfTestComponent } from './independent-self-test/independent-self-test.component';
import { UnsupportedDeviceComponent } from '../shared/unsupported-device/unsupported-device.component';
import { ParticipantStatusGuard } from '../security/participant-status.guard';
import { BackLinkDetails } from '../shared/models/back-link-details';
import { StaffMemberGuard } from '../security/staff-member.guard';
import { StaffMemberHearingSelectionComponent } from './staff-member-hearing-selection/staff-member-hearing-selection.component';
import { StaffMemberHearingListComponent } from './host-hearing-list/staff-member-hearing-list/staff-member-hearing-list.component';

export const routes: Routes = [
    {
        path: `${pageUrls.JudgeHearingList}`,
        component: JudgeHearingListComponent,
        canActivate: [JudgeOrJudicialOfficeHolderGuard],
        data: { title: 'Judge hearing list' }
    },
    {
        path: `${pageUrls.StaffMemberHearingList}`,
        component: StaffMemberHearingListComponent,
        canActivate: [StaffMemberGuard],
        data: {
            title: 'Staff Member hearing list',
            backLink: new BackLinkDetails(
                'back-navigation.navigate-back-to-select-venues',
                pageUrls.StaffMemberHearingSelection,
                'backlink-margin-left'
            )
        }
    },
    {
        path: `${pageUrls.StaffMemberHearingSelection}`,
        component: StaffMemberHearingSelectionComponent,
        canActivate: [StaffMemberGuard],
        data: { title: 'Staff Member hearing list' }
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
        data: { title: 'Declaration', backLink: new BackLinkDetails() },
        canActivate: [ParticipantStatusGuard]
    },
    {
        path: `${pageUrls.HearingRules}/:conferenceId`,
        component: HearingRulesComponent,
        data: { title: 'Hearing rules', backLink: new BackLinkDetails() },
        canActivate: [ParticipantStatusGuard]
    },
    {
        path: `${pageUrls.EquipmentCheck}/:conferenceId`,
        component: EquipmentCheckComponent,
        data: { title: 'Equipment check', backLink: new BackLinkDetails() },
        canActivate: [ParticipantStatusGuard]
    },
    {
        path: `${pageUrls.EquipmentCheck}`,
        component: EquipmentCheckComponent,
        data: { title: 'Equipment check', backLink: new BackLinkDetails() },
        canActivate: [ParticipantStatusGuard]
    },
    {
        path: `${pageUrls.CameraWorking}/:conferenceId`,
        component: CameraCheckComponent,
        data: { title: 'Camera working', backLink: new BackLinkDetails() },
        canActivate: [ParticipantStatusGuard]
    },
    {
        path: `${pageUrls.MicrophoneWorking}/:conferenceId`,
        component: MicrophoneCheckComponent,
        data: { title: 'Microphone working', backLink: new BackLinkDetails() },
        canActivate: [ParticipantStatusGuard]
    },
    {
        path: `${pageUrls.VideoWorking}/:conferenceId`,
        component: VideoCheckComponent,
        data: { title: 'See and hear video', backLink: new BackLinkDetails() },
        canActivate: [ParticipantStatusGuard]
    },
    {
        path: `${pageUrls.CameraAndMicrophone}/:conferenceId`,
        component: CameraAndMicrophoneComponent
    },
    {
        path: `${pageUrls.SwitchOnCameraMicrophone}/:conferenceId`,
        component: SwitchOnCameraMicrophoneComponent,
        data: { title: 'Switch on camera and microphone', backLink: new BackLinkDetails() },
        canActivate: [ParticipantStatusGuard]
    },
    {
        path: `${pageUrls.SwitchOnCameraMicrophone}`,
        component: SwitchOnCameraMicrophoneComponent,
        data: { title: 'Switch on camera and microphone', backLink: new BackLinkDetails() }
    },
    {
        path: `${pageUrls.ParticipantSelfTestVideo}/:conferenceId`,
        component: ParticipantSelfTestComponent,
        data: { title: 'Practice video hearing', backLink: new BackLinkDetails() },
        canActivate: [ParticipantStatusGuard]
    },
    {
        path: `${pageUrls.JudgeSelfTestVideo}/:conferenceId`,
        component: JudgeSelfTestComponent,
        data: { title: 'Practice video hearing', backLink: new BackLinkDetails() }
    },
    {
        path: `${pageUrls.IndependentSelfTestVideo}`,
        component: IndependentSelfTestComponent,
        data: { title: 'Practice video hearing', backLink: new BackLinkDetails() }
    },
    { path: `${pageUrls.GetHelp}`, component: EquipmentProblemComponent, data: { title: 'Get help' } },
    { path: `${pageUrls.UnsupportedDevice}`, component: UnsupportedDeviceComponent },
    {
        path: `${pageUrls.Introduction}/:conferenceId`,
        component: IntroductionComponent,
        data: { title: 'Introduction', backLink: new BackLinkDetails() },
        canActivate: [ParticipantStatusGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class OnTheDayRoutingModule {}
