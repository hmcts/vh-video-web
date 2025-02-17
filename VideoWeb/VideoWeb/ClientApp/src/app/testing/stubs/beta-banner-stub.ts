import { Input, Component } from '@angular/core';

@Component({
    standalone: false, selector: 'app-beta-banner', template: '' })
export class BetaBannerStubComponent {
    @Input() isRepresentativeOrIndividual: boolean;
}
