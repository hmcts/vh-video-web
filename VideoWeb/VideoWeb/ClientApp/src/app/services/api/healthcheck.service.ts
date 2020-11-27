import { Injectable } from '@angular/core';
import { ApiClient } from 'src/app/services/clients/api-client';

@Injectable({
    providedIn: 'root'
})
export class HealthCheckService {
    constructor(private apiClient: ApiClient) {}

    async getHealthCheckStatus(): Promise<boolean> {
        const response = await this.apiClient.checkServiceHealth().toPromise();
        return response.video_api_health.successful ? true : false;
    }
}
