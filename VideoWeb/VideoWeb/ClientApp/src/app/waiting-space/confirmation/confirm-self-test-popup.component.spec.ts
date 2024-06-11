import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmSelfTestPopupComponent } from './confirm-self-test-popup.component';

describe('ConfirmSelfTestPopupComponent', () => {
  let component: ConfirmSelfTestPopupComponent;
  let fixture: ComponentFixture<ConfirmSelfTestPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmSelfTestPopupComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ConfirmSelfTestPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
