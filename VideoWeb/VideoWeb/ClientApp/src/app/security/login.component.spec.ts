import { async, ComponentFixture, TestBed, fakeAsync } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { AdalService } from 'adal-angular4';
import { MockAdalService } from '../testing/mocks/MockAdalService';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { ReturnUrlService } from '../services/return-url.service';


describe('LoginComponent', () => {
    let component: LoginComponent;
    let fixture: ComponentFixture<LoginComponent>;
    let adalService: MockAdalService;
    let returnUrlService: ReturnUrlService;
    let returnUrlServiceSpy: jasmine.SpyObj<ReturnUrlService>;
    let route: ActivatedRoute;
    let router: Router;

    beforeEach(() => {
        returnUrlServiceSpy = jasmine.createSpyObj<ReturnUrlService>('ReturnUrlService', ['popUrl', 'setUrl']);

        TestBed.configureTestingModule({
            declarations: [LoginComponent],
            imports: [RouterTestingModule],
            providers: [
                { provide: AdalService, useClass: MockAdalService },
                { provide: ReturnUrlService, useValue: returnUrlServiceSpy }
            ]
        }).compileComponents();
        adalService = TestBed.get(AdalService);
        route = TestBed.get(ActivatedRoute);
        router = TestBed.get(Router);
        returnUrlService = TestBed.get(ReturnUrlService);
        fixture = TestBed.createComponent(LoginComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should store return url if supplied', () => {
        adalService.setAuthenticated(false);
        route.snapshot.queryParams['returnUrl'] = '/returnPath';
        component.ngOnInit();
        expect(returnUrlService.setUrl).toHaveBeenCalledWith('/returnPath');
    });

    it('should use saved return url', () => {
        adalService.setAuthenticated(true);
        returnUrlServiceSpy.popUrl.and.returnValue('testurl');
        spyOn(router, 'navigateByUrl').and.callFake(() => { Promise.resolve(true); });
        component.ngOnInit();
        expect(router.navigateByUrl).toHaveBeenCalledWith('testurl');
    });

    it('should return to root url if no return path is given', () => {
        adalService.setAuthenticated(true);
        spyOn(router, 'navigateByUrl').and.callFake(() => { });
        component.ngOnInit();
        expect(router.navigateByUrl).toHaveBeenCalledWith('/');
    });

    it('should fallback to root url if return url is invalid', () => {
        adalService.setAuthenticated(true);
        spyOn(router, 'navigate').and.callFake(() => { });
        spyOn(router, 'navigateByUrl').and.callFake(() => { throw new Error('Invalid URL'); });
        component.ngOnInit();
        expect(router.navigate).toHaveBeenCalledWith(['/']);
    });
});
