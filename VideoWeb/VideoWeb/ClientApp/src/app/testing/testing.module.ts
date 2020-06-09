import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { AnalogueClockStubComponent } from './stubs/analogue-clock-stub';
import { BackNavigationStubComponent } from './stubs/back-navigation-stub';
import { BetaBannerStubComponent } from './stubs/beta-banner-stub';
import { BreadcrumbStubComponent } from './stubs/breadcrumb-stub';
import { CancelPopupStubComponent } from './stubs/cancel-popup-stub';
import { ChatInputBoxStubComponent } from './stubs/chat-input-box-stub.component';
import { ConfirmationPopupStubComponent } from './stubs/confirmation-popup-stub';
import { ContactUsFoldingStubComponent, ContactUsStubComponent } from './stubs/contact-us-stub';
import { DashboardStubComponent } from './stubs/dashboard-stub';
import { FooterStubComponent } from './stubs/footer-stub';
import { HeaderStubComponent } from './stubs/header-stub';
import { HearingListTableStubComponent } from './stubs/hearing-list-table-stub';
import { IndividualConsultationControlsStubComponent } from './stubs/individual-consultation-controls-stub';
import { JudgeHearingTableStubComponent } from './stubs/judge-hearing-list-table-stub';
import { MicVisualiserStubComponent } from './stubs/mic-visualiser-stub';
import { ParticipantChatStubComponent } from './stubs/participant-chat-stub.component';
import {
    IndividualParticipantStatusListStubComponent,
    JudgeParticipantStatusListStubComponent
} from './stubs/participant-status-list-stub';
import { SelectMediaDevicesStubComponent } from './stubs/select-media-devices-stub';
import { SelfTestStubComponent } from './stubs/self-test-stub';
import { UnsupportedBrowserStubComponent } from './stubs/unsupported-browser-stub';

@NgModule({
    imports: [CommonModule],
    declarations: [
        BreadcrumbStubComponent,
        CancelPopupStubComponent,
        ConfirmationPopupStubComponent,
        ContactUsStubComponent,
        DashboardStubComponent,
        FooterStubComponent,
        HeaderStubComponent,
        HearingListTableStubComponent,
        JudgeParticipantStatusListStubComponent,
        JudgeHearingTableStubComponent,
        ContactUsFoldingStubComponent,
        AnalogueClockStubComponent,
        MicVisualiserStubComponent,
        SelfTestStubComponent,
        SelectMediaDevicesStubComponent,
        IndividualParticipantStatusListStubComponent,
        IndividualConsultationControlsStubComponent,
        BetaBannerStubComponent,
        BackNavigationStubComponent,
        UnsupportedBrowserStubComponent,
        ParticipantChatStubComponent,
        ChatInputBoxStubComponent
    ]
})
export class TestingModule {}
