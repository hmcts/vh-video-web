import { CommonModule } from '@angular/common';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { EjudSignInComponent } from './idp-selection/ejud-sign-in.component';
import { IdpSelectionComponent } from './idp-selection/idp-selection.component';
import { VhSignInComponent } from './idp-selection/vh-sign-in.component';
import { LoginComponent } from './login/login.component';
import { LogoutComponent } from './logout/logout.component';
import { SecurityConfigSetupService } from './security-config-setup.service';
import { SecurityRoutingModule } from './security-routing.module';
import { UnauthorisedComponent } from './unauthorised/unauthorised.component';

export function setupSecurity(securityConfigService: SecurityConfigSetupService) {
    return () => securityConfigService.setupConfig();
}
@NgModule({
    imports: [CommonModule, SharedModule, SecurityRoutingModule],
    declarations: [LoginComponent, LogoutComponent, UnauthorisedComponent, IdpSelectionComponent, EjudSignInComponent, VhSignInComponent],
    exports: [LoginComponent, LogoutComponent, IdpSelectionComponent],
    providers: [{ provide: APP_INITIALIZER, useFactory: setupSecurity, deps: [SecurityConfigSetupService], multi: true }]
})
export class SecurityModule {}
