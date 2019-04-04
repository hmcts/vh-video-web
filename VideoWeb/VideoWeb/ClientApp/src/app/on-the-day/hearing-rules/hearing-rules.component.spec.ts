import { DebugElement } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { SharedModule } from 'src/app/shared/shared.module';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { HearingRulesComponent } from './hearing-rules.component';

describe('HearingRulesComponent', () => {
  let component: HearingRulesComponent;
  let fixture: ComponentFixture<HearingRulesComponent>;
  let debugElement: DebugElement;
  let router: Router;
  const conference = new ConferenceTestData().getConferenceDetail();

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [HearingRulesComponent],
      imports: [RouterTestingModule, SharedModule],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ conferenceId: conference.id })
            }
          },
        }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(HearingRulesComponent);
    debugElement = fixture.debugElement;
    component = debugElement.componentInstance;
    router = TestBed.get(Router);
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HearingRulesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should navigate to declaration', () => {
    spyOn(router, 'navigate').and.callFake(() => { });
    component.goToDeclaration();
    expect(router.navigate).toHaveBeenCalledWith([PageUrls.Declaration, conference.id]);
  });
});
