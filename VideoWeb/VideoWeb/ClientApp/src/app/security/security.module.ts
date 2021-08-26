import { CommonModule } from '@angular/common';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { ConfigService } from '../services/api/config.service';
import { getSettings, restoreConfig, setupSecurity, SharedModule } from '../shared/shared.module';
import { EjudSignInComponent } from './idp-selection/ejud-sign-in.component';
import { IdpSelectionComponent } from './idp-selection/idp-selection.component';
import { VhSignInComponent } from './idp-selection/vh-sign-in.component';
import { LoginComponent } from './login/login.component';
import { LogoutComponent } from './logout/logout.component';
import { SecurityConfigSetupService } from './security-config-setup.service';
import { SecurityRoutingModule } from './security-routing.module';
import { UnauthorisedComponent } from './unauthorised/unauthorised.component';
import { JwtHelperService as Auth0JwtHelperService, JWT_OPTIONS } from '@auth0/angular-jwt';

@NgModule({
    imports: [CommonModule, SharedModule, SecurityRoutingModule],
    declarations: [LoginComponent, LogoutComponent, UnauthorisedComponent, IdpSelectionComponent, EjudSignInComponent, VhSignInComponent],
    exports: [LoginComponent, LogoutComponent, IdpSelectionComponent],
    providers: [
        ConfigService,
        SecurityConfigSetupService,
        { provide: APP_INITIALIZER, useFactory: getSettings, deps: [ConfigService], multi: true },
        { provide: APP_INITIALIZER, useFactory: setupSecurity, deps: [SecurityConfigSetupService], multi: true },
        {
            provide: APP_INITIALIZER,
            useFactory: restoreConfig,
            deps: [SecurityConfigSetupService],
            multi: true
        },
        { provide: JWT_OPTIONS, useValue: JWT_OPTIONS },
        Auth0JwtHelperService
    ]
})
export class SecurityModule {}
