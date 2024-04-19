import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../security/auth.guard';
import { ContactUsComponent } from './contact-us/contact-us.component';
import { ErrorComponent } from './error/error.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { pageUrls } from './page-url.constants';
import { UnsupportedBrowserComponent } from './unsupported-browser/unsupported-browser.component';
import { PrivacyPolicyComponent } from './privacy-policy/privacy-policy.component';
import { AccessibilityComponent } from './accessibility/accessibility.component';
import { ErrorCameraMicrophoneComponent } from './error-camera-microphone/error-camera-microphone.component';
import { CookiesComponent } from './cookies/cookies.component';

export const routes: Routes = [
    { path: `${pageUrls.ContactUs}`, component: ContactUsComponent, canActivate: [AuthGuard] },
    { path: `${pageUrls.ServiceError}`, component: ErrorComponent },
    { path: `${pageUrls.NotFound}`, component: NotFoundComponent },
    { path: `${pageUrls.UnsupportedBrowser}`, component: UnsupportedBrowserComponent },
    { path: `${pageUrls.PrivacyPolicy}`, component: PrivacyPolicyComponent },
    { path: `${pageUrls.Cookies}`, component: CookiesComponent, data: { title: 'Cookies' } },
    { path: `${pageUrls.Accessibility}`, component: AccessibilityComponent },
    { path: `${pageUrls.ErrorCameraMicrophone}`, component: ErrorCameraMicrophoneComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class SharedRoutingModule {}
