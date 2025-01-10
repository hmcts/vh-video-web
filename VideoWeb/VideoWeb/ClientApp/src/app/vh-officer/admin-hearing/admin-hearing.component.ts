import { Component, Input } from '@angular/core';
import { Hearing } from 'src/app/shared/models/hearing';

@Component({
    selector: 'app-admin-hearing',
    templateUrl: './admin-hearing.component.html',
    styleUrls: ['./admin-hearing.component.scss']
})
export class AdminHearingComponent {
    @Input() hearing: Hearing;
}
