import { Inject, Injectable, Optional } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from 'src/app/services/clients/api-client';

@Injectable({
    providedIn: 'root'
})
export class BaseApiService {
    constructor(
        @Inject(HttpClient) protected readonly http: HttpClient,
        @Optional() @Inject(API_BASE_URL) protected readonly baseUrl?: string
    ) {
        this.baseUrl = baseUrl !== undefined && baseUrl !== null ? baseUrl : 'https://localhost:5800';
    }
}
