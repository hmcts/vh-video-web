import { Role } from '../services/clients/api-client';

export const PARTICIPANT_ROLES: Role[] = [Role.Representative, Role.Individual, Role.QuickLinkObserver, Role.QuickLinkParticipant];
export const PARTICIPANT_AND_JUDICIAL_ROLES: Role[] = [
    Role.Representative,
    Role.Individual,
    Role.JudicialOfficeHolder,
    Role.QuickLinkObserver,
    Role.QuickLinkParticipant
];
