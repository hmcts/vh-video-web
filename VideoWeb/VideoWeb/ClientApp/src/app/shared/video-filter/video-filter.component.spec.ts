import { Subject } from 'rxjs';
import { BackgroundFilter } from 'src/app/services/models/background-filter';
import { VideoFilterService } from 'src/app/services/video-filter.service';
import { MockLogger } from 'src/app/testing/mocks/mock-logger';
import { getSpiedPropertyGetter } from '../jasmine-helpers/property-helpers';
import { VideoFilterComponent } from './video-filter.component';

describe('VideoFilterComponent', () => {
    let component: VideoFilterComponent;
    let videoFilterService: jasmine.SpyObj<VideoFilterService>;
    const filterChangedSubject = new Subject<BackgroundFilter | null>();

    beforeAll(() => {
        videoFilterService = jasmine.createSpyObj<VideoFilterService>(
            'VideoFilterService',
            ['updateFilter'],
            ['onFilterChanged$', 'activeFilter']
        );
        getSpiedPropertyGetter(videoFilterService, 'activeFilter').and.returnValue(null);
        getSpiedPropertyGetter(videoFilterService, 'onFilterChanged$').and.returnValue(filterChangedSubject.asObservable());
    });

    beforeEach(() => {
        component = new VideoFilterComponent(videoFilterService, new MockLogger());
    });

    afterEach(() => {
        component.ngOnDestroy();
    });

    it('should toggle display options', () => {
        const before = component.showOptions;

        component.toggleDisplayOptions();

        expect(component.showOptions).not.toBe(before);
    });

    it('should update filter service when background option has changed', () => {
        const newFilter = BackgroundFilter.HMCTS;
        const event = new Event('selectionchange', {});
        const inputElement = document.createElement('input');
        inputElement.value = newFilter;
        Object.defineProperty(event, 'target', { value: inputElement });

        component.backgroundChanged(event);

        expect(videoFilterService.updateFilter).toHaveBeenCalledWith(newFilter);
    });

    it('should set filterOn to true when filter is enabled', () => {
        const filter = BackgroundFilter.HMCTS;

        component.ngOnInit();

        filterChangedSubject.next(filter);
        expect(component.filterOn).toBeTrue();
        expect(component.activeFilter).toBe(filter);
    });

    it('should set filterOn to false when filter is disable', () => {
        const filter = null;

        component.ngOnInit();

        filterChangedSubject.next(filter);

        expect(component.filterOn).toBeFalse();
    });
});
