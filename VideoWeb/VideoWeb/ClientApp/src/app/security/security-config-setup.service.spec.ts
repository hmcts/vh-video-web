import { OidcConfigService } from 'angular-auth-oidc-client';
import { MockConfigService } from '../testing/mocks/mock-config.service';
import { SecurityConfigSetupService } from './security-config-setup.service';
import { IdpProviders } from './idp-providers';

describe('SecurityConfigSetupService', () => {
    let sut: SecurityConfigSetupService;
    let oidcConfigServiceSpy: jasmine.SpyObj<OidcConfigService>;
    const configService = new MockConfigService();

    beforeEach(() => {
        window.sessionStorage.clear();
        oidcConfigServiceSpy = jasmine.createSpyObj<OidcConfigService>('OidcConfigService', ['withConfig']);
        sut = new SecurityConfigSetupService(oidcConfigServiceSpy, configService as any);
        sut.setupConfig().subscribe();
    });

    it('should get default idp if not set', async () => {
        // Arrange

        // Act
        const result = sut.getIdp();

        // Assert
        expect(result).toBe(IdpProviders.vhaad);
    });

    it('should set config associated to provider when idp has been set', async () => {
        // Arrange
        const provider = IdpProviders.ejud;
        window.sessionStorage.clear();
        oidcConfigServiceSpy = jasmine.createSpyObj<OidcConfigService>('OidcConfigService', ['withConfig']);
        sut = new SecurityConfigSetupService(oidcConfigServiceSpy, configService as any);
        window.sessionStorage.setItem('IdpProviders', provider);

        // Act
        sut.setupConfig().subscribe();

        // Assert
        expect(oidcConfigServiceSpy.withConfig).toHaveBeenCalledWith(sut.config[provider]);
    });

    it('should set store when setting idp', async () => {
        // Arrange
        const testProvider = IdpProviders.ejud;

        // Act
        sut.setIdp(testProvider);

        // Assert
        const result = sut.getIdp();
        expect(result).toBe(testProvider);
    });

    it('should set oidc config on setIdp', async () => {
        // Arrange
        const testProvider = IdpProviders.ejud;

        // Act
        sut.setIdp(testProvider);

        // Assert
        expect(oidcConfigServiceSpy.withConfig).toHaveBeenCalledWith(sut.config[testProvider]);
    });

    it('should set config when config loads', async () => {
        // Arrange

        // Act

        // Assert
        expect(sut.config.vhaad.stsServer).toBe(`https://login.microsoftonline.com/${configService.vhAdSettings.tenant_id}/v2.0`);
        expect(sut.config.vhaad.clientId).toBe(configService.vhAdSettings.client_id);
        expect(sut.config.vhaad.redirectUrl).toBe(configService.vhAdSettings.redirect_uri);

        expect(sut.config.ejud.stsServer).toBe(`https://login.microsoftonline.com/${configService.ejudSettings.tenant_id}/v2.0`);
        expect(sut.config.ejud.clientId).toBe(configService.ejudSettings.client_id);
        expect(sut.config.ejud.redirectUrl).toBe(configService.ejudSettings.redirect_uri);
    });

    it('should set scope correctly when resource id is specified', async () => {
        // Arrange
        let configService = new MockConfigService();
        const ejudResourceId = '123';
        const vhResourceId = '234';
        configService.ejudSettings.resource_id = ejudResourceId;
        configService.vhAdSettings.resource_id = vhResourceId;
        sut = new SecurityConfigSetupService(oidcConfigServiceSpy, configService as any);

        // Act
        sut.setupConfig().subscribe();

        // Assert
        expect(sut.config[IdpProviders.ejud].scope).toBe(`openid profile offline_access ${ejudResourceId}/feapi`);
        expect(sut.config[IdpProviders.vhaad].scope).toBe(`openid profile offline_access ${vhResourceId}/feapi`);
    });

    it('should set scope correctly when resource id is not specified', async () => {
        // Arrange
        let configService = new MockConfigService();
        const ejudClientId = configService.ejudSettings.client_id;
        const vhClientId = configService.vhAdSettings.client_id;
        sut = new SecurityConfigSetupService(oidcConfigServiceSpy, configService as any);

        // Act
        sut.setupConfig().subscribe();

        // Assert
        expect(sut.config[IdpProviders.ejud].scope).toBe(`openid profile offline_access api://${ejudClientId}/feapi`);
        expect(sut.config[IdpProviders.vhaad].scope).toBe(`openid profile offline_access api://${vhClientId}/feapi`);
    });
});
