import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {DeclarationComponent} from './declaration/declaration.component';
import {WaitingRoomComponent} from './waiting-room/waiting-room.component';
import {HearingRulesComponent} from './hearing-rules/hearing-rules.component';

export const routes: Routes = [
  { path: 'declaration', component: DeclarationComponent },
  { path: 'waiting-room', component: WaitingRoomComponent },
  { path: 'hearing-rules', component: HearingRulesComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OnTheDayRoutingModule { }
