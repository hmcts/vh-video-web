import { Injectable } from '@angular/core';
import { ApiClient, QuickLinkParticipantJoinRequest, QuickLinkParticipantJoinResponse, Role } from 'src/app/services/clients/api-client';
import { Observable } from 'rxjs';
import { filter, mergeMap, take, tap } from 'rxjs/operators';
import { SecurityConfigSetupService } from 'src/app/security/security-config-setup.service';
import { IdpProviders } from 'src/app/security/idp-providers';
import { SecurityServiceProvider } from 'src/app/security/authentication/security-provider.service';

@Injectable({
    providedIn: 'root'
})
export class QuickLinksService {
    constructor(
        private apiClient: ApiClient,
        private securityConfigSetupService: SecurityConfigSetupService,
        private securityServiceProviderService: SecurityServiceProvider
    ) {}

    getQuickLinkParticipantRoles(): Observable<Role[]> {
        return this.apiClient.getQuickLinkParticipantRoles();
    }

    validateQuickLink(hearingId: string): Observable<boolean> {
        return this.apiClient.validateQuickLink(hearingId);
    }

    joinHearing(hearingId: string, name: string, role: Role): Observable<boolean> {
        return this.apiClient
            .joinConferenceAsAQuickLinkUser(
                hearingId,
                new QuickLinkParticipantJoinRequest({
                    name: name,
                    role: role
                })
            )
            .pipe(
                tap((response: QuickLinkParticipantJoinResponse) => {
                    this.securityConfigSetupService.setIdp(IdpProviders.quickLink);
                    this.securityServiceProviderService.getSecurityService().authorize(null, response.jwt);
                }),
                mergeMap(() =>
                    this.securityServiceProviderService.getSecurityService().isAuthenticated$.pipe(
                        filter(authenticated => authenticated),
                        take(1)
                    )
                )
            );
    }
}
