import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MockComponent, MockPipe } from 'ng-mocks';
import {
    VideoEndpointResponse,
    EndpointStatus,
    ParticipantResponse,
    ParticipantStatus,
    RoomSummaryResponse
} from 'src/app/services/clients/api-client';
import { RoomNamePipe } from 'src/app/shared/pipes/room-name.pipe';

import { PrivateConsultationParticipantStatusComponent } from './private-consultation-participant-status.component';
import { VHEndpoint, VHParticipant, VHRoom } from 'src/app/waiting-space/store/models/vh-conference';

describe('PrivateConsultationParticipantStatusComponent', () => {
    let component: PrivateConsultationParticipantStatusComponent;
    let fixture: ComponentFixture<PrivateConsultationParticipantStatusComponent>;
    let testParticipant: VHParticipant;
    let testEndpoint: VHEndpoint;
    const availableStatusStrings = ['Available', 'Connected', 'InConsultation'];

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [PrivateConsultationParticipantStatusComponent, MockPipe(RoomNamePipe), MockComponent(FaIconComponent)]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(PrivateConsultationParticipantStatusComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('isAvailable', () => {
        describe('when entity is a participant', () => {
            const allStatuses = Object.values(ParticipantStatus);

            allStatuses.forEach(status => {
                const shouldBeAvailable = availableStatusStrings.includes(status);
                it(`should return ${shouldBeAvailable} when status is ${status}`, () => {
                    testParticipant = jasmine.createSpyObj<VHParticipant>('VHParticipant', [], { status: status });
                    testParticipant.status = status;
                    component.entity = testParticipant;
                    expect(component.isAvailable()).toBe(shouldBeAvailable);
                });
            });
        });

        describe('when entity is a endpoint', () => {
            const allStatuses = Object.values(EndpointStatus);

            allStatuses.forEach(status => {
                const shouldBeAvailable = availableStatusStrings.includes(status);
                it(`should return ${shouldBeAvailable} when status is ${status}`, () => {
                    testEndpoint = jasmine.createSpyObj<VHEndpoint>('VHEndpoint', [], { status: status });
                    testEndpoint.status = status;
                    component.entity = testEndpoint;
                    expect(component.isAvailable()).toBe(shouldBeAvailable);
                });
            });
        });
    });

    describe('isInCurrentRoom', () => {
        let testRoom: VHRoom;
        const testRoomLabel = 'TestRoom';
        beforeEach(() => {
            component.roomLabel = testRoomLabel;

            testRoom = jasmine.createSpyObj<VHRoom>('VHRoom', [], { label: testRoomLabel });
            testParticipant = jasmine.createSpyObj<VHParticipant>('VHParticipant', [], { room: testRoom });
            component.entity = testParticipant;
        });

        it('should return true when room label matches', () => {
            testRoom.label = testRoomLabel;
            expect(component.isInCurrentRoom()).toBeTrue();
        });

        it('should return false when room label does not match', () => {
            testParticipant = jasmine.createSpyObj<VHParticipant>('VHParticipant', [], { room: { label: 'Something else', locked: true } });
            component.entity = testParticipant;
            expect(component.isInCurrentRoom()).toBeFalse();
        });
    });
});
