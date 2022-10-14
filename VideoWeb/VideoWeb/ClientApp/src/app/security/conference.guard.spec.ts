import { convertToParamMap, Router } from '@angular/router';
import { VideoWebService } from '../services/api/video-web.service';
import { ConferenceResponse, ConferenceStatus } from '../services/clients/api-client';
import { pageUrls } from '../shared/page-url.constants';
import { MockLogger } from '../testing/mocks/mock-logger';
import { ConferenceGuard } from './conference.guard';
import { SecurityServiceProvider } from './authentication/security-provider.service';
import { FeatureFlagService } from '../services/feature-flag.service';
import { ISecurityService } from './authentication/security-service.interface';
import { getSpiedPropertyGetter } from '../shared/jasmine-helpers/property-helpers';
import { of } from 'rxjs';

describe('ConferenceGuard', () => {
    let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
    let guard: ConferenceGuard;
    let router: jasmine.SpyObj<Router>;
    let activateRoute: any = { paramMap: convertToParamMap({ conferenceId: 'cef3051f-6909-40b9-a846-100cf4040a9a' }) };
    let securityServiceProviderServiceSpy: jasmine.SpyObj<SecurityServiceProvider>;
    let featureFlagServiceSpy: jasmine.SpyObj<FeatureFlagService>;
    let securityServiceSpy: jasmine.SpyObj<ISecurityService>;

    beforeAll(() => {
        router = jasmine.createSpyObj<Router>('Router', ['navigate']);
        videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['getConferenceById']);
        featureFlagServiceSpy = jasmine.createSpyObj<FeatureFlagService>('FeatureFlagService', ['getFeatureFlagByName']);
        securityServiceSpy = jasmine.createSpyObj<ISecurityService>('ISecurityService', [], ['isAuthenticated$']);
        securityServiceProviderServiceSpy = jasmine.createSpyObj<SecurityServiceProvider>(
            'SecurityServiceProviderService',
            [],
            ['currentSecurityService$']
        );
        getSpiedPropertyGetter(securityServiceProviderServiceSpy, 'currentSecurityService$').and.returnValue(of(securityServiceSpy));
    });

    beforeEach(() => {
        guard = new ConferenceGuard(securityServiceProviderServiceSpy, router, new MockLogger(), featureFlagServiceSpy, videoWebServiceSpy);
    });

    it('should be able to activate component', async () => {
        const response = new ConferenceResponse({ status: ConferenceStatus.NotStarted });
        videoWebServiceSpy.getConferenceById.and.returnValue(Promise.resolve(response));
        spyOn(guard, 'isUserAuthorized').and.returnValue(of(true));
        const result = await guard.canActivate(activateRoute, null);

        expect(result).toBeTruthy();
    });

    it('should not be able to activate component when conference closed and expired', async () => {
        const date = new Date(new Date().toUTCString());
        date.setUTCMinutes(date.getUTCMinutes() - 122);
        const response = new ConferenceResponse({ status: ConferenceStatus.Closed, closed_date_time: date });
        videoWebServiceSpy.getConferenceById.and.returnValue(Promise.resolve(response));
        spyOn(guard, 'isUserAuthorized').and.returnValue(of(true));
        const result = await guard.canActivate(activateRoute, null);

        expect(result).toBeFalsy();
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.JudgeHearingList]);
    });

    it('should not be able to activate component if conferenceId null', async () => {
        activateRoute = { paramMap: convertToParamMap({ conferenceId: null }) };
        videoWebServiceSpy.getConferenceById.and.returnValue(undefined);
        spyOn(guard, 'isUserAuthorized').and.returnValue(of(true));
        const result = await guard.canActivate(activateRoute, null);

        expect(result).toBeFalsy();
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.Home]);
    });

    it('should not be able to activate component if authorisation is false', async () => {
        spyOn(guard, 'isUserAuthorized').and.returnValue(of(false));
        const result = await guard.canActivate(activateRoute, null);

        expect(result).toBeFalsy();
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.Login]);
    });

    it('should not be able to activate component when exception', async () => {
        videoWebServiceSpy.getConferenceById.and.callFake(() => Promise.reject({ status: 500, isApiException: true }));
        spyOn(guard, 'isUserAuthorized').and.returnValue(of(true));
        const result = await guard.canActivate(activateRoute, null);

        expect(result).toBeFalsy();
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.Home]);
    });
});
