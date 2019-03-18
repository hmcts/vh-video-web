import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { OnTheDayModuleRoutingModule } from './on-the-day-routing.module';

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    OnTheDayModuleRoutingModule
  ],
  declarations: [
    LoginComponent,
    LogoutComponent
  ],
  exports: [
    LoginComponent,
    LogoutComponent
  ]
})
export class OnTheDayModule { }
