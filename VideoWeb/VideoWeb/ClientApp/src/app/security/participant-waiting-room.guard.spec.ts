import { async } from '@angular/core/testing';
import { convertToParamMap, Router } from '@angular/router';
import { VideoWebService } from '../services/api/video-web.service';
import { ConferenceResponse, ConferenceStatus } from '../services/clients/api-client';
import { MockLogger } from '../testing/mocks/mock-logger';
import { ParticipantWaitingRoomGuard } from './participant-waiting-room.guard';
import { FeatureFlagService } from '../services/feature-flag.service';
import { SecurityServiceProvider } from './authentication/security-provider.service';
import { ErrorService } from '../services/error.service';
import { of } from 'rxjs';
import { ISecurityService } from './authentication/security-service.interface';
import { getSpiedPropertyGetter } from '../shared/jasmine-helpers/property-helpers';
import { pageUrls } from '../shared/page-url.constants';

describe('ParticipantWaitingRoomGuard', () => {
    let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
    let guard: ParticipantWaitingRoomGuard;
    let router: jasmine.SpyObj<Router>;
    let activateRoute: any = { paramMap: convertToParamMap({ conferenceId: 'cef3051f-6909-40b9-a846-100cf4040a9a' }) };
    let securityServiceProviderServiceSpy: jasmine.SpyObj<SecurityServiceProvider>;
    let featureFlagServiceSpy: jasmine.SpyObj<FeatureFlagService>;
    let securityServiceSpy: jasmine.SpyObj<ISecurityService>;

    beforeAll(() => {
        router = jasmine.createSpyObj<Router>('Router', ['navigate']);
        videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['getConferenceById']);
        featureFlagServiceSpy = jasmine.createSpyObj<FeatureFlagService>('FeatureFlagService', ['getFeatureFlagByName']);
        securityServiceProviderServiceSpy = jasmine.createSpyObj<SecurityServiceProvider>(
            'SecurityServiceProviderService',
            [],
            ['currentSecurityService$']
        );
        securityServiceSpy = jasmine.createSpyObj<ISecurityService>('ISecurityService', [], ['isAuthenticated$']);
        getSpiedPropertyGetter(securityServiceProviderServiceSpy, 'currentSecurityService$').and.returnValue(of(securityServiceSpy));
    });

    beforeEach(() => {
        guard = new ParticipantWaitingRoomGuard(
            securityServiceProviderServiceSpy,
            router,
            new MockLogger(),
            featureFlagServiceSpy,
            videoWebServiceSpy
        );
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
        expect(router.navigate).toHaveBeenCalledWith(['participant/hearing-list']);
    });

    it('should not be able to activate component if conferenceId null', async () => {
        activateRoute = { paramMap: convertToParamMap({ conferenceId: null }) };
        videoWebServiceSpy.getConferenceById.and.returnValue(undefined);
        spyOn(guard, 'isUserAuthorized').and.returnValue(of(true));
        const result = await guard.canActivate(activateRoute, null);

        expect(result).toBeFalsy();
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.ParticipantHearingList]);
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
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.Logout]);
    });
});
