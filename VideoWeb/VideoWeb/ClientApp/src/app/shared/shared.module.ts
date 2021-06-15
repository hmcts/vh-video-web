import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AccessibilityComponent } from './accessibility/accessibility.component';
import { BackNavigationComponent } from './back-navigation/back-navigation.component';
import { BetaBannerComponent } from './beta-banner/beta-banner.component';
import { ChatBodyWindowComponent } from './chat-body-window/chat-body-window.component';
import { ChatInputBoxComponent } from './chat-input-box/chat-input-box.component';
import { ContactUsFoldingComponent } from './contact-us-folding/contact-us-folding.component';
import { ContactUsComponent } from './contact-us/contact-us.component';
import { ScrollTriggerDirective } from './directives/scroll-trigger.directive';
import { WindowScrolling } from './directives/window-scrolling';
import { EquipmentProblemComponent } from './equipment-problem/equipment-problem.component';
import { ErrorComponent } from './error/error.component';
import { FooterComponent } from './footer/footer.component';
import { HeaderComponent } from './header/header.component';
import { MicVisualiserComponent } from './mic-visualiser/mic-visualiser.component';
import { ModalComponent } from './modal/modal.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { PrivacyPolicyComponent } from './privacy-policy/privacy-policy.component';
import { ScreenHelper } from './screen-helper';
import { SelectMediaDevicesComponent } from './select-media-devices/select-media-devices.component';
import { SelfTestComponent } from './self-test/self-test.component';
import { SharedRoutingModule } from './shared-routing.module';
import { UnsupportedBrowserComponent } from './unsupported-browser/unsupported-browser.component';
import { TooltipDirective } from './directives/tooltip.directive';
import { ErrorCameraMicrophoneComponent } from './error-camera-microphone/error-camera-microphone.component';
import { ToastrModule } from 'ngx-toastr';
import { VhToastComponent } from './toast/vh-toast.component';
import { RoomClosingToastComponent } from './toast/room-closing/room-closing-toast.component';
import { StartPrivateConsultationComponent } from '../waiting-space/participant-waiting-room/start-private-consultation/start-private-consultation.component';
import { JoinPrivateConsultationComponent } from '../waiting-space/participant-waiting-room/join-private-consultation/join-private-consultation.component';
import { TranslateModule } from '@ngx-translate/core';
import { TestLanguageService } from './test-language.service';
import { MultilinePipe } from './pipes/multiline.pipe';
import { NgxDatePipe } from './pipes/ngx-date.pipe';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        HttpClientModule,
        SharedRoutingModule,
        ToastrModule.forRoot({
            toastComponent: VhToastComponent
        }),
        ToastrModule.forRoot({
            toastComponent: RoomClosingToastComponent
        }),
        TranslateModule
    ],
    declarations: [
        HeaderComponent,
        FooterComponent,
        ContactUsComponent,
        ContactUsFoldingComponent,
        ErrorComponent,
        NotFoundComponent,
        SelectMediaDevicesComponent,
        StartPrivateConsultationComponent,
        JoinPrivateConsultationComponent,
        MicVisualiserComponent,
        EquipmentProblemComponent,
        SelfTestComponent,
        UnsupportedBrowserComponent,
        PrivacyPolicyComponent,
        ModalComponent,
        BetaBannerComponent,
        AccessibilityComponent,
        ScrollTriggerDirective,
        BackNavigationComponent,
        ChatInputBoxComponent,
        ChatBodyWindowComponent,
        TooltipDirective,
        ErrorCameraMicrophoneComponent,
        VhToastComponent,
        RoomClosingToastComponent,
        MultilinePipe,
        NgxDatePipe
    ],
    providers: [WindowScrolling, ScreenHelper, TestLanguageService],
    exports: [
        HeaderComponent,
        FooterComponent,
        ContactUsComponent,
        ContactUsFoldingComponent,
        SelectMediaDevicesComponent,
        StartPrivateConsultationComponent,
        JoinPrivateConsultationComponent,
        MicVisualiserComponent,
        SelfTestComponent,
        ModalComponent,
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        HttpClientModule,
        BetaBannerComponent,
        ScrollTriggerDirective,
        BackNavigationComponent,
        ChatInputBoxComponent,
        ChatBodyWindowComponent,
        TooltipDirective,
        ErrorCameraMicrophoneComponent,
        TranslateModule,
        MultilinePipe,
        NgxDatePipe
    ]
})
export class SharedModule {}
