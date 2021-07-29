import { OidcSecurityService } from 'angular-auth-oidc-client';
import { SecurityConfigSetupService } from '../security-config-setup.service';
import { IdpProviders } from '../idp-providers';
import { SecurityServiceProvider } from './security-provider.service';
import { ISecurityService } from './security-service.interface';
import { MagicLinkSecurityService } from './magic-link-security.service';
import { Subject } from 'rxjs';
import { getSpiedPropertyGetter } from 'src/app/shared/jasmine-helpers/property-helpers';

describe('SecurityServiceProviderService', () => {
    let service: SecurityServiceProvider;

    let securityConfigSetupServiceSpy: jasmine.SpyObj<SecurityConfigSetupService>;
    let oidcSecurityServiceSpy: jasmine.SpyObj<ISecurityService>;
    let magicLinkSecurityServiceSpy: jasmine.SpyObj<ISecurityService>;
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
        magicLinkSecurityServiceSpy = jasmine.createSpyObj<ISecurityService>('MagicLinkSecurityService', ['getToken']);

        service = new SecurityServiceProvider(
            securityConfigSetupServiceSpy,
            (magicLinkSecurityServiceSpy as unknown) as MagicLinkSecurityService,
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

        it('should return the magicLinkSecurityService when the selected IDP is magicLink', () => {
            // Arrange
            securityConfigSetupServiceSpy.getIdp.and.returnValue(IdpProviders.magicLink);

            // Act
            const securityService = service.getSecurityService();

            // Assert
            expect(securityService).toBe(magicLinkSecurityServiceSpy);
        });
    });
});
