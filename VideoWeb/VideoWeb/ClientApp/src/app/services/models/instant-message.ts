import { ChatResponse, IChatResponse } from '../clients/api-client';

export interface IInstantMessage extends IChatResponse {
    conferenceId?: string;
}

export class InstantMessage extends ChatResponse {
    conferenceId: string;

    constructor(data?: IInstantMessage) {
        super(data);
        if (data) {
            for (const property in data) {
                if (data.hasOwnProperty(property)) {
                    (<any>this)[property] = (<any>data)[property];
                }
            }
        }
    }
}
