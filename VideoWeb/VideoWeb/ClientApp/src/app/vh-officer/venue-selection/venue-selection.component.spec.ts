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

    it('should publish selection when venues are selected', () => {
        const selection = [venues[1]];
        component.selectedVenues = selection;
        spyOn(component.selectedAllocations, 'emit');
        component.publishSelection();
        expect(component.selectedAllocations.emit).toHaveBeenCalledWith(selection);
    });

    it('should not publish selection when no venues are selected', () => {
        const selection = [];
        component.selectedVenues = selection;
        spyOn(component.selectedAllocations, 'emit');
        component.publishSelection();
        expect(component.selectedAllocations.emit).toHaveBeenCalledTimes(0);
    });

    it('should retrieve and populate venues on init', async () => {
        expect(component.venues).toBeUndefined();
        await component.ngOnInit();
        expect(component.venues).toBeDefined();
    });

    it('should set all venues onSelectAll', () => {
        component.venues = venues;
        component.onSelectAll();
        expect(component.selectedVenues).toEqual(venues);
    });

    it('should add venue to list on select', () => {
        component.venues = venues;
        component.onItemSelect(venues[0]);
        expect(component.selectedVenues.length).toBe(1);
    });

    it('should not add venue to list on select when venue already in list', () => {
        const venue = venues[0];
        component.venues = venues;
        component.selectedVenues = [venue];
        component.onItemSelect(venue);
        expect(component.selectedVenues.length).toBe(1);
    });

    it('should remove venue from list on deselect', () => {
        component.selectedVenues = venues;
        component.onItemDeselect(venues[0]);
        expect(component.selectedVenues.length).toBe(venues.length - 1);
    });
});
