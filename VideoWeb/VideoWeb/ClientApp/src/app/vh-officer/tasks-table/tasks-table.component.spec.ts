import { ComponentFixture, TestBed } from '@angular/core/testing';
import { configureTestSuite } from 'ng-bullet';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { TaskStatus } from 'src/app/services/clients/api-client';
import { SharedModule } from 'src/app/shared/shared.module';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { TasksTestData } from 'src/app/testing/mocks/data/tasks-test-data';
import { MockVideoWebService } from 'src/app/testing/mocks/MockVideoService';
import { TasksTableComponent } from './tasks-table.component';
import { Logger } from 'src/app/services/logging/logger-base';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';

describe('TasksTableComponent', () => {
    let component: TasksTableComponent;
    let fixture: ComponentFixture<TasksTableComponent>;

    configureTestSuite(() => {
        TestBed.configureTestingModule({
            imports: [SharedModule],
            declarations: [TasksTableComponent],
            providers: [
                { provide: VideoWebService, useClass: MockVideoWebService },
                { provide: Logger, useClass: MockLogger }
            ]
        });
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TasksTableComponent);
        component = fixture.componentInstance;
        component.conference = new ConferenceTestData().getConferenceDetailFuture();
        component.tasks = new TasksTestData().getTestData();
        spyOn(component, 'updateDivWidthForTasks').and.callFake(() => {});
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
