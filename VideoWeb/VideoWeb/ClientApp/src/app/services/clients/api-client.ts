﻿/* tslint:disable */
//----------------------
// <auto-generated>
//     Generated using the NSwag toolchain v12.0.14.0 (NJsonSchema v9.13.18.0 (Newtonsoft.Json v11.0.0.0)) (http://NSwag.org)
// </auto-generated>
//----------------------
// ReSharper disable InconsistentNaming

import { mergeMap as _observableMergeMap, catchError as _observableCatch } from 'rxjs/operators';
import { Observable, throwError as _observableThrow, of as _observableOf } from 'rxjs';
import { Injectable, Inject, Optional, InjectionToken } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse, HttpResponseBase } from '@angular/common/http';

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL');

@Injectable({
    providedIn: 'root'
})
export class ApiClient {
    private http: HttpClient;
    private baseUrl: string;
    protected jsonParseReviver: ((key: string, value: any) => any) | undefined = undefined;

    constructor(@Inject(HttpClient) http: HttpClient, @Optional() @Inject(API_BASE_URL) baseUrl?: string) {
        this.http = http;
        this.baseUrl = baseUrl ? baseUrl : "https://localhost:5800";
    }

    /**
     * Get conferences for user
     * @return Success
     */
    getConferencesForUser(): Observable<ConferenceForUserResponse[]> {
        let url_ = this.baseUrl + "/conferences";
        url_ = url_.replace(/[?&]$/, "");

        let options_ : any = {
            observe: "response",
            responseType: "blob",
            headers: new HttpHeaders({
                "Accept": "application/json"
            })
        };

        return this.http.request("get", url_, options_).pipe(_observableMergeMap((response_ : any) => {
            return this.processGetConferencesForUser(response_);
        })).pipe(_observableCatch((response_: any) => {
            if (response_ instanceof HttpResponseBase) {
                try {
                    return this.processGetConferencesForUser(<any>response_);
                } catch (e) {
                    return <Observable<ConferenceForUserResponse[]>><any>_observableThrow(e);
                }
            } else
                return <Observable<ConferenceForUserResponse[]>><any>_observableThrow(response_);
        }));
    }

    protected processGetConferencesForUser(response: HttpResponseBase): Observable<ConferenceForUserResponse[]> {
        const status = response.status;
        const responseBlob = 
            response instanceof HttpResponse ? response.body : 
            (<any>response).error instanceof Blob ? (<any>response).error : undefined;

        let _headers: any = {}; if (response.headers) { for (let key of response.headers.keys()) { _headers[key] = response.headers.get(key); }};
        if (status === 200) {
            return blobToText(responseBlob).pipe(_observableMergeMap(_responseText => {
            let result200: any = null;
            let resultData200 = _responseText === "" ? null : JSON.parse(_responseText, this.jsonParseReviver);
            if (resultData200 && resultData200.constructor === Array) {
                result200 = [] as any;
                for (let item of resultData200)
                    result200!.push(ConferenceForUserResponse.fromJS(item));
            }
            return _observableOf(result200);
            }));
        } else if (status === 400) {
            return blobToText(responseBlob).pipe(_observableMergeMap(_responseText => {
            let result400: any = null;
            let resultData400 = _responseText === "" ? null : JSON.parse(_responseText, this.jsonParseReviver);
            result400 = resultData400 ? ProblemDetails.fromJS(resultData400) : new ProblemDetails();
            return throwException("A server error occurred.", status, _responseText, _headers, result400);
            }));
        } else if (status === 401) {
            return blobToText(responseBlob).pipe(_observableMergeMap(_responseText => {
            return throwException("A server error occurred.", status, _responseText, _headers);
            }));
        } else if (status !== 200 && status !== 204) {
            return blobToText(responseBlob).pipe(_observableMergeMap(_responseText => {
            return throwException("An unexpected server error occurred.", status, _responseText, _headers);
            }));
        }
        return _observableOf<ConferenceForUserResponse[]>(<any>null);
    }

