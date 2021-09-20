import { PanelModel } from 'src/app/waiting-space/models/panel-model-base';

export class ToggleMuteParticipantEvent {
    constructor(public participant: PanelModel) {}
}

export class ToggleSpotlightParticipantEvent {
    constructor(public participant: PanelModel) {}
}

export class LowerParticipantHandEvent {
    constructor(public participant: PanelModel) {}
}

export class CallParticipantIntoHearingEvent {
    constructor(public participant: PanelModel) {}
}

export class DismissParticipantFromHearingEvent {
    constructor(public participant: PanelModel) {}
}
