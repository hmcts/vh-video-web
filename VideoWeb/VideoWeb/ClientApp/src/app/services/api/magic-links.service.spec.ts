import { MagicLinksService } from './magic-links.service';
import { ApiClient, MagicLinkParticipantJoinRequest, MagicLinkParticipantJoinResponse, Role } from '../clients/api-client';
import { SecurityConfigSetupService } from 'src/app/security/security-config-setup.service';
import { SecurityServiceProviderService } from 'src/app/security/authentication/security-service-provider.service';
import { fakeAsync, flush } from '@angular/core/testing';
import { IdpProviders } from 'src/app/security/idp-providers';
import { MagicLinkSecurityService } from 'src/app/security/authentication/magic-link-security.service';
import { Subject } from 'rxjs';

describe('MagicLinksService', () => {
    let service: MagicLinksService;

    let apiClientSpy: jasmine.SpyObj<ApiClient>;
    let securityConfigSetupServiceSpy: jasmine.SpyObj<SecurityConfigSetupService>;
    let magicLinkSecurityServiceSpy: jasmine.SpyObj<MagicLinkSecurityService>;
    let securityServiceProviderServiceSpy: jasmine.SpyObj<SecurityServiceProviderService>;

    beforeEach(() => {
        apiClientSpy = jasmine.createSpyObj<ApiClient>('ApiClient', [
            'joinConferenceAsAMagicLinkUser',
            'validateMagicLink',
            'getMagicLinkParticipantRoles'
        ]);
        securityConfigSetupServiceSpy = jasmine.createSpyObj<SecurityConfigSetupService>('SecurityConfigSetupService', ['setIdp']);
        magicLinkSecurityServiceSpy = jasmine.createSpyObj<MagicLinkSecurityService>('MagicLinkSecurityService', ['authorize']);
        securityServiceProviderServiceSpy = jasmine.createSpyObj<SecurityServiceProviderService>('SecurityServiceProviderService', [
            'getSecurityService'
        ]);

        securityServiceProviderServiceSpy.getSecurityService.and.returnValue(magicLinkSecurityServiceSpy);

        service = new MagicLinksService(apiClientSpy, securityConfigSetupServiceSpy, securityServiceProviderServiceSpy);
    });

    describe('getMagicLinkParticipantRoles', () => {
        it('should call the api to get magic link participant roles', () => {
            // Act
            service.getMagicLinkParticipantRoles();

            // Assert
            expect(apiClientSpy.getMagicLinkParticipantRoles).toHaveBeenCalledTimes(1);
        });
    });

    describe('validateMagicLink', () => {
        it('should call the api for validation', () => {
            // Arrange
            const hearingId = 'hearing-id';

            // Act
            service.validateMagicLink(hearingId);

            // Assert
            expect(apiClientSpy.validateMagicLink).toHaveBeenCalledOnceWith(hearingId);
        });
    });

    describe('joinHearing', () => {
        it('should call the api to join the hearing', () => {
            // Arrange
            const hearingId = 'hearing-id';
            const name = 'name';
            const role = Role.Judge;
            const expectedRequest = new MagicLinkParticipantJoinRequest({
                name: name,
                role: role
            });

            const joinSubject = new Subject<MagicLinkParticipantJoinResponse>();
            apiClientSpy.joinConferenceAsAMagicLinkUser.and.returnValue(joinSubject.asObservable());

            // Act
            service.joinHearing(hearingId, name, role);

            // Assert
            expect(apiClientSpy.joinConferenceAsAMagicLinkUser).toHaveBeenCalledOnceWith(hearingId, expectedRequest);
        });

        it('should perform side effects when the observable is subscribed to', fakeAsync(() => {
            // Arrange
            const hearingId = 'hearing-id';
            const name = 'name';
            const role = Role.Judge;
            const expectedRequest = new MagicLinkParticipantJoinRequest({
                name: name,
                role: role
            });
            const expectedResponse = new MagicLinkParticipantJoinResponse({
                jwt: 'jwt'
            });

            const joinSubject = new Subject<MagicLinkParticipantJoinResponse>();
            apiClientSpy.joinConferenceAsAMagicLinkUser.and.returnValue(joinSubject.asObservable());

            // Act
            let result = null;
            service.joinHearing(hearingId, name, role).subscribe(response => {
                result = response;
            });
            joinSubject.next(expectedResponse);
            flush();

            // Assert
            expect(result).toBe(expectedResponse);
            expect(apiClientSpy.joinConferenceAsAMagicLinkUser).toHaveBeenCalledOnceWith(hearingId, expectedRequest);
            expect(securityConfigSetupServiceSpy.setIdp).toHaveBeenCalledOnceWith(IdpProviders.magicLink);
            expect(securityServiceProviderServiceSpy.getSecurityService).toHaveBeenCalledTimes(1);
            expect(magicLinkSecurityServiceSpy.authorize).toHaveBeenCalledOnceWith(null, expectedResponse.jwt);
        }));
    });
});
