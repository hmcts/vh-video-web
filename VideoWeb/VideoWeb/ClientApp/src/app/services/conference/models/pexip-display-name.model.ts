export class PexipDisplayNameModel {
    constructor(public pexipRole: string, public displayName: string, public participantOrVmrId: string) {}

    static fromString(pexipDisplayName: string): PexipDisplayNameModel {
        const parts = pexipDisplayName.split(';');
        return new PexipDisplayNameModel(parts[0], parts[1], parts[2]);
    }

    toString(): string {
        return `${this.pexipRole};${this.displayName};${this.participantOrVmrId}`;
    }
}
