import { PanelModel } from 'src/app/waiting-space/models/participant-panel-model';

export class ToggleMuteParticipantEvent {
    constructor(public participant: PanelModel) {}
}

export class ToggleSpotlightParticipantEvent {
    constructor(public participant: PanelModel) {}
}

export class LowerParticipantHandEvent {
    constructor(public participant: PanelModel) {}
}

export class CallWitnessIntoHearingEvent {
    constructor(public participant: PanelModel) {}
}

export class DismissWitnessFromHearingEvent {
    constructor(public participant: PanelModel) {}
}
