import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialOutNumberIconComponent } from './dial-out-number-icon.component';

describe('DialOutNumberIconComponent', () => {
  let component: DialOutNumberIconComponent;
  let fixture: ComponentFixture<DialOutNumberIconComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DialOutNumberIconComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DialOutNumberIconComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
