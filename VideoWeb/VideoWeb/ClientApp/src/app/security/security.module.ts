import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';
import { SharedModule } from '../shared/shared.module';
import { EjudSignInComponent } from './idp-selection/ejud-sign-in.component';
import { IdpSelectionComponent } from './idp-selection/idp-selection.component';
import { VhSignInComponent } from './idp-selection/vh-sign-in.component';
import { LoginComponent } from './login/login.component';
import { LogoutComponent } from './logout/logout.component';
import { SecurityRoutingModule } from './security-routing.module';
import { UnauthorisedComponent } from './unauthorised/unauthorised.component';

@NgModule({
    imports: [CommonModule, SharedModule, SecurityRoutingModule],
    declarations: [LoginComponent, LogoutComponent, UnauthorisedComponent, IdpSelectionComponent, EjudSignInComponent, VhSignInComponent],
    exports: [LoginComponent, LogoutComponent, IdpSelectionComponent, JwtHelperService]
})
export class SecurityModule {}
