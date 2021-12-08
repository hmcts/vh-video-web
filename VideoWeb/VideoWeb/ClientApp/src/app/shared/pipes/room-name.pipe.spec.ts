import { TranslateService } from '@ngx-translate/core';
import { RoomNamePipe } from './room-name.pipe';

describe('RoomNamePipe', () => {
    let translateServiceSpy: jasmine.SpyObj<TranslateService>;
    let pipe: RoomNamePipe;

    const meetingRoom = 'consultation-service.meeting-room';
    const meetingRoomShort = 'consultation-service.meeting-room-short';
    const judgeRoom = 'consultation-service.judge-room';
    const judgeRoomShort = 'consultation-service.judge-room-short';

    const meetingRoomReturn = 'meeting-room-return';
    const meetingRoomShortReturn = 'meeting-room-return-short';
    const judgeRoomReturn = 'judge-room-return';
    const judgeRoomShortReturn = 'judge-room-return-short';

    beforeEach(() => {
        translateServiceSpy = jasmine.createSpyObj<TranslateService>('TranslateService', ['instant']);
        translateServiceSpy.instant.withArgs(meetingRoom).and.returnValue(meetingRoomReturn);
        translateServiceSpy.instant.withArgs(meetingRoomShort).and.returnValue(meetingRoomShortReturn);
        translateServiceSpy.instant.withArgs(judgeRoom).and.returnValue(judgeRoomReturn);
        translateServiceSpy.instant.withArgs(judgeRoomShort).and.returnValue(judgeRoomShortReturn);

        pipe = new RoomNamePipe(translateServiceSpy);
    });

    it('create an instance', () => {
        expect(pipe).toBeTruthy();
    });

    describe('transform', () => {
        let inputStringPrefix: string;
        let isShortName: boolean;
        let expectedOutputPrefix: string;
        const suffix = '1';

        beforeEach(() => {
            inputStringPrefix = '';
            isShortName = false;
            expectedOutputPrefix = '';
        });

        afterEach(() => {
            expect(inputStringPrefix).toBeTruthy();
            expect(expectedOutputPrefix).toBeTruthy();

            const inputString = `${inputStringPrefix}${suffix}`;
            const expectedOutput = `${expectedOutputPrefix} ${suffix}`;

            expect(pipe.transform(inputString, isShortName)).toEqual(expectedOutput);
        });

        describe('ParticipantConsultationRoom', () => {
            beforeEach(() => {
                inputStringPrefix = 'ParticipantConsultationRoom';
            });

            it('should return correct value for regular', () => {
                expectedOutputPrefix = meetingRoomReturn;
            });

            it('should return correct value for short', () => {
                isShortName = true;
                expectedOutputPrefix = meetingRoomShortReturn;
            });
        });

        describe('ParticipantConsultationRoom', () => {
            beforeEach(() => {
                inputStringPrefix = 'ConsultationRoom';
            });

            it('should return correct value for regular', () => {
                expectedOutputPrefix = meetingRoomReturn;
            });

            it('should return correct value for short', () => {
                isShortName = true;
                expectedOutputPrefix = meetingRoomShortReturn;
            });
        });

        describe('JudgeJOHConsultationRoom', () => {
            beforeEach(() => {
                inputStringPrefix = 'JudgeJOHConsultationRoom';
            });

            it('should return correct value for regular', () => {
                expectedOutputPrefix = judgeRoomReturn;
            });

            it('should return correct value for short', () => {
                isShortName = true;
                expectedOutputPrefix = judgeRoomShortReturn;
            });
        });
    });

    describe('null value', () => {
        it('should return correct value for regular', () => {
            expect(pipe.transform(null)).toEqual(meetingRoomReturn);
        });

        it('should return correct value for short', () => {
            expect(pipe.transform(null, true)).toEqual(meetingRoomShortReturn);
        });
    });
});
