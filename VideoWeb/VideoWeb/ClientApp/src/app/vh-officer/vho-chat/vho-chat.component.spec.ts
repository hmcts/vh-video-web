import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VhoChatComponent } from './vho-chat.component';

describe('VhoChatComponent', () => {
  let component: VhoChatComponent;
  let fixture: ComponentFixture<VhoChatComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VhoChatComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VhoChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
