import { of } from 'rxjs';
import { ApiClient, HealthCheck, HealthCheckResponse } from 'src/app/services/clients/api-client';
import { HealthCheckService } from './healthcheck.service';

describe('HealthCheckService', () => {
    const apiClient = jasmine.createSpyObj<ApiClient>('ApiClient', ['checkServiceHealth']);
    const service = new HealthCheckService(apiClient);
    let healthCheckResponse: HealthCheckResponse;

    healthCheckResponse = new HealthCheckResponse();
    let videoapiCheck = new HealthCheck();
    videoapiCheck.successful = true;
    healthCheckResponse.video_api_health = videoapiCheck;

    it('should call health check', () => {
        apiClient.checkServiceHealth.and.returnValue(of(healthCheckResponse));
        service.getHealthCheckStatus();
        expect(apiClient.checkServiceHealth).toHaveBeenCalled();
    });
});