    /**
     * Get the details of a conference by id
     * @param conferenceId The unique id of the conference
     * @return Success
     */
    getConferenceById(conferenceId: string): Observable<ConferenceResponse> {
        let url_ = this.baseUrl + "/conferences/{conferenceId}";
        if (conferenceId === undefined || conferenceId === null)
            throw new Error("The parameter 'conferenceId' must be defined.");
        url_ = url_.replace("{conferenceId}", encodeURIComponent("" + conferenceId)); 
        url_ = url_.replace(/[?&]$/, "");

        let options_ : any = {
            observe: "response",
            responseType: "blob",
            headers: new HttpHeaders({
                "Accept": "application/json"
            })
        };

        return this.http.request("get", url_, options_).pipe(_observableMergeMap((response_ : any) => {
            return this.processGetConferenceById(response_);
        })).pipe(_observableCatch((response_: any) => {
            if (response_ instanceof HttpResponseBase) {
                try {
                    return this.processGetConferenceById(<any>response_);
                } catch (e) {
                    return <Observable<ConferenceResponse>><any>_observableThrow(e);
                }
            } else
                return <Observable<ConferenceResponse>><any>_observableThrow(response_);
        }));
    }

    protected processGetConferenceById(response: HttpResponseBase): Observable<ConferenceResponse> {
        const status = response.status;
        const responseBlob = 
            response instanceof HttpResponse ? response.body : 
            (<any>response).error instanceof Blob ? (<any>response).error : undefined;

        let _headers: any = {}; if (response.headers) { for (let key of response.headers.keys()) { _headers[key] = response.headers.get(key); }};
        if (status === 200) {
            return blobToText(responseBlob).pipe(_observableMergeMap(_responseText => {
            let result200: any = null;
            let resultData200 = _responseText === "" ? null : JSON.parse(_responseText, this.jsonParseReviver);
            result200 = resultData200 ? ConferenceResponse.fromJS(resultData200) : new ConferenceResponse();
            return _observableOf(result200);
            }));
        } else if (status === 400) {
            return blobToText(responseBlob).pipe(_observableMergeMap(_responseText => {
            let result400: any = null;
            let resultData400 = _responseText === "" ? null : JSON.parse(_responseText, this.jsonParseReviver);
            result400 = resultData400 ? ProblemDetails.fromJS(resultData400) : new ProblemDetails();
            return throwException("A server error occurred.", status, _responseText, _headers, result400);
            }));
        } else if (status === 404) {
            return blobToText(responseBlob).pipe(_observableMergeMap(_responseText => {
            let result404: any = null;
            let resultData404 = _responseText === "" ? null : JSON.parse(_responseText, this.jsonParseReviver);
            result404 = resultData404 ? ProblemDetails.fromJS(resultData404) : new ProblemDetails();
            return throwException("A server error occurred.", status, _responseText, _headers, result404);
            }));
        } else if (status === 401) {
            return blobToText(responseBlob).pipe(_observableMergeMap(_responseText => {
            return throwException("A server error occurred.", status, _responseText, _headers);
            }));
        } else if (status !== 200 && status !== 204) {
            return blobToText(responseBlob).pipe(_observableMergeMap(_responseText => {
            return throwException("An unexpected server error occurred.", status, _responseText, _headers);
            }));
        }
        return _observableOf<ConferenceResponse>(<any>null);
    }

    /**
     * GetClientConfigurationSettings the configuration settings for client
     * @return Success
     */
    getClientConfigurationSettings(): Observable<ClientSettingsResponse> {
        let url_ = this.baseUrl + "/config";
        url_ = url_.replace(/[?&]$/, "");

        let options_ : any = {
            observe: "response",
            responseType: "blob",
            headers: new HttpHeaders({
                "Accept": "application/json"
            })
        };

        return this.http.request("get", url_, options_).pipe(_observableMergeMap((response_ : any) => {
            return this.processGetClientConfigurationSettings(response_);
        })).pipe(_observableCatch((response_: any) => {
            if (response_ instanceof HttpResponseBase) {
                try {
                    return this.processGetClientConfigurationSettings(<any>response_);
                } catch (e) {
                    return <Observable<ClientSettingsResponse>><any>_observableThrow(e);
                }
            } else
                return <Observable<ClientSettingsResponse>><any>_observableThrow(response_);
        }));
    }

