import { Component } from '@angular/core';
import { faPhoneVolume } from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'app-dial-out-number-icon',
    templateUrl: './dial-out-number-icon.component.html',
    styleUrl: './dial-out-number-icon.component.css'
})
export class DialOutNumberIconComponent {
    dialOutIcon = faPhoneVolume;

    dialOutNumber() {}
}
