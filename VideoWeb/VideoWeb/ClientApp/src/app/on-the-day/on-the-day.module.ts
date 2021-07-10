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
import { SwitchOnCameraMicrophoneComponent } from './switch-on-camera-microphone/switch-on-camera-microphone.component';
import { VideoCheckComponent } from './video-check/video-check.component';
import { IntroductionComponent } from './introduction/introduction.component';
import { ParticipantSelfTestComponent } from './participant-self-test/participant-self-test.component';
import { JudgeSelfTestComponent } from './judge-self-test/judge-self-test.component';
import { IndependentSelfTestComponent } from './independent-self-test/independent-self-test.component';
import { PluraliseTextPipe } from '../shared/pipes/pluraliseText.pipe';
import { SelfTestActionsComponent } from './self-test-actions/self-test-actions.component';
import { UnsupportedDeviceComponent } from '../shared/unsupported-device/unsupported-device.component';
import { MagicLinksComponent } from './magic-links/magic-links.component';

@NgModule({
    imports: [CommonModule, SharedModule, OnTheDayRoutingModule],
    declarations: [
        DeclarationComponent,
        HearingRulesComponent,
        HearingListTableComponent,
        ParticipantHearingsComponent,
        EquipmentCheckComponent,
        CameraAndMicrophoneComponent,
        JudgeHearingListComponent,
        JudgeHearingTableComponent,
        CameraCheckComponent,
        MicrophoneCheckComponent,
        VideoCheckComponent,
        SwitchOnCameraMicrophoneComponent,
        UnsupportedDeviceComponent,
        IntroductionComponent,
        ParticipantSelfTestComponent,
        JudgeSelfTestComponent,
        IndependentSelfTestComponent,
        PluraliseTextPipe,
        SelfTestActionsComponent,
        MagicLinksComponent
    ],
    exports: [DeclarationComponent]
})
export class OnTheDayModule {}
