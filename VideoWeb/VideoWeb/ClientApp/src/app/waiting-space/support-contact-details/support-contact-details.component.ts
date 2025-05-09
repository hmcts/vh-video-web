import { Component, Input } from '@angular/core';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-support-contact-details',
    standalone: false,
    templateUrl: './support-contact-details.component.html'
})
export class SupportContactDetailsComponent {
    @Input() vhTeamPhoneNumber$: Observable<string>;
}
