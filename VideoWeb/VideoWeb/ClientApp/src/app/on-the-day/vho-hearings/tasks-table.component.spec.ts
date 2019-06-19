import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TasksTableComponent } from './tasks-table.component';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { MockVideoWebService } from 'src/app/testing/mocks/MockVideoService';
import { SharedModule } from 'src/app/shared/shared.module';
import { TasksTestData } from 'src/app/testing/mocks/data/tasks-test-data';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { TaskStatus } from 'src/app/services/clients/api-client';

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
    component.conference = new ConferenceTestData().getConferenceDetail();
    component.tasks = new TasksTestData().getTestData();
    spyOn(component, 'updateDivWidthForTasks').and.callFake(() => { });
    fixture.detectChanges();
  });

  it('should set task to done', () => {
    const task = component.tasks.filter(x => x.status === TaskStatus.ToDo)[0];
    const index = component.tasks.indexOf(task);
    const completedTask = new TasksTestData().getCompletedTask();
    component.updateTask(completedTask);

    const taskUpdated = component.tasks[index];
    expect(taskUpdated.updated).toBe(completedTask.updated);
    expect(taskUpdated.updated_by).toBe(completedTask.updated_by);
    expect(taskUpdated.status).toBe(TaskStatus.Done);
  });
});
