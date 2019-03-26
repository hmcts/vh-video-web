import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NoHearingsComponent } from './no-hearings.component';

describe('NoHearingsComponent', () => {
  let component: NoHearingsComponent;
  let fixture: ComponentFixture<NoHearingsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NoHearingsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NoHearingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