    protected processGetClientConfigurationSettings(response: HttpResponseBase): Observable<ClientSettingsResponse> {
        const status = response.status;
        const responseBlob = 
            response instanceof HttpResponse ? response.body : 
            (<any>response).error instanceof Blob ? (<any>response).error : undefined;

        let _headers: any = {}; if (response.headers) { for (let key of response.headers.keys()) { _headers[key] = response.headers.get(key); }};
        if (status === 200) {
            return blobToText(responseBlob).pipe(_observableMergeMap(_responseText => {
            let result200: any = null;
            let resultData200 = _responseText === "" ? null : JSON.parse(_responseText, this.jsonParseReviver);
            result200 = resultData200 ? ClientSettingsResponse.fromJS(resultData200) : new ClientSettingsResponse();
            return _observableOf(result200);
            }));
        } else if (status !== 200 && status !== 204) {
            return blobToText(responseBlob).pipe(_observableMergeMap(_responseText => {
            return throwException("An unexpected server error occurred.", status, _responseText, _headers);
            }));
        }
        return _observableOf<ClientSettingsResponse>(<any>null);
    }

    /**
     * @param request (optional) 
     * @return Success
     */
    sendEvent(request: ConferenceEventRequest | null | undefined): Observable<void> {
        let url_ = this.baseUrl + "/api/events";
        url_ = url_.replace(/[?&]$/, "");

        const content_ = JSON.stringify(request);

        let options_ : any = {
            body: content_,
            observe: "response",
            responseType: "blob",
            headers: new HttpHeaders({
                "Content-Type": "application/json", 
            })
        };

        return this.http.request("post", url_, options_).pipe(_observableMergeMap((response_ : any) => {
            return this.processSendEvent(response_);
        })).pipe(_observableCatch((response_: any) => {
            if (response_ instanceof HttpResponseBase) {
                try {
                    return this.processSendEvent(<any>response_);
                } catch (e) {
                    return <Observable<void>><any>_observableThrow(e);
                }
            } else
                return <Observable<void>><any>_observableThrow(response_);
        }));
    }

    protected processSendEvent(response: HttpResponseBase): Observable<void> {
        const status = response.status;
        const responseBlob = 
            response instanceof HttpResponse ? response.body : 
            (<any>response).error instanceof Blob ? (<any>response).error : undefined;

        let _headers: any = {}; if (response.headers) { for (let key of response.headers.keys()) { _headers[key] = response.headers.get(key); }};
        if (status === 200) {
            return blobToText(responseBlob).pipe(_observableMergeMap(_responseText => {
            return _observableOf<void>(<any>null);
            }));
        } else if (status === 400) {
            return blobToText(responseBlob).pipe(_observableMergeMap(_responseText => {
            let result400: any = null;
            let resultData400 = _responseText === "" ? null : JSON.parse(_responseText, this.jsonParseReviver);
            result400 = resultData400 !== undefined ? resultData400 : <any>null;
            return throwException("A server error occurred.", status, _responseText, _headers, result400);
            }));
        } else if (status === 401) {
            return blobToText(responseBlob).pipe(_observableMergeMap(_responseText => {
            return throwException("A server error occurred.", status, _responseText, _headers);
            }));
        } else if (status !== 200 && status !== 204) {
            return blobToText(responseBlob).pipe(_observableMergeMap(_responseText => {
            return throwException("An unexpected server error occurred.", status, _responseText, _headers);
            }));
        }
        return _observableOf<void>(<any>null);
    }
}

export class ConferenceForUserResponse implements IConferenceForUserResponse {
    id?: string | undefined;
    scheduled_date_time?: Date | undefined;
    case_type?: string | undefined;
    case_number?: string | undefined;
    case_name?: string | undefined;
    scheduled_duration?: number | undefined;
    status?: ConferenceState | undefined;
    participants?: ParticipantSummaryResponse[] | undefined;
    no_of_participants_none?: number | undefined;
    no_of_participants_not_signed_in?: number | undefined;
    no_of_participants_unable_to_join?: number | undefined;
    no_of_participants_joining?: number | undefined;
    no_of_participants_available?: number | undefined;
    no_of_participants_in_hearing?: number | undefined;
    no_of_participants_in_consultation?: number | undefined;
    no_of_participants_disconnected?: number | undefined;

