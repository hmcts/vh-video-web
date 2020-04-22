import { TestBed, fakeAsync } from '@angular/core/testing';
import { PageTrackerService } from './page-tracker.service';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { NavigationEnd } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

class MockRouter {
  public ne = new NavigationEnd(0, '/testUrl', null);
  public ne1 = new NavigationEnd(1, '/testUrl1', null);
  public events = new Observable(observer => {
    observer.next(this.ne);
    observer.next(this.ne1);
    observer.complete();
  });
}

describe('PageTrackerService', () => {
  let pageTrackerService: PageTrackerService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        PageTrackerService,
        { provide: Router, useClass: MockRouter }

      ]
    });

    router = TestBed.get(Router);
    pageTrackerService = TestBed.get(PageTrackerService);
    pageTrackerService.trackPreviousPage(router);

    const mockSessionStorage = {
      getItem: (key: string): string => {
        return 'true';
      },
      setItem: (key: string, value: string) => {
      },
      removeItem: (key: string) => {
      },
      clear: () => {
      }
    };
    spyOn(sessionStorage, 'getItem')
      .and.callFake(mockSessionStorage.getItem);
    spyOn(sessionStorage, 'setItem')
      .and.callFake(mockSessionStorage.setItem);
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('should be created', fakeAsync(() => {
    expect(pageTrackerService).toBeTruthy();
  }));

  it('it should retrieve data from session', () => {
    pageTrackerService.getPreviousUrl();
    expect(sessionStorage.getItem).toHaveBeenCalled();
  });

  it('it should save data from session', () => {
    pageTrackerService.trackPreviousPage(router);
    expect(sessionStorage.setItem).toHaveBeenCalledWith('PREVIOUS_ROUTE', '/testUrl');
  });
});
