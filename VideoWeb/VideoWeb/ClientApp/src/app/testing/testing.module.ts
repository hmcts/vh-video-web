import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BreadcrumbStubComponent } from './stubs/breadcrumb-stub';
import { CancelPopupStubComponent } from './stubs/cancel-popup-stub';
import { ConfirmationPopupStubComponent } from './stubs/confirmation-popup-stub';
import { ContactUsStubComponent, ContactUsFoldingStubComponent } from './stubs/contact-us-stub';
import { DashboardStubComponent } from './stubs/dashboard-stub';
import { FooterStubComponent } from './stubs/footer-stub';
import { HeaderStubComponent } from './stubs/header-stub';
import { HearingListTableStubComponent } from './stubs/hearing-list-table-stub';
import {
    JudgeParticipantStatusListStubComponent,
    IndividualParticipantStatusListStubComponent
} from './stubs/participant-status-list-stub';
import { JudgeHearingTableStubComponent } from './stubs/judge-hearing-list-table-stub';
import { AnalogueClockStubComponent } from './stubs/analogue-clock-stub';
import { TasksTableStubComponent } from './stubs/task-table-stub';
import { VhoHearingListStubComponent } from './stubs/vho-hearing-list-stub';
import { MicVisualiserStubComponent } from './stubs/mic-visualiser-stub';
import { VhoParticipantStatusStubComponent } from './stubs/vho-participant-status-stub';
import { SelfTestStubComponent } from './stubs/self-test-stub';
import { SelectMediaDevicesStubComponent } from './stubs/select-media-devices-stub';
import { IndividualConsultationControlsStubComponent } from './stubs/individual-consultation-controls-stub';
import { BetaBannerStubComponent } from './stubs/beta-banner-stub';
import { BackNavigationStubComponent } from './stubs/back-navigation-stub';
import { UnsupportedBrowserStubComponent } from './stubs/unsupported-browser-stub';
import { VhoHearingsFilterStubComponent } from './stubs/vho-hearings-filter-stub';

@NgModule({
    imports: [
        CommonModule
    ],
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
        TasksTableStubComponent,
        VhoHearingListStubComponent,
        MicVisualiserStubComponent,
        VhoParticipantStatusStubComponent,
        SelfTestStubComponent,
        SelectMediaDevicesStubComponent,
        IndividualParticipantStatusListStubComponent,
        IndividualConsultationControlsStubComponent,
        BetaBannerStubComponent,
        BackNavigationStubComponent,
        UnsupportedBrowserStubComponent,
        VhoHearingsFilterStubComponent
    ]
})
export class TestingModule { }
