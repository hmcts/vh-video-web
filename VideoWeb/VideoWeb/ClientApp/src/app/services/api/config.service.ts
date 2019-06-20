import { Injectable } from '@angular/core';
import { ClientSettingsResponse } from '../clients/api-client';
import { Observable, of } from 'rxjs';
import { HttpClient, HttpBackend } from '@angular/common/http';

@Injectable()
export class ConfigService {
    clientSettings: ClientSettingsResponse;
    private settingsSessionKey = 'clientSettings';
    private httpClient: HttpClient;

    constructor(handler: HttpBackend) {
        this.httpClient = new HttpClient(handler);
    }

    getClientSettings(): Observable<ClientSettingsResponse> {
        const settings = sessionStorage.getItem(this.settingsSessionKey);
        if (!settings) {
            return this.retrieveConfigFromApi();
        } else {
            return of(JSON.parse(settings));
        }
    }

    loadConfig() {
        return new Promise((resolve, reject) => {
            this.getClientSettings().subscribe((data: ClientSettingsResponse) => {
                this.clientSettings = data;
                sessionStorage.setItem(this.settingsSessionKey, JSON.stringify(data));
                resolve(true);
            }, err => resolve(err));
        });
    }

    private retrieveConfigFromApi(): Observable<ClientSettingsResponse> {
        let url = '/config';
        url = url.replace(/[?&]$/, '');
        return this.httpClient.get<ClientSettingsResponse>(url);
    }
}
