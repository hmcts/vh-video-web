import { inject } from '@angular/core/testing';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { of, Subscription } from 'rxjs';
import { JudgeEventService } from './judge-event.service';
import { SessionStorage } from './session-storage';
import { EventStatusModel } from './models/event-status.model';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';


describe('JudgeEventService', () => {
  let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
  videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['raiseParticipantEvent']);
  videoWebServiceSpy.raiseParticipantEvent.and.returnValue(of());
  const service = new JudgeEventService(videoWebServiceSpy, new MockLogger());

  it('should raise judge available event', () => {
    service.clearJudgeUnload();
    service.raiseJudgeAvailableEvent('123', '345');
    expect(videoWebServiceSpy.raiseParticipantEvent).toHaveBeenCalled();
  });
  it('should raise judge unavailable event', () => {
    const JUDGE_STATUS_KEY = 'vh.judge.status';
    const sessionStorage = new SessionStorage<EventStatusModel>(JUDGE_STATUS_KEY);
    sessionStorage.set(new EventStatusModel('1234', '4567'));
    service.raiseJudgeUnavailableEvent();
    expect(videoWebServiceSpy.raiseParticipantEvent).toHaveBeenCalled();
  });

  it('should set value in cache to true to indicate judge is closing browser ', () => {
    service.setJudgeUnload();
    expect(service.isUnload()).toBe(true);
  });
  it('should remove value from cache that is indicated judge is closing browser ', () => {
    service.setJudgeUnload();
    expect(service.isUnload()).toBe(true);
    service.clearJudgeUnload();
    expect(service.isUnload()).toBeNull();
  });
});
