import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { OnTheDayRoutingModule } from './on-the-day-routing.module';
import { DeclarationComponent } from './declaration/declaration.component';
import { WaitingRoomComponent } from './waiting-room/waiting-room.component';

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    OnTheDayRoutingModule
  ],
  declarations: [
    DeclarationComponent,
    WaitingRoomComponent
  ],
  exports: [
    DeclarationComponent,
    WaitingRoomComponent
  ]
})
export class OnTheDayModule { }
