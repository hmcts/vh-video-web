import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class LocationService {
    getCurrentUrl(): string {
        return window.location.href;
    }

    getCurrentPathName(): string {
        return window.location.pathname;
    }
}
