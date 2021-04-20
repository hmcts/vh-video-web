import { Router } from '@angular/router';
import { ProfileService } from '../services/api/profile.service';
import { Role, UserProfileResponse } from '../services/clients/api-client';
import { DeviceTypeService } from '../services/device-type.service';
import { ErrorService } from '../services/error.service';
import { pageUrls } from '../shared/page-url.constants';
import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
    let component: HomeComponent;
    let router: jasmine.SpyObj<Router>;

    beforeAll(() => {
        router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    });

    beforeEach(() => {
        component = new HomeComponent(router);
        router.navigate.and.callFake(() => Promise.resolve(true));
    });

    it('should go to navigator if user log in', async () => {
        component.ngOnInit();
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.Navigator]);
    });
});
