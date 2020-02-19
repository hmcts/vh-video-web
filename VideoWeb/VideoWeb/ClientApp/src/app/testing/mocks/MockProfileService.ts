import { UserProfileResponse, UserRole } from 'src/app/services/clients/api-client';

export class MockProfileService {
    mockProfile: UserProfileResponse = new UserProfileResponse({
        display_name: 'John Doe',
        first_name: 'John',
        last_name: 'Doe',
        role: UserRole.Individual
    });

    async getUserProfile(): Promise<UserProfileResponse> {
        return this.mockProfile;
    }

    async getProfileByUsername(username: string): Promise<UserProfileResponse> {
        return this.mockProfile;
    }
}
