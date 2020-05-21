import { Router } from '@angular/router';
import { HeaderComponent } from './header.component';
import { topMenuItems } from './topMenuItems';

describe('HeaderComponent', () => {
    let component: HeaderComponent;
    let router: jasmine.SpyObj<Router>;

    beforeAll(() => {
        router = jasmine.createSpyObj<Router>('Router', ['navigate', 'navigateByUrl']);
    });

    beforeEach(() => {
        component = new HeaderComponent(router);
    });

    it('header component should have top menu items', () => {
        component.ngOnInit();
        expect(component.topMenuItems).toEqual(topMenuItems);
    });

    it('selected top menu item has active property set to true, others item active set to false', () => {
        component.ngOnInit();
        component.selectMenuItem(0);
        expect(component.topMenuItems[0].active).toBeTruthy();
        if (component.topMenuItems.length > 1) {
            for (const item of component.topMenuItems.slice(1)) {
                expect(item.active).toBeFalsy();
            }
        }
    });

    it('user should navigate by selecting top meny item', () => {
        component.ngOnInit();
        component.selectMenuItem(0);
        expect(router.navigate).toHaveBeenCalledWith([component.topMenuItems[0].url]);
    });
});
