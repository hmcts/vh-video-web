import { ChatResponse, IChatResponse } from '../clients/api-client';

export interface IInstantMessage extends IChatResponse {
    conferenceId?: string;
    isJudge?: boolean;
}

export class InstantMessage extends ChatResponse {
    conferenceId: string;
    isJudge: boolean;

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

export class ExtendMessageInfo {

    constructor(from: string, isJudge: boolean) {
        this.from = from;
        this.isJudge = isJudge;
    }

    from: string;
    isJudge: boolean;
}
