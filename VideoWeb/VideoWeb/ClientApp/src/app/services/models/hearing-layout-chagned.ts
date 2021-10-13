import { HearingLayout } from '../clients/api-client';

export default class HearingLayoutChanged {
    constructor(public conferenceId: string, public newHearingLayout: HearingLayout, public oldHearingLayout?: HearingLayout) {}
}
