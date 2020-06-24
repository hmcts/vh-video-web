import { Injectable } from '@angular/core';
import { ApiClient, UserProfileResponse } from '../clients/api-client';

@Injectable({
    providedIn: 'root'
})
export class ProfileService {
    profile: UserProfileResponse;
    profiles: Record<string, UserProfileResponse> = {};

    constructor(private apiClient: ApiClient) {}

    async getUserProfile(): Promise<UserProfileResponse> {
        if (!this.profile) {
            this.profile = await this.apiClient.getUserProfile().toPromise();
        }
        return this.profile;
    }

    async getProfileByUsername(username: string): Promise<UserProfileResponse> {
        const profile = await this.apiClient.getProfileByUsername(username).toPromise();
        this.profiles[username] = profile;
        return profile;
    }

    checkCacheForProfileByUsername(username: string): UserProfileResponse {
        return this.profiles[username];
    }

    clearUserProfile(): void {
        this.profile = null;
    }
}
