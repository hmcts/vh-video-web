import { VideoWebService } from 'src/app/services/api/video-web.service';
import { HearingVenueResponse } from 'src/app/services/clients/api-client';
import { VenueSelectionComponent } from './venue-selection.component';

describe('VenueSelectionComponent', () => {
    let component: VenueSelectionComponent;
    let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
    const venues: HearingVenueResponse[] = [
        new HearingVenueResponse({ id: 1, name: 'test1' }),
        new HearingVenueResponse({ id: 2, name: 'test2' }),
        new HearingVenueResponse({ id: 3, name: 'test3' })
    ];

    beforeAll(() => {
        videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['getHearingVenues']);
    });

    beforeEach(() => {
        component = new VenueSelectionComponent(videoWebServiceSpy);
        videoWebServiceSpy.getHearingVenues.and.returnValue(Promise.resolve(venues));
    });

    it('should publish selection', () => {
        const selection = [venues[1]];
        component.selectedVenues = selection;
        spyOn(component.selectedAllocations, 'emit');
        component.publishSelection();
        expect(component.selectedAllocations.emit).toHaveBeenCalledWith(selection);
    });
});
