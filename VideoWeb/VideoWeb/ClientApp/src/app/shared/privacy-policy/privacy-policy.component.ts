import { Component } from '@angular/core';

@Component({
    standalone: false,
    selector: 'app-privacy-policy',
    templateUrl: './privacy-policy.component.html'
})
export class PrivacyPolicyComponent {
    printPage(): void {
        window.print();
    }
}
