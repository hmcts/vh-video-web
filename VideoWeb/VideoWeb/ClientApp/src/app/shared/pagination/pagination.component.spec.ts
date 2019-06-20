import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { configureTestSuite } from 'ng-bullet';
import { PaginationComponent } from './pagination.component';


describe('PaginationComponent', () => {
  let component: PaginationComponent;
  let fixture: ComponentFixture<PaginationComponent>;
  let debugElement: DebugElement;

  configureTestSuite(() => {
    TestBed.configureTestingModule({
      declarations: [PaginationComponent]
    });
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PaginationComponent);
    debugElement = fixture.debugElement;
    component = debugElement.componentInstance;

    fixture.detectChanges();
  });

  it('should create pagination component', () => {
    expect(component).toBeTruthy();
  });

});
