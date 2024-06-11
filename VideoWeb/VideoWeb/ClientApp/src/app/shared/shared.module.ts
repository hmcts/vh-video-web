import { CommonModule, DatePipe } from '@angular/common';
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
import { TranslateModule } from '@ngx-translate/core';
import { TestLanguageService } from './test-language.service';
import { MultilinePipe } from './pipes/multiline.pipe';
import { NgxDatePipe } from './pipes/ngx-date.pipe';
import { ParticipantPanelModelMapper } from './mappers/participant-panel-model-mapper';
import { LoadingComponent } from './loading/loading.component';
import { ConfigService } from '../services/api/config.service';
import { LoggerService, LOG_ADAPTER } from '../services/logging/logger.service';
import { ConsoleLogger } from '../services/logging/loggers/console-logger';
import { Logger } from '../services/logging/logger-base';
import { HeaderLogoSvgComponent } from './header/header-logo-svg/header-logo-svg.component';
import { VideoFilterComponent } from './video-filter/video-filter.component';
import { HyphenatePipe } from './pipes/hyphenate.pipe';
import { ForcePlayVideoDirective } from './force-play-video.directive';
import { NgSelectModule } from '@ng-select/ng-select';
import { VhoQueryService } from '../vh-officer/services/vho-query-service.service';
import { CrestLogoImageSourceDirective } from './directives/crest-logo-image-source.directive';
import { StaffMemberVenueListComponent } from './venue-list/staff-member-venue-list/staff-member-venue-list.component';
import { VhOfficerVenueListComponent } from './venue-list/vh-officer-venue-list/vh-officer-venue-list.component';
import { FaIconLibrary, FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
    faCheck,
    faChevronDown,
    faChevronUp,
    faCommentAlt as faCommentAltSolid,
    faEllipsisH,
    faExclamationCircle,
    faExclamationTriangle,
    faFileAlt,
    faLanguage,
    faLink,
    faLock,
    faMicrophone,
    faMicrophoneSlash,
    faPhone,
    faPhoneAlt,
    faQuestionCircle,
    faShareSquare,
    faSignInAlt,
    faSignOutAlt,
    faSlidersH,
    faThumbtack,
    faTv,
    faUser as faUserSolid,
    faVideo,
    faVideoSlash
} from '@fortawesome/free-solid-svg-icons';
import {
    faAddressCard,
    faCommentAlt as faCommentAltRegular,
    faEye,
    faEyeSlash,
    faHandPaper,
    faPauseCircle,
    faPlayCircle,
    faStopCircle,
    faUser as faUserRegular
} from '@fortawesome/free-regular-svg-icons';
import { RoomNamePipe } from './pipes/room-name.pipe';
import { HookElementDirective } from './directives/hook-element.directive';
import { RandomPipe } from './pipes/random.pipe';
import { Router } from '@angular/router';
import { SecurityServiceProvider } from '../security/authentication/security-provider.service';
import { ProfileService } from '../services/api/profile.service';
import { AppInsightsLoggerService } from '../services/logging/loggers/app-insights-logger.service';
import { SecurityConfigSetupService } from '../security/security-config-setup.service';
import { TruncatableTextComponent } from './truncatable-text/truncatable-text.component';
import { CookiesComponent } from './cookies/cookies.component';
import { ConfirmSelfTestPopupComponent } from './self-test/confirmation/confirm-self-test-popup.component';
import { WarnJoinHearingPopupComponent } from '../waiting-space/confirmation/warn-join-hearing-popup.component';

export function getSettings(configService: ConfigService) {
    return () => configService.loadConfig();
}

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
        TranslateModule,
        NgSelectModule,
        FontAwesomeModule
    ],
    declarations: [
        HeaderComponent,
        FooterComponent,
        ContactUsComponent,
        ContactUsFoldingComponent,
        ErrorComponent,
        NotFoundComponent,
        SelectMediaDevicesComponent,
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
        NgxDatePipe,
        HyphenatePipe,
        LoadingComponent,
        HeaderLogoSvgComponent,
        VideoFilterComponent,
        ForcePlayVideoDirective,
        CrestLogoImageSourceDirective,
        StaffMemberVenueListComponent,
        VhOfficerVenueListComponent,
        RoomNamePipe,
        HookElementDirective,
        RandomPipe,
        TruncatableTextComponent,
        CookiesComponent,
        ConfirmSelfTestPopupComponent,
        WarnJoinHearingPopupComponent
    ],
    providers: [
        { provide: Logger, useClass: LoggerService },
        { provide: LOG_ADAPTER, useClass: ConsoleLogger, multi: true },
        {
            provide: LOG_ADAPTER,
            useClass: AppInsightsLoggerService,
            multi: true,
            deps: [SecurityServiceProvider, ConfigService, Router, ProfileService, SecurityConfigSetupService]
        },
        ConfigService,
        WindowScrolling,
        ScreenHelper,
        TestLanguageService,
        DatePipe,
        ParticipantPanelModelMapper,
        VhoQueryService
    ],
    exports: [
        HeaderComponent,
        FooterComponent,
        ContactUsComponent,
        ContactUsFoldingComponent,
        SelectMediaDevicesComponent,
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
        NgxDatePipe,
        HyphenatePipe,
        LoadingComponent,
        VideoFilterComponent,
        ForcePlayVideoDirective,
        CrestLogoImageSourceDirective,
        StaffMemberVenueListComponent,
        VhOfficerVenueListComponent,
        FontAwesomeModule,
        RoomNamePipe,
        HookElementDirective,
        RandomPipe,
        TruncatableTextComponent,
        ConfirmSelfTestPopupComponent,
        WarnJoinHearingPopupComponent
    ]
})
export class SharedModule {
    constructor(library: FaIconLibrary) {
        library.addIcons(
            faAddressCard,
            faCheck,
            faChevronDown,
            faChevronUp,
            faCommentAltRegular,
            faCommentAltSolid,
            faEllipsisH,
            faExclamationCircle,
            faExclamationTriangle,
            faEye,
            faEyeSlash,
            faFileAlt,
            faHandPaper,
            faLanguage,
            faLink,
            faLock,
            faPauseCircle,
            faPhone,
            faPhoneAlt,
            faPlayCircle,
            faMicrophone,
            faMicrophoneSlash,
            faQuestionCircle,
            faShareSquare,
            faSignInAlt,
            faSignOutAlt,
            faSlidersH,
            faStopCircle,
            faThumbtack,
            faTv,
            faUserRegular,
            faUserSolid,
            faVideo,
            faVideoSlash
        );
    }
}
