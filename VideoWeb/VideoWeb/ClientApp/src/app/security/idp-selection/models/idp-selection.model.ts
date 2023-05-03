import { IdpProviders } from '../../idp-providers';

export class IdpSelector {
    private _idps: Record<string, IdpDto> = {};
    addIdp(idpName: IdpProviders, url: string) {
        this._idps[idpName] = new IdpDto(idpName, url);
    }
    removeIdp(idpName: IdpProviders) {
        if (!!this._idps[idpName]) {
            delete this._idps[idpName];
        }
    }
    getProviderLogin(idpName: IdpProviders): string {
        return this._idps[idpName].url;
    }
    getProviderNames(): string[] {
        return Object.keys(this._idps).reverse();
    }
    hasProvider(idpName: IdpProviders): boolean {
        return !!this._idps[idpName];
    }
}

export class IdpDto {
    constructor(public idpName: IdpProviders, public url: string) {}
}