    constructor(data?: IConferenceForUserResponse) {
        if (data) {
            for (var property in data) {
                if (data.hasOwnProperty(property))
                    (<any>this)[property] = (<any>data)[property];
            }
        }
    }

    init(data?: any) {
        if (data) {
            this.id = data["id"];
            this.scheduled_date_time = data["scheduled_date_time"] ? new Date(data["scheduled_date_time"].toString()) : <any>undefined;
            this.case_type = data["case_type"];
            this.case_number = data["case_number"];
            this.case_name = data["case_name"];
            this.scheduled_duration = data["scheduled_duration"];
            this.status = data["status"];
            if (data["participants"] && data["participants"].constructor === Array) {
                this.participants = [] as any;
                for (let item of data["participants"])
                    this.participants!.push(ParticipantSummaryResponse.fromJS(item));
            }
            this.no_of_participants_none = data["no_of_participants_none"];
            this.no_of_participants_not_signed_in = data["no_of_participants_not_signed_in"];
            this.no_of_participants_unable_to_join = data["no_of_participants_unable_to_join"];
            this.no_of_participants_joining = data["no_of_participants_joining"];
            this.no_of_participants_available = data["no_of_participants_available"];
            this.no_of_participants_in_hearing = data["no_of_participants_in_hearing"];
            this.no_of_participants_in_consultation = data["no_of_participants_in_consultation"];
            this.no_of_participants_disconnected = data["no_of_participants_disconnected"];
        }
    }

    static fromJS(data: any): ConferenceForUserResponse {
        data = typeof data === 'object' ? data : {};
        let result = new ConferenceForUserResponse();
        result.init(data);
        return result;
    }

    toJSON(data?: any) {
        data = typeof data === 'object' ? data : {};
        data["id"] = this.id;
        data["scheduled_date_time"] = this.scheduled_date_time ? this.scheduled_date_time.toISOString() : <any>undefined;
        data["case_type"] = this.case_type;
        data["case_number"] = this.case_number;
        data["case_name"] = this.case_name;
        data["scheduled_duration"] = this.scheduled_duration;
        data["status"] = this.status;
        if (this.participants && this.participants.constructor === Array) {
            data["participants"] = [];
            for (let item of this.participants)
                data["participants"].push(item.toJSON());
        }
        data["no_of_participants_none"] = this.no_of_participants_none;
        data["no_of_participants_not_signed_in"] = this.no_of_participants_not_signed_in;
        data["no_of_participants_unable_to_join"] = this.no_of_participants_unable_to_join;
        data["no_of_participants_joining"] = this.no_of_participants_joining;
        data["no_of_participants_available"] = this.no_of_participants_available;
        data["no_of_participants_in_hearing"] = this.no_of_participants_in_hearing;
        data["no_of_participants_in_consultation"] = this.no_of_participants_in_consultation;
        data["no_of_participants_disconnected"] = this.no_of_participants_disconnected;
        return data; 
    }
}

export interface IConferenceForUserResponse {
    id?: string | undefined;
    scheduled_date_time?: Date | undefined;
    case_type?: string | undefined;
    case_number?: string | undefined;
    case_name?: string | undefined;
    scheduled_duration?: number | undefined;
    status?: ConferenceState | undefined;
    participants?: ParticipantSummaryResponse[] | undefined;
    no_of_participants_none?: number | undefined;
    no_of_participants_not_signed_in?: number | undefined;
    no_of_participants_unable_to_join?: number | undefined;
    no_of_participants_joining?: number | undefined;
    no_of_participants_available?: number | undefined;
    no_of_participants_in_hearing?: number | undefined;
    no_of_participants_in_consultation?: number | undefined;
    no_of_participants_disconnected?: number | undefined;
}

export enum ConferenceState {
    None = "None", 
    InSession = "InSession", 
    Paused = "Paused", 
    Suspended = "Suspended", 
    Closed = "Closed", 
}

export class ParticipantSummaryResponse implements IParticipantSummaryResponse {
    participant_id?: string | undefined;
    username?: string | undefined;
    status?: ParticipantState | undefined;
    role?: string | undefined;

