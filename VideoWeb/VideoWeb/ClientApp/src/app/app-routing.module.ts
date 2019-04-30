import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {AuthGuard} from './security/auth.guard';
import { HomeComponent } from './home/home.component';
import { SendVideoEventsComponent } from './send-video-events/send-video-events.component';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'events/:conferenceId', component: SendVideoEventsComponent },
  { path: 'home', component: HomeComponent, canActivate: [AuthGuard] },
  { path: '**', redirectTo: 'not-found', pathMatch: 'full', canActivate: [AuthGuard] }
];

@NgModule({
  exports: [
    RouterModule
  ],
  imports: [
    RouterModule.forRoot(routes)],
})

export class AppRoutingModule { }
