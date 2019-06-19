export class UserMediaDevice {
    label: string;
    deviceId: string;
    kind: string;
    groupId: string;

    constructor(label: string, deviceId: string, kind: string, groupId: string) {
        this.deviceId = deviceId;
        this.label = label;
        this.kind = kind;
        this.groupId = groupId;
    }
}
