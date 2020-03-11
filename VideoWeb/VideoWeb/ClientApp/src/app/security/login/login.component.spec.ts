import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { AdalService } from 'adal-angular4';
import { MockAdalService } from '../../testing/mocks/MockAdalService';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { ReturnUrlService } from '../../services/return-url.service';
import { configureTestSuite } from 'ng-bullet';
import { MockLogger } from '../../testing/mocks/MockLogger';
import { Logger } from '../../services/logging/logger-base';

describe('LoginComponent', () => {
    let component: LoginComponent;
    let fixture: ComponentFixture<LoginComponent>;
    let adalService: MockAdalService;
    let returnUrlService: ReturnUrlService;
    let route: ActivatedRoute;
    let router: Router;

    configureTestSuite(() => {
        TestBed.configureTestingModule({
            declarations: [LoginComponent],
            imports: [RouterTestingModule],
            providers: [
                { provide: AdalService, useClass: MockAdalService },
                { provide: Logger, useClass: MockLogger }
            ]
        });
    });

    beforeEach(() => {
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
        spyOn(returnUrlService, 'setUrl');
        adalService.setAuthenticated(false);
        route.snapshot.queryParams['returnUrl'] = '/returnPath';
        component.ngOnInit();
        expect(returnUrlService.setUrl).toHaveBeenCalledWith('/returnPath');
    });

    it('should use saved return url', () => {
        adalService.setAuthenticated(true);
        spyOn(returnUrlService, 'popUrl').and.returnValue('testurl');
        spyOn(router, 'navigateByUrl').and.callFake(() => {
            Promise.resolve(true);
        });
        component.ngOnInit();
        expect(router.navigateByUrl).toHaveBeenCalledWith('testurl');
    });

    it('should return to root url if no return path is given', () => {
        adalService.setAuthenticated(true);
        spyOn(router, 'navigateByUrl').and.callFake(() => {});
        component.ngOnInit();
        expect(router.navigateByUrl).toHaveBeenCalledWith('/');
    });

    it('should fallback to root url if return url is invalid', () => {
        spyOn(returnUrlService, 'popUrl').and.returnValue('');
        adalService.setAuthenticated(true);
        spyOn(router, 'navigate').and.callFake(() => {});
        spyOn(router, 'navigateByUrl').and.callFake(() => {
            throw new Error('Invalid URL');
        });
        component.ngOnInit();
        expect(router.navigate).toHaveBeenCalledWith(['/']);
    });
});
