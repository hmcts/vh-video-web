import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { JudgeHearingPageComponent } from './judge-hearing-page.component';

describe('JudgeHearingPageComponent', () => {
  let component: JudgeHearingPageComponent;
  let fixture: ComponentFixture<JudgeHearingPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ JudgeHearingPageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(JudgeHearingPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