    constructor(data?: IParticipantSummaryResponse) {
        if (data) {
            for (var property in data) {
                if (data.hasOwnProperty(property))
                    (<any>this)[property] = (<any>data)[property];
            }
        }
    }

    init(data?: any) {
        if (data) {
            this.participant_id = data["participant_id"];
            this.username = data["username"];
            this.status = data["status"];
            this.role = data["role"];
        }
    }

    static fromJS(data: any): ParticipantSummaryResponse {
        data = typeof data === 'object' ? data : {};
        let result = new ParticipantSummaryResponse();
        result.init(data);
        return result;
    }

    toJSON(data?: any) {
        data = typeof data === 'object' ? data : {};
        data["participant_id"] = this.participant_id;
        data["username"] = this.username;
        data["status"] = this.status;
        data["role"] = this.role;
        return data; 
    }
}

export interface IParticipantSummaryResponse {
    participant_id?: string | undefined;
    username?: string | undefined;
    status?: ParticipantState | undefined;
    role?: string | undefined;
}

export enum ParticipantState {
    None = "None", 
    NotSignedIn = "NotSignedIn", 
    UnableToJoin = "UnableToJoin", 
    Joining = "Joining", 
    Available = "Available", 
    InHearing = "InHearing", 
    InConsultation = "InConsultation", 
    Disconnected = "Disconnected", 
}

export class ProblemDetails implements IProblemDetails {
    type?: string | undefined;
    title?: string | undefined;
    status?: number | undefined;
    detail?: string | undefined;
    instance?: string | undefined;

    constructor(data?: IProblemDetails) {
        if (data) {
            for (var property in data) {
                if (data.hasOwnProperty(property))
                    (<any>this)[property] = (<any>data)[property];
            }
        }
    }

    init(data?: any) {
        if (data) {
            this.type = data["type"];
            this.title = data["title"];
            this.status = data["status"];
            this.detail = data["detail"];
            this.instance = data["instance"];
        }
    }

    static fromJS(data: any): ProblemDetails {
        data = typeof data === 'object' ? data : {};
        let result = new ProblemDetails();
        result.init(data);
        return result;
    }

    toJSON(data?: any) {
        data = typeof data === 'object' ? data : {};
        data["type"] = this.type;
        data["title"] = this.title;
        data["status"] = this.status;
        data["detail"] = this.detail;
        data["instance"] = this.instance;
        return data; 
    }
}

export interface IProblemDetails {
    type?: string | undefined;
    title?: string | undefined;
    status?: number | undefined;
    detail?: string | undefined;
    instance?: string | undefined;
}

export class ConferenceResponse implements IConferenceResponse {
    id?: string | undefined;
    scheduled_date_time?: Date | undefined;
    scheduled_duration?: number | undefined;
    case_type?: string | undefined;
    case_number?: string | undefined;
    case_name?: string | undefined;
    status?: ConferenceStatus | undefined;
    participants?: ParticipantResponse[] | undefined;

    constructor(data?: IConferenceResponse) {
        if (data) {
            for (var property in data) {
                if (data.hasOwnProperty(property))
                    (<any>this)[property] = (<any>data)[property];
            }
        }
    }

    init(data?: any) {
        if (data) {
            this.id = data["id"];
            this.scheduled_date_time = data["scheduled_date_time"] ? new Date(data["scheduled_date_time"].toString()) : <any>undefined;
            this.scheduled_duration = data["scheduled_duration"];
            this.case_type = data["case_type"];
            this.case_number = data["case_number"];
            this.case_name = data["case_name"];
            this.status = data["status"];
            if (data["participants"] && data["participants"].constructor === Array) {
                this.participants = [] as any;
                for (let item of data["participants"])
                    this.participants!.push(ParticipantResponse.fromJS(item));
            }
        }
    }

    static fromJS(data: any): ConferenceResponse {
        data = typeof data === 'object' ? data : {};
        let result = new ConferenceResponse();
        result.init(data);
        return result;
    }

