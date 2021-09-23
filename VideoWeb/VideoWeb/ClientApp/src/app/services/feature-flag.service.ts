import { Injectable } from '@angular/core';
import { ApiClient } from './clients/api-client';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class FeatureFlagService {
    constructor(private apiClient: ApiClient) {}

    getFeatureFlagByName(featureName: string): Observable<boolean> {
        return this.apiClient.getFeatureFlag(featureName);
    }
}
