export enum HeartbeatMode {
    Heartbeat = 'HEARTBEAT',
    NoHeartbeat = 'NO HEARTBEAT'
}

export const InvalidPexipDisplayNameFormatError = pexipDisplayName => new Error(`Invalid pexip display name format ${pexipDisplayName}`);

/*
<Type>;<Participant Name>;<Participant Id>
<Type>;HEARTBEAT/NO_HEARTBEAT;<Participant Name>;<Participant Id>
*/
export class PexipDisplayNameModel {
    constructor(
        public pexipRole: string,
        public displayName: string,
        public participantOrVmrId: string,
        public heartbeatMode: HeartbeatMode = HeartbeatMode.NoHeartbeat
    ) {}

    static fromString(pexipDisplayName: string): PexipDisplayNameModel {
        const parts = pexipDisplayName.split(';');

        if (parts.length === 3) {
            return new PexipDisplayNameModel(parts[0], parts[1], parts[2], HeartbeatMode.NoHeartbeat);
        } else if (parts.length === 4) {
            return new PexipDisplayNameModel(
                parts[0],
                parts[2],
                parts[3],
                parts[1] === HeartbeatMode.Heartbeat ? HeartbeatMode.Heartbeat : HeartbeatMode.NoHeartbeat
            );
        } else {
            throw InvalidPexipDisplayNameFormatError(pexipDisplayName);
        }
    }

    toString(): string {
        return `${this.pexipRole};${this.heartbeatMode};${this.displayName};${this.participantOrVmrId}`;
    }
}
