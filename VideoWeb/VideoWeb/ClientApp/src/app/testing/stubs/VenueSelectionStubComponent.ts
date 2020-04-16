import { Component, EventEmitter, Output } from '@angular/core';
import { HearingVenueResponse } from 'src/app/services/clients/api-client';
@Component({ selector: 'app-venue-selection', template: '' })
export class VenueSelectionStubComponent {
    @Output()
    selectedAllocations = new EventEmitter<HearingVenueResponse[]>();
}
