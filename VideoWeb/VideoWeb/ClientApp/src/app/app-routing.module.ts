import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {AuthGuard} from './security/auth.gaurd';
import { HomeComponent } from './home/home.component';
import { DeclarationComponent } from './declaration/declaration.component';
import { WaitingRoomComponent } from './waiting-room/waiting-room.component';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent, canActivate: [AuthGuard] },
  { path: 'declaration', component: DeclarationComponent, canActivate: [AuthGuard] },
  { path: 'waiting-room', component: WaitingRoomComponent },
  { path: '**', redirectTo: 'home', pathMatch: 'full', canActivate: [AuthGuard] }

];

@NgModule({
  exports: [
    RouterModule
  ],
  imports: [
    RouterModule.forRoot(routes)],
})

export class AppRoutingModule { }
