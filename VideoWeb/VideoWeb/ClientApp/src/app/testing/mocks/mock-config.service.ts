import { ClientSettingsResponse, IdpSettingsResponse } from '../../services/clients/api-client';
import { Observable, of } from 'rxjs';

export class MockConfigService {
    ejudSettings = new IdpSettingsResponse({
        client_id: 'ejudClient',
        tenant_id: 'ejudTenant',
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
        event_hub_path: 'evenhub',
        join_by_phone_from_date: '2020-09-01',
        app_insights_instrumentation_key: 'appinsights'
    });

    getClientSettings(): Observable<ClientSettingsResponse> {
        return of(this.clientSettings);
    }

    loadConfig() {}
}
