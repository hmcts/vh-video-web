import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { SecurityRoutingModule } from './security-routing.module';
import { LoginComponent } from './login.component';
import { LogoutComponent } from './logout.component';

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    SecurityRoutingModule
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
export class SecurityModule { }
