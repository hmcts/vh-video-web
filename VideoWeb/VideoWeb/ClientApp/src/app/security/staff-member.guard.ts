import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ProfileService } from '../services/api/profile.service';
import { Role } from '../services/clients/api-client';
import { Logger } from '../services/logging/logger-base';
import { SecurityServiceProvider } from './authentication/security-provider.service';
import { RoleGuard } from './role-guard';

@Injectable({
    providedIn: 'root'
})
export class StaffMemberGuard extends RoleGuard {
    protected roles = [Role.StaffMember];
    protected loggerPrefix = '[StaffMemberGuard]';

    constructor(
        securityServiceProviderService: SecurityServiceProvider,
        userProfileService: ProfileService,
        router: Router,
        logger: Logger
    ) {
        super(securityServiceProviderService, userProfileService, router, logger);
    }
}
