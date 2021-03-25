import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { ConfigService } from 'src/app/services/api/config.service';
import { Observable } from 'rxjs';
import { ClientSettingsResponse } from 'src/app/services/clients/api-client';

@Injectable()
export class ConfigSettingsResolveService implements Resolve<ClientSettingsResponse> {
    constructor(private configService: ConfigService) {}

    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<ClientSettingsResponse> {
        return this.configService.getClientSettings();
    }
}
