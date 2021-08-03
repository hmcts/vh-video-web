import { MagicLinksService } from './magic-links.service';
import { ApiClient, MagicLinkParticipantJoinRequest, MagicLinkParticipantJoinResponse, Role } from '../clients/api-client';
import { SecurityConfigSetupService } from 'src/app/security/security-config-setup.service';
import { SecurityServiceProvider } from 'src/app/security/authentication/security-provider.service';
import { fakeAsync, flush } from '@angular/core/testing';
import { IdpProviders } from 'src/app/security/idp-providers';
import { MagicLinkSecurityService } from 'src/app/security/authentication/magic-link-security.service';
import { Subject } from 'rxjs';
import { getSpiedPropertyGetter } from 'src/app/shared/jasmine-helpers/property-helpers';

describe('MagicLinksService', () => {
    let service: MagicLinksService;

    let apiClientSpy: jasmine.SpyObj<ApiClient>;
    let securityConfigSetupServiceSpy: jasmine.SpyObj<SecurityConfigSetupService>;
    let magicLinkSecurityServiceSpy: jasmine.SpyObj<MagicLinkSecurityService>;
    let securityServiceProviderServiceSpy: jasmine.SpyObj<SecurityServiceProvider>;

    let isAuthenticatedSubject: Subject<boolean>;

    beforeEach(() => {
        apiClientSpy = jasmine.createSpyObj<ApiClient>('ApiClient', [
            'joinConferenceAsAMagicLinkUser',
            'validateMagicLink',
            'getMagicLinkParticipantRoles'
        ]);

        securityConfigSetupServiceSpy = jasmine.createSpyObj<SecurityConfigSetupService>('SecurityConfigSetupService', ['setIdp']);

        magicLinkSecurityServiceSpy = jasmine.createSpyObj<MagicLinkSecurityService>(
            'MagicLinkSecurityService',
            ['authorize'],
            ['isAuthenticated$']
        );

        isAuthenticatedSubject = new Subject<boolean>();
        getSpiedPropertyGetter(magicLinkSecurityServiceSpy, 'isAuthenticated$').and.returnValue(isAuthenticatedSubject.asObservable());

        securityServiceProviderServiceSpy = jasmine.createSpyObj<SecurityServiceProvider>('SecurityServiceProviderService', [
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
            isAuthenticatedSubject.next(true);
            flush();

            // Assert
            expect(result).toBe(true);
            expect(apiClientSpy.joinConferenceAsAMagicLinkUser).toHaveBeenCalledOnceWith(hearingId, expectedRequest);
            expect(securityConfigSetupServiceSpy.setIdp).toHaveBeenCalledOnceWith(IdpProviders.magicLink);
            expect(securityServiceProviderServiceSpy.getSecurityService).toHaveBeenCalledTimes(2);
            expect(magicLinkSecurityServiceSpy.authorize).toHaveBeenCalledOnceWith(null, expectedResponse.jwt);
        }));

        it('should return the is authenticated observable and filter false', fakeAsync(() => {
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
            isAuthenticatedSubject.next(false);
            flush();

            // Assert
            expect(result).toBeNull();
            expect(apiClientSpy.joinConferenceAsAMagicLinkUser).toHaveBeenCalledOnceWith(hearingId, expectedRequest);
            expect(securityConfigSetupServiceSpy.setIdp).toHaveBeenCalledOnceWith(IdpProviders.magicLink);
            expect(securityServiceProviderServiceSpy.getSecurityService).toHaveBeenCalledTimes(2);
            expect(magicLinkSecurityServiceSpy.authorize).toHaveBeenCalledOnceWith(null, expectedResponse.jwt);
        }));

        it('should return the is authenticated observable and emit true', fakeAsync(() => {
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
            isAuthenticatedSubject.next(true);
            flush();

            // Assert
            expect(result).toBeTrue();
            expect(apiClientSpy.joinConferenceAsAMagicLinkUser).toHaveBeenCalledOnceWith(hearingId, expectedRequest);
            expect(securityConfigSetupServiceSpy.setIdp).toHaveBeenCalledOnceWith(IdpProviders.magicLink);
            expect(securityServiceProviderServiceSpy.getSecurityService).toHaveBeenCalledTimes(2);
            expect(magicLinkSecurityServiceSpy.authorize).toHaveBeenCalledOnceWith(null, expectedResponse.jwt);
        }));
    });
});