    toJSON(data?: any) {
        data = typeof data === 'object' ? data : {};
        data["id"] = this.id;
        data["scheduled_date_time"] = this.scheduled_date_time ? this.scheduled_date_time.toISOString() : <any>undefined;
        data["scheduled_duration"] = this.scheduled_duration;
        data["case_type"] = this.case_type;
        data["case_number"] = this.case_number;
        data["case_name"] = this.case_name;
        data["status"] = this.status;
        if (this.participants && this.participants.constructor === Array) {
            data["participants"] = [];
            for (let item of this.participants)
                data["participants"].push(item.toJSON());
        }
        return data; 
    }
}

export interface IConferenceResponse {
    id?: string | undefined;
    scheduled_date_time?: Date | undefined;
    scheduled_duration?: number | undefined;
    case_type?: string | undefined;
    case_number?: string | undefined;
    case_name?: string | undefined;
    status?: ConferenceStatus | undefined;
    participants?: ParticipantResponse[] | undefined;
}

export enum ConferenceStatus {
    NotStarted = "NotStarted", 
    InSession = "InSession", 
    Paused = "Paused", 
    Suspended = "Suspended", 
    Closed = "Closed", 
}

export class ParticipantResponse implements IParticipantResponse {
    id?: string | undefined;
    name?: string | undefined;
    username?: string | undefined;
    role?: UserRole | undefined;
    status?: ParticipantStatus | undefined;

    constructor(data?: IParticipantResponse) {
        if (data) {
            for (var property in data) {
                if (data.hasOwnProperty(property))
                    (<any>this)[property] = (<any>data)[property];
            }
        }
    }

    init(data?: any) {
        if (data) {
            this.id = data["id"];
            this.name = data["name"];
            this.username = data["username"];
            this.role = data["role"];
            this.status = data["status"];
        }
    }

    static fromJS(data: any): ParticipantResponse {
        data = typeof data === 'object' ? data : {};
        let result = new ParticipantResponse();
        result.init(data);
        return result;
    }

    toJSON(data?: any) {
        data = typeof data === 'object' ? data : {};
        data["id"] = this.id;
        data["name"] = this.name;
        data["username"] = this.username;
        data["role"] = this.role;
        data["status"] = this.status;
        return data; 
    }
}

export interface IParticipantResponse {
    id?: string | undefined;
    name?: string | undefined;
    username?: string | undefined;
    role?: UserRole | undefined;
    status?: ParticipantStatus | undefined;
}

export enum UserRole {
    None = "None", 
    CaseAdmin = "CaseAdmin", 
    VideoHearingsOfficer = "VideoHearingsOfficer", 
    HearingFacilitationSupport = "HearingFacilitationSupport", 
    Judge = "Judge", 
    Individual = "Individual", 
    Representative = "Representative", 
}

export enum ParticipantStatus {
    None = "None", 
    NotSignedIn = "NotSignedIn", 
    UnableToJoin = "UnableToJoin", 
    Joining = "Joining", 
    Available = "Available", 
    InHearing = "InHearing", 
    InConsultation = "InConsultation", 
    Disconnected = "Disconnected", 
}

export class ClientSettingsResponse implements IClientSettingsResponse {
    tenant_id?: string | undefined;
    client_id?: string | undefined;
    redirect_uri?: string | undefined;
    post_logout_redirect_uri?: string | undefined;

    constructor(data?: IClientSettingsResponse) {
        if (data) {
            for (var property in data) {
                if (data.hasOwnProperty(property))
                    (<any>this)[property] = (<any>data)[property];
            }
        }
    }

    init(data?: any) {
        if (data) {
            this.tenant_id = data["tenant_id"];
            this.client_id = data["client_id"];
            this.redirect_uri = data["redirect_uri"];
            this.post_logout_redirect_uri = data["post_logout_redirect_uri"];
        }
    }

    static fromJS(data: any): ClientSettingsResponse {
        data = typeof data === 'object' ? data : {};
        let result = new ClientSettingsResponse();
        result.init(data);
        return result;
    }

    toJSON(data?: any) {
        data = typeof data === 'object' ? data : {};
        data["tenant_id"] = this.tenant_id;
        data["client_id"] = this.client_id;
        data["redirect_uri"] = this.redirect_uri;
        data["post_logout_redirect_uri"] = this.post_logout_redirect_uri;
        return data; 
    }
}

