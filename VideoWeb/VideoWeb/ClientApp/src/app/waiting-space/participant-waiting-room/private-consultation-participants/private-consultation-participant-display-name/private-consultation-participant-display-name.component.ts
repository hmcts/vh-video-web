import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
    selector: 'app-private-consultation-participant-display-name',
    templateUrl: './private-consultation-participant-display-name.component.html',
    styleUrls: ['./private-consultation-participant-display-name.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PrivateConsultationParticipantDisplayNameComponent {
    @Input() displayName: string;
    @Input() isAvailable: boolean;
    @Input() isInCurrentRoom: boolean;

    constructor() {}

    getColor(): string {
        return this.isInCurrentRoom ? 'yellow' : this.isAvailable ? 'white' : '';
    }
}
