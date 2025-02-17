import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
    standalone: false,
    selector: 'app-private-consultation-participant-display-name',
    templateUrl: './private-consultation-participant-display-name.component.html',
    styleUrls: ['./private-consultation-participant-display-name.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PrivateConsultationParticipantDisplayNameComponent {
    @Input() displayName: string;
    @Input() isAvailable: boolean;
    @Input() isInCurrentRoom: boolean;

    getColor(): string {
        if (this.isInCurrentRoom) {
            return 'yellow';
        }
        if (this.isAvailable) {
            return 'white';
        }
        return '';
    }
}
