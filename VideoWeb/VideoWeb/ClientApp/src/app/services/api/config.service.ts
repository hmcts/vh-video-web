import { Injectable } from '@angular/core';
import { ClientSettingsResponse } from '../clients/api-client';
import { HttpClient, HttpBackend } from '@angular/common/http';
import { SessionStorage } from '../session-storage';

@Injectable()
export class ConfigService {
    clientSettings: ClientSettingsResponse;
    private SETTINGS_KEY = 'vh.client.settings';
    private readonly clientSettingCache: SessionStorage<ClientSettingsResponse>;
    private httpClient: HttpClient;

    constructor(handler: HttpBackend) {
        this.httpClient = new HttpClient(handler);
        this.clientSettingCache = new SessionStorage<ClientSettingsResponse>(this.SETTINGS_KEY);
    }

    async loadConfig() {
        try {
            const result1 = await this.retrieveConfigFromApi();
            this.clientSettings = result1;
            this.clientSettingCache.set(result1);
            return Promise.resolve(result1);
        } catch (err) {
            console.error(`failed to read configuration: ${err}`);
            throw err;
        }
    }

    getClientSettings(): ClientSettingsResponse {
        return this.clientSettingCache.get();
    }

    private retrieveConfigFromApi(): Promise<ClientSettingsResponse> {
        let url = '/config';
        url = url.replace(/[?&]$/, '');
        return this.httpClient.get<ClientSettingsResponse>(url).toPromise();
    }
}
