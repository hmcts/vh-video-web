import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
    selector: 'app-private-consultation-description',
    standalone: false,
    templateUrl: './private-consultation-description.component.html',
    styleUrl: './private-consultation-description.component.scss'
})
export class PrivateConsultationDescriptionComponent {
    @Input() isExpanded: boolean = false;
    @Output() accordianToggled = new EventEmitter<void>();

    toggleAccordian() {
        this.accordianToggled.emit();
    }
}
