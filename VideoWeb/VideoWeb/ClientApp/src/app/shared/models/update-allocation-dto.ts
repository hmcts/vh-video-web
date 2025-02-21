import { ConferenceResponse } from 'src/app/services/clients/api-client';

export interface UpdatedAllocation {
    conference_id: string;
    conference?: ConferenceResponse;
    scheduled_date_time: Date;
    case_name: string;
    judge_display_name: string;
    allocated_to_cso_username: string;
    allocated_to_cso_display_name: string;
    allocated_to_cso_id: string;
}
