import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { JudgeChatComponent } from './judge-chat.component';

describe('JudgeChatComponent', () => {
  let component: JudgeChatComponent;
  let fixture: ComponentFixture<JudgeChatComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ JudgeChatComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(JudgeChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
