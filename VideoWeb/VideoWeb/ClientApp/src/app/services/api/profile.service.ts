import { Injectable } from '@angular/core';
import { ApiClient, UserProfileResponse } from '../clients/api-client';

@Injectable({
    providedIn: 'root'
})
export class ProfileService {
    profile: UserProfileResponse;

    constructor(private apiClient: ApiClient) {}

    async getUserProfile(): Promise<UserProfileResponse> {
        if (!this.profile) {
            this.profile = await this.apiClient.getUserProfile().toPromise();
        }
        return this.profile;
    }

    async getProfileByUsername(username: string): Promise<UserProfileResponse> {
        return await this.apiClient.getProfileByUsername(username).toPromise();
    }

    clearUserProfile(): void {
        this.profile = null;
    }
}
