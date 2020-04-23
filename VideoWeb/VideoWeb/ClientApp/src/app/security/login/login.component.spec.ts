import { Router } from '@angular/router';
import { ReturnUrlService } from '../../services/return-url.service';
import { MockAdalService } from '../../testing/mocks/MockAdalService';
import { MockLogger } from '../../testing/mocks/MockLogger';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
    let component: LoginComponent;
    const mockAdalService = new MockAdalService();
    let adalService;
    const returnUrlService = new ReturnUrlService();
    const activatedRoute: any = { snapshot: { url: [{ path: 'foo' }], queryParams: {} } };
    let router: jasmine.SpyObj<Router>;

    beforeAll(() => {
        adalService = mockAdalService;
        router = jasmine.createSpyObj<Router>('Router', ['navigate', 'navigateByUrl']);
    });

    beforeEach(() => {
        component = new LoginComponent(adalService, activatedRoute, router, returnUrlService, new MockLogger());
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should store return url if supplied', () => {
        spyOn(returnUrlService, 'setUrl');
        adalService.setAuthenticated(false);
        activatedRoute.snapshot.queryParams['returnUrl'] = '/returnPath';
        component.ngOnInit();
        expect(returnUrlService.setUrl).toHaveBeenCalledWith('/returnPath');
    });

    it('should use saved return url', () => {
        adalService.setAuthenticated(true);
        spyOn(returnUrlService, 'popUrl').and.returnValue('testurl');
        component.ngOnInit();
        expect(router.navigateByUrl).toHaveBeenCalledWith('testurl');
    });

    it('should return to root url if no return path is given', () => {
        adalService.setAuthenticated(true);
        component.ngOnInit();
        expect(router.navigateByUrl).toHaveBeenCalledWith('/');
    });

    it('should fallback to root url if return url is invalid', () => {
        spyOn(returnUrlService, 'popUrl').and.returnValue('');
        adalService.setAuthenticated(true);
        router.navigateByUrl.and.callFake(() => {
            throw new Error('Invalid URL');
        });
        component.ngOnInit();
        expect(router.navigate).toHaveBeenCalledWith(['/']);
    });
});
