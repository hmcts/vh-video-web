import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { JudgeHearingTableComponent } from './judge-hearing-table.component';

describe('JudgeHearingTableComponent', () => {
  let component: JudgeHearingTableComponent;
  let fixture: ComponentFixture<JudgeHearingTableComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ JudgeHearingTableComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(JudgeHearingTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
