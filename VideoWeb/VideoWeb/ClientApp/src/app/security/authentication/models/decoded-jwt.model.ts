export class JWTHeader {
    private alg: string;
    private typ: string;

    constructor(body: any) {
        for (const property in body) {
            if (body.hasOwnProperty(property)) { (<any>this)[property] = (<any>body)[property]; }
        }
    }

    get algorithm() {
        return this.alg;
    }

    get type() {
        return this.typ;
    }
}

export class JWTBody {
    constructor(body: any) {
        for (const property in body) {
            if (body.hasOwnProperty(property)) { (<any>this)[property] = (<any>body)[property]; }
        }
    }
}

export class DecodedJWT<TBody extends JWTBody> {
    header: JWTHeader;
    body: TBody;

    parseBase64UrlEncoding(base64Url: string): any {
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map(function (c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                })
                .join('')
        );

        return JSON.parse(jsonPayload);
    }

    constructor(jwt: string, bodyBuilder: (body: any) => TBody) {
        const jwtParts = jwt.split('.');
        this.header = new JWTHeader(this.parseBase64UrlEncoding(jwtParts[0]));
        this.body = bodyBuilder(this.parseBase64UrlEncoding(jwtParts[1]));
    }
}
