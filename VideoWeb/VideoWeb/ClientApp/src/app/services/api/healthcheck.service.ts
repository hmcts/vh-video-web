import { Injectable } from '@angular/core';
import { ApiClient, HealthCheckResponse } from 'src/app/services/clients/api-client';

@Injectable({
    providedIn: 'root'
})
export class HealthCheckService {
    constructor(private apiClient: ApiClient) {}

    async getHealthCheckStatus(): Promise<HealthCheckResponse> {
        return await this.apiClient.checkServiceHealth().toPromise();
    }
}
