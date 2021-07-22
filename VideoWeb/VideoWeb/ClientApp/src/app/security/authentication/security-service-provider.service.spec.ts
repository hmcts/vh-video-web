import { OidcSecurityService } from 'angular-auth-oidc-client';
import { SecurityConfigSetupService } from '../security-config-setup.service';
import { IdpProviders } from '../security-providers';
import { SecurityServiceProviderService } from './security-service-provider.service';

describe('SecurityServiceProviderService', () => {
    let service: SecurityServiceProviderService;

    let securityConfigSetupServiceSpy: jasmine.SpyObj<SecurityConfigSetupService>;
    let oidcSecurityServiceSpy: jasmine.SpyObj<OidcSecurityService>;

    beforeEach(() => {
        securityConfigSetupServiceSpy = jasmine.createSpyObj<SecurityConfigSetupService>('SecurityConfigSetupService', ['getIdp']);
        oidcSecurityServiceSpy = jasmine.createSpyObj<OidcSecurityService>('OidcSecurityService', ['getToken']);

        service = new SecurityServiceProviderService(securityConfigSetupServiceSpy, oidcSecurityServiceSpy);
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

        it('should return null when the selected IDP is magicLink', () => {
            // Arrange
            securityConfigSetupServiceSpy.getIdp.and.returnValue(IdpProviders.magicLink);

            // Act
            const securityService = service.getSecurityService();

            // Assert
            expect(securityService).toBeNull();
        });
    });
});
