import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {AuthGuard} from './security/auth.gaurd';
import { HomeComponent } from './home/home.component';
import { VideoEventsComponent } from './video-events/video-events.component';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'events/:conferenceId', component: SendVideoEventsComponent },
  { path: 'home', component: HomeComponent, canActivate: [AuthGuard] },
  { path: '**', redirectTo: 'home', pathMatch: 'full', canActivate: [AuthGuard] },
  { path: 'videoevents/:hearingId', component: VideoEventsComponent, canActivate: [AuthGuard] }
];

@NgModule({
  exports: [
    RouterModule
  ],
  imports: [
    RouterModule.forRoot(routes)],
})

export class AppRoutingModule { }
