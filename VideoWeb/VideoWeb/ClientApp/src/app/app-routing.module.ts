import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './security/auth.guard';
import { HomeComponent } from './home/home.component';
import { SendVideoEventsComponent } from './send-video-events/send-video-events.component';
import { PageUrls } from './shared/page-url.constants';

export const routes: Routes = [
  { path: '', redirectTo: `${PageUrls.Home}`, pathMatch: 'full' },
  { path: `${PageUrls.AdminHearingList}`, loadChildren: () => import('./vh-officer/vh-officer.module').then(m => m.VhOfficerModule) },
  { path: 'events/:conferenceId', component: SendVideoEventsComponent },
  { path: `${PageUrls.Home}`, component: HomeComponent, canActivate: [AuthGuard] },
  { path: '**', redirectTo: `${PageUrls.NotFound}`, pathMatch: 'full', canActivate: [AuthGuard] }
];

@NgModule({
  exports: [
    RouterModule
  ],
  imports: [
    RouterModule.forRoot(routes)],
})

export class AppRoutingModule { }
