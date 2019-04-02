import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BreadcrumbStubComponent } from './stubs/breadcrumb-stub';
import { CancelPopupStubComponent } from './stubs/cancel-popup-stub';
import { ConfirmationPopupStubComponent } from './stubs/confirmation-popup-stub';
import { ContactUsStubComponent } from './stubs/contact-us-stub';
import { DashboardStubComponent } from './stubs/dashboard-stub';
import { FooterStubComponent } from './stubs/footer-stub';
import { HeaderStubComponent } from './stubs/header-stub';
import { HearingListTableStubComponent } from './stubs/hearing-list-table-stub';
import { ParticipantStatusListStubComponent } from './stubs/participant-status-list-stub';
import { JudgeHearingTableStubComponent } from "./stubs/judge-hearing-list-table-stub";

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
    ParticipantStatusListStubComponent,
    JudgeHearingTableStubComponent
  ]
})
export class TestingModule { }
