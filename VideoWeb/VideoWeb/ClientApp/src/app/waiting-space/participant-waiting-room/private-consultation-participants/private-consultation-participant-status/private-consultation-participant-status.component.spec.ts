import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MockComponent, MockPipe } from 'ng-mocks';
import {
    EndpointResponse,
    EndpointState,
    ParticipantResponse,
    ParticipantStatus,
    RoomSummaryResponse
} from 'src/app/services/clients/api-client';
import { RoomNamePipe } from 'src/app/shared/pipes/room-name.pipe';

import { PrivateConsultationParticipantStatusComponent } from './private-consultation-participant-status.component';

describe('PrivateConsultationParticipantStatusComponent', () => {
    let component: PrivateConsultationParticipantStatusComponent;
    let fixture: ComponentFixture<PrivateConsultationParticipantStatusComponent>;
    let testParticipant: ParticipantResponse;
    let testEndpoint: EndpointResponse;
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
                    testParticipant = new ParticipantResponse();
                    testParticipant.status = status;
                    component.entity = testParticipant;
                    expect(component.isAvailable()).toBe(shouldBeAvailable);
                });
            });
        });

        describe('when entity is a endpoint', () => {
            const allStatuses = Object.values(EndpointState);

            allStatuses.forEach(status => {
                const shouldBeAvailable = availableStatusStrings.includes(status);
                it(`should return ${shouldBeAvailable} when status is ${status}`, () => {
                    testEndpoint = new EndpointResponse();
                    testEndpoint.status = status;
                    component.entity = testEndpoint;
                    expect(component.isAvailable()).toBe(shouldBeAvailable);
                });
            });
        });
    });

    describe('isInCurrentRoom', () => {
        let testRoom: RoomSummaryResponse;
        const testRoomLabel = 'TestRoom';
        beforeEach(() => {
            component.roomLabel = testRoomLabel;

            testRoom = new RoomSummaryResponse();
            testParticipant = new ParticipantResponse();
            testParticipant.current_room = testRoom;
            component.entity = testParticipant;
        });

        it('should return true when room label matches', () => {
            testRoom.label = testRoomLabel;
            expect(component.isInCurrentRoom()).toBeTrue();
        });

        it('should return false when room label does not match', () => {
            testRoom.label = 'Something else';
            expect(component.isInCurrentRoom()).toBeFalse();
        });
    });
});
