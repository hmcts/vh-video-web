import { Component, Input } from '@angular/core';
import { Hearing } from 'src/app/shared/models/hearing';

@Component({
    selector: 'app-admin-im',
    templateUrl: './admin-im.component.html',
    styleUrls: ['./admin-im.component.scss', '../vho-global-styles.scss']
})
export class AdminImComponent {
    @Input() hearing: Hearing;

    constructor() {}
}
