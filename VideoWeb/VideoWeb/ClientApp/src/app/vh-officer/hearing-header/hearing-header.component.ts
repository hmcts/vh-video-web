import { Component, Input } from '@angular/core';
import { Hearing } from 'src/app/shared/models/hearing';

@Component({
    standalone: false,
    selector: 'app-hearing-header',
    templateUrl: './hearing-header.component.html'
})
export class HearingHeaderComponent {
    @Input() hearing: Hearing;

    constructor() {}
}
