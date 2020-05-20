import { Location } from '@angular/common';
import { BackNavigationComponent } from './back-navigation.component';

describe('BackNavigationComponent', () => {
    let component: BackNavigationComponent;
    const locationSpy: jasmine.SpyObj<Location> = jasmine.createSpyObj<Location>('Location', ['back']);

    beforeEach(() => {
        component = new BackNavigationComponent(locationSpy);
    });

    it('should go back using location', () => {
        component.navigateBack();
        expect(locationSpy.back).toHaveBeenCalled();
    });
});
