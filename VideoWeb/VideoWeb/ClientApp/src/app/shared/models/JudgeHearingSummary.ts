import { HearingSummary } from './hearing-summary';
import { ConferenceForJudgeResponse } from '../../services/clients/api-client';

export class JudgeHearingSummary extends HearingSummary {
    constructor(conference: ConferenceForJudgeResponse) {
        super(conference);
        this.numberOfEndpoints = conference.number_of_endpoints;
    }

    numberOfEndpoints: number;
}
