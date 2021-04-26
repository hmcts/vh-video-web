import { OidcConfigService } from 'angular-auth-oidc-client';
import { MockConfigService } from '../testing/mocks/mock-config.service';
import { OidcConfigSetupService } from './oidc-config-setup.service';

describe('OidcConfigSetupService', () => {
    let sut: OidcConfigSetupService;
    let oidcConfigServiceSpy: jasmine.SpyObj<OidcConfigService>;
    const configService = new MockConfigService();

    beforeEach(() => {
        window.sessionStorage.clear();
        oidcConfigServiceSpy = jasmine.createSpyObj<OidcConfigService>('OidcConfigService', ['withConfig']);
        sut = new OidcConfigSetupService(oidcConfigServiceSpy, configService as any);
    });

    it('should get default idp if not set', async () => {
        // Arrange

        // Act
        const result = sut.getIdp();

        // Assert
        expect(result).toBe('vhaad');
    });

    it('should set store when setting idp', async () => {
        // Arrange
        const testProvider = 'ejud';

        // Act
        sut.setIdp(testProvider);

        // Assert
        const result = sut.getIdp();
        expect(result).toBe(testProvider);
    });

    it('should set oidc config on setIdp', async () => {
        // Arrange
        const testProvider = 'ejud';

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
});
