import { ClientSettingsResponse, IdpSettingsResponse, Supplier, SupplierConfigurationResponse } from '../../services/clients/api-client';
import { Observable, of } from 'rxjs';

export class MockConfigService {
    ejudSettings = new IdpSettingsResponse({
        client_id: 'ejudClient',
        tenant_id: 'ejudTenant',
        redirect_uri: '/home',
        post_logout_redirect_uri: '/logout'
    });

    dom1Settings = new IdpSettingsResponse({
        client_id: 'dom1Client',
        tenant_id: 'dom1Tenant',
        redirect_uri: '/home',
        post_logout_redirect_uri: '/logout'
    });

    vhAdSettings = new IdpSettingsResponse({
        client_id: 'vhClient',
        tenant_id: 'vhTenant',
        redirect_uri: '/home',
        post_logout_redirect_uri: '/logout'
    });

    clientSettings = new ClientSettingsResponse({
        e_jud_idp_settings: this.ejudSettings,
        vh_idp_settings: this.vhAdSettings,
        dom1_idp_settings: this.dom1Settings,
        event_hub_path: 'evenhub',
        supplier_configurations: [
            new SupplierConfigurationResponse({ supplier: Supplier.Vodafone, join_by_phone_from_date: '2020-09-01' })
        ],
        app_insights_connection_string: 'InstrumentationKey=appinsights'
    });

    getClientSettings(): Observable<ClientSettingsResponse> {
        return of(this.clientSettings);
    }

    loadConfig() {}
}
