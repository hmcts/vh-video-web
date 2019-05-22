import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SelfTestComponent } from './self-test.component';

describe('SelfTestComponent', () => {
  let component: SelfTestComponent;
  let fixture: ComponentFixture<SelfTestComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SelfTestComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SelfTestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
