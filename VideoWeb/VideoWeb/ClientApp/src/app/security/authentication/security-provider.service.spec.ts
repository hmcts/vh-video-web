import { OidcSecurityService } from 'angular-auth-oidc-client';
import { SecurityConfigSetupService } from '../security-config-setup.service';
import { IdpProviders } from '../idp-providers';
import { SecurityServiceProvider } from './security-provider.service';
import { ISecurityService } from './security-service.interface';
import { QuickLinkSecurityService } from './quick-link-security.service';
import { Subject } from 'rxjs';
import { getSpiedPropertyGetter } from 'src/app/shared/jasmine-helpers/property-helpers';

describe('SecurityServiceProviderService', () => {
    let service: SecurityServiceProvider;

    let securityConfigSetupServiceSpy: jasmine.SpyObj<SecurityConfigSetupService>;
    let oidcSecurityServiceSpy: jasmine.SpyObj<ISecurityService>;
    let quickLinkSecurityServiceSpy: jasmine.SpyObj<ISecurityService>;
    let currentIdpSubject: Subject<IdpProviders>;

    beforeEach(() => {
        securityConfigSetupServiceSpy = jasmine.createSpyObj<SecurityConfigSetupService>(
            'SecurityConfigSetupService',
            ['getIdp'],
            ['currentIdp$']
        );

        currentIdpSubject = new Subject<IdpProviders>();
        getSpiedPropertyGetter(securityConfigSetupServiceSpy, 'currentIdp$').and.returnValue(currentIdpSubject.asObservable());

        oidcSecurityServiceSpy = jasmine.createSpyObj<ISecurityService>('OidcSecurityService', ['getToken']);
        quickLinkSecurityServiceSpy = jasmine.createSpyObj<ISecurityService>('QuickLinkSecurityService', ['getToken']);

        service = new SecurityServiceProvider(
            securityConfigSetupServiceSpy,
            (quickLinkSecurityServiceSpy as unknown) as QuickLinkSecurityService,
            (oidcSecurityServiceSpy as unknown) as OidcSecurityService
        );
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('getSecurityService', () => {
        it('should return oidcSecurityService when the selected IDP is vhaad', () => {
            // Arrange
            securityConfigSetupServiceSpy.getIdp.and.returnValue(IdpProviders.vhaad);

            // Act
            const securityService = service.getSecurityService();

            // Assert
            expect(securityService).toBe(oidcSecurityServiceSpy);
        });

        it('should return oidcSecurityService when the selected IDP is ejud', () => {
            // Arrange
            securityConfigSetupServiceSpy.getIdp.and.returnValue(IdpProviders.ejud);

            // Act
            const securityService = service.getSecurityService();

            // Assert
            expect(securityService).toBe(oidcSecurityServiceSpy);
        });

        it('should return the quickLinkSecurityService when the selected IDP is quickLink', () => {
            // Arrange
            securityConfigSetupServiceSpy.getIdp.and.returnValue(IdpProviders.quickLink);

            // Act
            const securityService = service.getSecurityService();

            // Assert
            expect(securityService).toBe(quickLinkSecurityServiceSpy);
        });
    });
});
