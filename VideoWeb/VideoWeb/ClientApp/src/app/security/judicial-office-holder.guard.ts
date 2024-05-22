import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ProfileService } from '../services/api/profile.service';
import { Role } from '../services/clients/api-client';
import { LaunchDarklyService } from '../services/launch-darkly.service';
import { Logger } from '../services/logging/logger-base';
import { SecurityServiceProvider } from './authentication/security-provider.service';
import { RoleGuard } from './role-guard';

@Injectable({
    providedIn: 'root'
})
export class JudicialOfficeHolderGuard extends RoleGuard {
    protected roles = [Role.JudicialOfficeHolder];
    protected loggerPrefix = '[JudicialOfficeHolderGuard]';

    constructor(
        securityServiceProviderService: SecurityServiceProvider,
        userProfileService: ProfileService,
        router: Router,
        logger: Logger,
        ldService: LaunchDarklyService
    ) {
        super(securityServiceProviderService, userProfileService, router, logger, ldService);
    }
}
