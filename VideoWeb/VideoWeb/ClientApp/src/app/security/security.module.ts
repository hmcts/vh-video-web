import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { SecurityRoutingModule } from './security-routing.module';
import { LoginComponent } from './login/login.component';
import { LogoutComponent } from './logout/logout.component';
import { UnauthorisedComponent } from './unauthorised/unauthorised.component';

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    SecurityRoutingModule
  ],
  declarations: [
    LoginComponent,
    LogoutComponent,
    UnauthorisedComponent
  ],
  exports: [
    LoginComponent,
    LogoutComponent
  ]
})
export class SecurityModule { }
