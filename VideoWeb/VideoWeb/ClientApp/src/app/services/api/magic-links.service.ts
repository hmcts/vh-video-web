import { Inject, Injectable, Optional } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL, Role } from 'src/app/services/clients/api-client';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { map, tap } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class MagicLinksService extends BaseApiService {
    constructor(@Inject(HttpClient) http: HttpClient, @Optional() @Inject(API_BASE_URL) baseUrl?: string) {
        super(http, baseUrl);
    }

    getMagicLinkParticipantRoles(): Observable<Role[]> {
        const url = `${this.baseUrl}/quickjoin/GetMagicLinkParticipantRoles`;
        return this.http.get<Role[]>(url);
    }

    validateMagicLink(hearingId: string): Observable<boolean> {
        const url = `${this.baseUrl}/quickjoin/validateMagicLink/${hearingId}`;
        return this.http.get<boolean>(url);
    }

    joinHearing(hearingId: string, name: string, role: Role): Observable<string> {
        const url = `${this.baseUrl}/quickjoin/join/${hearingId}`;
        const body = {
            name: name,
            role: role
        };

        return this.http.post<object>(url, body).pipe(
            tap((response: { redirectUrl: string; jwt: {} }) => {}),
            map((response: { redirectUrl: string; jwt: {} }) => response.redirectUrl)
        );
    }
}
