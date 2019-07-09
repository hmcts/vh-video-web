import { ProfileService } from 'src/app/services/api/profile.service';
import { UserProfileResponse, UserRole } from 'src/app/services/clients/api-client';

export class MockProfileService extends ProfileService {

    mockProfile: any = new UserProfileResponse({
        display_name: 'John Doe',
        first_name: 'John',
        last_name: 'Doe',
        role: UserRole.Individual
    });

    async getUserProfile(): Promise<UserProfileResponse> {
        return this.mockProfile;
    }
}