export interface IClientSettingsResponse {
    tenant_id?: string | undefined;
    client_id?: string | undefined;
    redirect_uri?: string | undefined;
    post_logout_redirect_uri?: string | undefined;
}

export class ConferenceEventRequest implements IConferenceEventRequest {
    event_id?: string | undefined;
    event_type?: EventType | undefined;
    time_stamp_utc?: Date | undefined;
    conference_id?: string | undefined;
    participant_id?: string | undefined;
    transfer_from?: RoomType | undefined;
    transfer_to?: RoomType | undefined;
    reason?: string | undefined;

    constructor(data?: IConferenceEventRequest) {
        if (data) {
            for (var property in data) {
                if (data.hasOwnProperty(property))
                    (<any>this)[property] = (<any>data)[property];
            }
        }
    }

    init(data?: any) {
        if (data) {
            this.event_id = data["event_id"];
            this.event_type = data["event_type"];
            this.time_stamp_utc = data["time_stamp_utc"] ? new Date(data["time_stamp_utc"].toString()) : <any>undefined;
            this.conference_id = data["conference_id"];
            this.participant_id = data["participant_id"];
            this.transfer_from = data["transfer_from"];
            this.transfer_to = data["transfer_to"];
            this.reason = data["reason"];
        }
    }

    static fromJS(data: any): ConferenceEventRequest {
        data = typeof data === 'object' ? data : {};
        let result = new ConferenceEventRequest();
        result.init(data);
        return result;
    }

    toJSON(data?: any) {
        data = typeof data === 'object' ? data : {};
        data["event_id"] = this.event_id;
        data["event_type"] = this.event_type;
        data["time_stamp_utc"] = this.time_stamp_utc ? this.time_stamp_utc.toISOString() : <any>undefined;
        data["conference_id"] = this.conference_id;
        data["participant_id"] = this.participant_id;
        data["transfer_from"] = this.transfer_from;
        data["transfer_to"] = this.transfer_to;
        data["reason"] = this.reason;
        return data; 
    }
}

export interface IConferenceEventRequest {
    event_id?: string | undefined;
    event_type?: EventType | undefined;
    time_stamp_utc?: Date | undefined;
    conference_id?: string | undefined;
    participant_id?: string | undefined;
    transfer_from?: RoomType | undefined;
    transfer_to?: RoomType | undefined;
    reason?: string | undefined;
}

export enum EventType {
    None = "None", 
    Joined = "Joined", 
    Disconnected = "Disconnected", 
    Transfer = "Transfer", 
    Help = "Help", 
    Pause = "Pause", 
    Close = "Close", 
    Leave = "Leave", 
    Consultation = "Consultation", 
    JudgeAvailable = "JudgeAvailable", 
}

export enum RoomType {
    WaitingRoom = "WaitingRoom", 
    HearingRoom = "HearingRoom", 
    ConsultationRoom1 = "ConsultationRoom1", 
    ConsultationRoom2 = "ConsultationRoom2", 
    AdminRoom = "AdminRoom", 
}

export class SwaggerException extends Error {
    message: string;
    status: number; 
    response: string; 
    headers: { [key: string]: any; };
    result: any; 

    constructor(message: string, status: number, response: string, headers: { [key: string]: any; }, result: any) {
        super();

        this.message = message;
        this.status = status;
        this.response = response;
        this.headers = headers;
        this.result = result;
    }

    protected isSwaggerException = true;

    static isSwaggerException(obj: any): obj is SwaggerException {
        return obj.isSwaggerException === true;
    }
}

function throwException(message: string, status: number, response: string, headers: { [key: string]: any; }, result?: any): Observable<any> {
    if(result !== null && result !== undefined)
        return _observableThrow(result);
    else
        return _observableThrow(new SwaggerException(message, status, response, headers, null));
}

function blobToText(blob: any): Observable<string> {
    return new Observable<string>((observer: any) => {
        if (!blob) {
            observer.next("");
            observer.complete();
        } else {
            let reader = new FileReader(); 
            reader.onload = event => { 
                observer.next((<any>event.target).result);
                observer.complete();
            };
            reader.readAsText(blob); 
        }
    });
}