import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
    standalone: false,
    selector: 'app-hearing-control-icon',
    templateUrl: './hearing-control-icon.component.html',
    styleUrl: './hearing-control-icon.component.scss'
})
export class HearingControlIconComponent {
    @Input() iconPrefix = 'fas';
    @Input() tooltipColour = 'grey';
    @Input() iconName: string;
    @Input() iconText: string;
    @Input() showText = false;

    @Output() iconClicked = new EventEmitter();

    onIconClicked() {
        this.iconClicked.emit();
    }
}
