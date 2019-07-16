import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthGuard } from '../security/auth.guard';
import { ContactUsComponent } from './contact-us/contact-us.component';
import { ErrorComponent } from './error/error.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { PageUrls } from './page-url.constants';
import { UnsupportedBrowserComponent } from './unsupported-browser/unsupported-browser.component';


export const routes: Routes = [
  { path: `${PageUrls.ContactUs}`, component: ContactUsComponent, canActivate: [AuthGuard] },
  { path: `${PageUrls.ServiceError}`, component: ErrorComponent, },
  { path: `${PageUrls.NotFound}`, component: NotFoundComponent },
  { path: `${PageUrls.UnsupportedBrowser}`, component: UnsupportedBrowserComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SharedRoutingModule { }
