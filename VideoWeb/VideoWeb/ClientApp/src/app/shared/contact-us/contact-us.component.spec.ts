import { ComponentFixture, TestBed } from '@angular/core/testing';
import { configureTestSuite } from 'ng-bullet';
import { ContactUsComponent } from './contact-us.component';


describe('ContactUsComponent', () => {
  let component: ContactUsComponent;
  let fixture: ComponentFixture<ContactUsComponent>;

  configureTestSuite(() => {
    TestBed.configureTestingModule({
      declarations: [ ContactUsComponent ]
    });
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ContactUsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create contact us component', () => {
    expect(component).toBeTruthy();
  });
});
