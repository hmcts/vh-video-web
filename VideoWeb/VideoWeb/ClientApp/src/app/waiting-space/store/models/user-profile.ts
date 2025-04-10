import { Role } from 'src/app/services/clients/api-client';

export interface UserProfile {
    roles: Role[];
    firstName?: string;
    lastName?: string;
    displayName?: string;
    username?: string;
    name?: string;
}
