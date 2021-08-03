import { Injectable } from '@angular/core';
import { ApiClient, MagicLinkParticipantJoinRequest, MagicLinkParticipantJoinResponse, Role } from 'src/app/services/clients/api-client';
import { Observable } from 'rxjs';
import { filter, mergeMap, take, tap } from 'rxjs/operators';
import { SecurityConfigSetupService } from 'src/app/security/security-config-setup.service';
import { IdpProviders } from 'src/app/security/idp-providers';
import { SecurityServiceProvider } from 'src/app/security/authentication/security-provider.service';

@Injectable({
    providedIn: 'root'
})
export class MagicLinksService {
    constructor(
        private apiClient: ApiClient,
        private securityConfigSetupService: SecurityConfigSetupService,
        private securityServiceProviderService: SecurityServiceProvider
    ) {}

    getMagicLinkParticipantRoles(): Observable<Role[]> {
        return this.apiClient.getMagicLinkParticipantRoles();
    }

    validateMagicLink(hearingId: string): Observable<boolean> {
        return this.apiClient.validateMagicLink(hearingId);
    }

    joinHearing(hearingId: string, name: string, role: Role): Observable<boolean> {
        return this.apiClient
            .joinConferenceAsAMagicLinkUser(
                hearingId,
                new MagicLinkParticipantJoinRequest({
                    name: name,
                    role: role
                })
            )
            .pipe(
                tap((response: MagicLinkParticipantJoinResponse) => {
                    this.securityConfigSetupService.setIdp(IdpProviders.magicLink);
                    this.securityServiceProviderService.getSecurityService().authorize(null, response.jwt);
                }),
                mergeMap(() =>
                    this.securityServiceProviderService.getSecurityService().isAuthenticated$.pipe(
                        take(1),
                        filter(authenticated => authenticated)
                    )
                )
            );
    }
}
