import { QuickLinksService } from './quick-links.service';
import { ApiClient, QuickLinkParticipantJoinRequest, QuickLinkParticipantJoinResponse, Role } from '../clients/api-client';
import { SecurityConfigSetupService } from 'src/app/security/security-config-setup.service';
import { SecurityServiceProvider } from 'src/app/security/authentication/security-provider.service';
import { fakeAsync, flush } from '@angular/core/testing';
import { IdpProviders } from 'src/app/security/idp-providers';
import { QuickLinkSecurityService } from 'src/app/security/authentication/quick-link-security.service';
import { Subject } from 'rxjs';
import { getSpiedPropertyGetter } from 'src/app/shared/jasmine-helpers/property-helpers';

describe('QuickLinksService', () => {
    let service: QuickLinksService;

    let apiClientSpy: jasmine.SpyObj<ApiClient>;
    let securityConfigSetupServiceSpy: jasmine.SpyObj<SecurityConfigSetupService>;
    let quickLinkSecurityServiceSpy: jasmine.SpyObj<QuickLinkSecurityService>;
    let securityServiceProviderServiceSpy: jasmine.SpyObj<SecurityServiceProvider>;

    let isAuthenticatedSubject: Subject<boolean>;

    beforeEach(() => {
        apiClientSpy = jasmine.createSpyObj<ApiClient>('ApiClient', [
            'joinConferenceAsAQuickLinkUser',
            'validateQuickLink',
            'getQuickLinkParticipantRoles'
        ]);

        securityConfigSetupServiceSpy = jasmine.createSpyObj<SecurityConfigSetupService>('SecurityConfigSetupService', ['setIdp']);

        quickLinkSecurityServiceSpy = jasmine.createSpyObj<QuickLinkSecurityService>(
            'QuickLinkSecurityService',
            ['authorize'],
            ['isAuthenticated$']
        );

        isAuthenticatedSubject = new Subject<boolean>();
        getSpiedPropertyGetter(quickLinkSecurityServiceSpy, 'isAuthenticated$').and.returnValue(isAuthenticatedSubject.asObservable());

        securityServiceProviderServiceSpy = jasmine.createSpyObj<SecurityServiceProvider>('SecurityServiceProviderService', [
            'getSecurityService'
        ]);

        securityServiceProviderServiceSpy.getSecurityService.and.returnValue(quickLinkSecurityServiceSpy);

        service = new QuickLinksService(apiClientSpy, securityConfigSetupServiceSpy, securityServiceProviderServiceSpy);
    });

    describe('getQuickLinkParticipantRoles', () => {
        it('should call the api to get quick link participant roles', () => {
            // Act
            service.getQuickLinkParticipantRoles();

            // Assert
            expect(apiClientSpy.getQuickLinkParticipantRoles).toHaveBeenCalledTimes(1);
        });
    });

    describe('validateQuickLink', () => {
        it('should call the api for validation', () => {
            // Arrange
            const hearingId = 'hearing-id';

            // Act
            service.validateQuickLink(hearingId);

            // Assert
            expect(apiClientSpy.validateQuickLink).toHaveBeenCalledOnceWith(hearingId);
        });
    });

    describe('joinHearing', () => {
        it('should call the api to join the hearing', () => {
            // Arrange
            const hearingId = 'hearing-id';
            const name = 'name';
            const role = Role.Judge;
            const expectedRequest = new QuickLinkParticipantJoinRequest({
                name: name,
                role: role
            });

            const joinSubject = new Subject<QuickLinkParticipantJoinResponse>();
            apiClientSpy.joinConferenceAsAQuickLinkUser.and.returnValue(joinSubject.asObservable());

            // Act
            service.joinConference(hearingId, name, role);

            // Assert
            expect(apiClientSpy.joinConferenceAsAQuickLinkUser).toHaveBeenCalledOnceWith(hearingId, expectedRequest);
        });

        it('should perform side effects when the observable is subscribed to', fakeAsync(() => {
            // Arrange
            const hearingId = 'hearing-id';
            const name = 'name';
            const role = Role.Judge;
            const expectedRequest = new QuickLinkParticipantJoinRequest({
                name: name,
                role: role
            });
            const expectedResponse = new QuickLinkParticipantJoinResponse({
                jwt: 'jwt'
            });

            const joinSubject = new Subject<QuickLinkParticipantJoinResponse>();
            apiClientSpy.joinConferenceAsAQuickLinkUser.and.returnValue(joinSubject.asObservable());

            // Act
            let result = null;
            service.joinConference(hearingId, name, role).subscribe(response => {
                result = response;
            });
            joinSubject.next(expectedResponse);
            flush();
            isAuthenticatedSubject.next(true);
            flush();

            // Assert
            expect(result).toBe(true);
            expect(apiClientSpy.joinConferenceAsAQuickLinkUser).toHaveBeenCalledOnceWith(hearingId, expectedRequest);
            expect(securityConfigSetupServiceSpy.setIdp).toHaveBeenCalledOnceWith(IdpProviders.quickLink);
            expect(securityServiceProviderServiceSpy.getSecurityService).toHaveBeenCalledTimes(2);
            expect(quickLinkSecurityServiceSpy.authorize).toHaveBeenCalledOnceWith(null, expectedResponse.jwt);
        }));

        it('should return the is authenticated observable and filter false', fakeAsync(() => {
            // Arrange
            const hearingId = 'hearing-id';
            const name = 'name';
            const role = Role.Judge;
            const expectedRequest = new QuickLinkParticipantJoinRequest({
                name: name,
                role: role
            });
            const expectedResponse = new QuickLinkParticipantJoinResponse({
                jwt: 'jwt'
            });

            const joinSubject = new Subject<QuickLinkParticipantJoinResponse>();
            apiClientSpy.joinConferenceAsAQuickLinkUser.and.returnValue(joinSubject.asObservable());

            // Act
            let result = null;
            service.joinConference(hearingId, name, role).subscribe(response => {
                result = response;
            });
            joinSubject.next(expectedResponse);
            flush();
            isAuthenticatedSubject.next(false);
            flush();

            // Assert
            expect(result).toBeNull();
            expect(apiClientSpy.joinConferenceAsAQuickLinkUser).toHaveBeenCalledOnceWith(hearingId, expectedRequest);
            expect(securityConfigSetupServiceSpy.setIdp).toHaveBeenCalledOnceWith(IdpProviders.quickLink);
            expect(securityServiceProviderServiceSpy.getSecurityService).toHaveBeenCalledTimes(2);
            expect(quickLinkSecurityServiceSpy.authorize).toHaveBeenCalledOnceWith(null, expectedResponse.jwt);
        }));

        it('should return the is authenticated observable and emit true', fakeAsync(() => {
            // Arrange
            const hearingId = 'hearing-id';
            const name = 'name';
            const role = Role.Judge;
            const expectedRequest = new QuickLinkParticipantJoinRequest({
                name: name,
                role: role
            });
            const expectedResponse = new QuickLinkParticipantJoinResponse({
                jwt: 'jwt'
            });

            const joinSubject = new Subject<QuickLinkParticipantJoinResponse>();
            apiClientSpy.joinConferenceAsAQuickLinkUser.and.returnValue(joinSubject.asObservable());

            // Act
            let result = null;
            service.joinConference(hearingId, name, role).subscribe(response => {
                result = response;
            });
            joinSubject.next(expectedResponse);
            flush();
            isAuthenticatedSubject.next(true);
            flush();

            // Assert
            expect(result).toBeTrue();
            expect(apiClientSpy.joinConferenceAsAQuickLinkUser).toHaveBeenCalledOnceWith(hearingId, expectedRequest);
            expect(securityConfigSetupServiceSpy.setIdp).toHaveBeenCalledOnceWith(IdpProviders.quickLink);
            expect(securityServiceProviderServiceSpy.getSecurityService).toHaveBeenCalledTimes(2);
            expect(quickLinkSecurityServiceSpy.authorize).toHaveBeenCalledOnceWith(null, expectedResponse.jwt);
        }));
    });
});
