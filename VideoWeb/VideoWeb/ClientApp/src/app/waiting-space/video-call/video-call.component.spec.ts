import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VideoCallComponent } from './video-call.component';
import { TranslatePipeMock } from 'src/app/testing/mocks/mock-translation-pipe';

describe('VideoCallComponent', () => {
    let component: VideoCallComponent;
    let fixture: ComponentFixture<VideoCallComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [VideoCallComponent, TranslatePipeMock]
        }).compileComponents();

        fixture = TestBed.createComponent(VideoCallComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
