import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TasksTableComponent } from './tasks-table.component';
import { VideoWebService } from 'src/app/services/video-web.service';
import { MockVideoWebService } from 'src/app/testing/mocks/MockVideoService';
import { SharedModule } from 'src/app/shared/shared.module';
import { TasksTestData } from 'src/app/testing/mocks/data/tasks-test-data';

describe('TasksTableComponent', () => {
  let component: TasksTableComponent;
  let fixture: ComponentFixture<TasksTableComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [SharedModule],
      declarations: [ TasksTableComponent ],
      providers: [
        { provide: VideoWebService, useClass: MockVideoWebService }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TasksTableComponent);
    component = fixture.componentInstance;
    spyOn(component, 'updateDivWidthForTasks').and.callFake(() => { });
    fixture.detectChanges();
  });

  it('should set task to done', () => {
    component.tasks = new TasksTestData().getTestData();
    const task = component.tasks[0];
    component.completeTask(task);
    // task.
  });
});
