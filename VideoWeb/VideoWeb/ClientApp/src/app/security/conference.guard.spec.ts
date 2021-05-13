import { convertToParamMap, Router } from '@angular/router';
import { VideoWebService } from '../services/api/video-web.service';
import { ConferenceResponse, ConferenceStatus } from '../services/clients/api-client';
import { pageUrls } from '../shared/page-url.constants';
import { MockLogger } from '../testing/mocks/mock-logger';
import { ConferenceGuard } from './conference.guard';

describe('ConferenceGuard', () => {
    let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
    let guard: ConferenceGuard;
    let router: jasmine.SpyObj<Router>;
    let activateRoute: any = { paramMap: convertToParamMap({ conferenceId: 'cef3051f-6909-40b9-a846-100cf4040a9a' }) };

    beforeAll(() => {
        router = jasmine.createSpyObj<Router>('Router', ['navigate']);
        videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['getConferenceById']);
    });

    beforeEach(() => {
        guard = new ConferenceGuard(videoWebServiceSpy, router, new MockLogger());
    });

    it('should be able to activate component', async () => {
        const response = new ConferenceResponse({ status: ConferenceStatus.NotStarted });
        videoWebServiceSpy.getConferenceById.and.returnValue(Promise.resolve(response));
        const result = await guard.canActivate(activateRoute);

        expect(result).toBeTruthy();
    });

    it('should not be able to activate component when conference closed and expired', async () => {
        const date = new Date(new Date().toUTCString());
        date.setUTCMinutes(date.getUTCMinutes() - 122);
        const response = new ConferenceResponse({ status: ConferenceStatus.Closed, closed_date_time: date });
        videoWebServiceSpy.getConferenceById.and.returnValue(Promise.resolve(response));
        const result = await guard.canActivate(activateRoute);

        expect(result).toBeFalsy();
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.JudgeHearingList]);
    });

    it('should not be able to activate component if conferenceId null', async () => {
        activateRoute = { paramMap: convertToParamMap({ conferenceId: null }) };
        videoWebServiceSpy.getConferenceById.and.returnValue(undefined);
        const result = await guard.canActivate(activateRoute);

        expect(result).toBeFalsy();
        expect(router.navigate).toHaveBeenCalledWith(['home']);
    });

    it('should not be able to activate component when exception', async () => {
        videoWebServiceSpy.getConferenceById.and.callFake(() => Promise.reject({ status: 500, isApiException: true }));
        const result = await guard.canActivate(activateRoute);

        expect(result).toBeFalsy();
        expect(router.navigate).toHaveBeenCalledWith(['home']);
    });
});
