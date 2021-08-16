export class JWTBody {
    constructor(body: any) {
        for (const property in body) {
            if (body.hasOwnProperty(property)) {
                (<any>this)[property] = body[property];
            }
        }
    }
}
