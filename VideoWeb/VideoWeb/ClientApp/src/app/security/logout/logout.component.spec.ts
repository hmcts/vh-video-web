import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AdalService } from 'adal-angular4';
import { configureTestSuite } from 'ng-bullet';
import { MockAdalService } from '../../testing/mocks/MockAdalService';
import { LogoutComponent } from './logout.component';
import { HttpClientModule } from '@angular/common/http';

describe('LogoutComponent', () => {
    let component: LogoutComponent;
    let fixture: ComponentFixture<LogoutComponent>;
    let adalService: MockAdalService;

    configureTestSuite(() => {
        TestBed.configureTestingModule({
            declarations: [LogoutComponent],
            imports: [RouterTestingModule, HttpClientModule],
            providers: [{ provide: AdalService, useClass: MockAdalService }]
        });
    });

    beforeEach(() => {
        adalService = TestBed.get(AdalService);
        fixture = TestBed.createComponent(LogoutComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call logout if authenticated', () => {
        adalService.setAuthenticated(true);
        spyOn(adalService, 'logOut').and.callFake(() => {});
        component.ngOnInit();
        expect(adalService.logOut).toHaveBeenCalled();
    });

    it('should not call logout if unauthenticated', () => {
        adalService.setAuthenticated(false);
        spyOn(adalService, 'logOut').and.callFake(() => {});
        component.ngOnInit();
        expect(adalService.logOut).toHaveBeenCalledTimes(0);
    });
});
