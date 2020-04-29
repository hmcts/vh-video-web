import { ParticipantStatusReader } from './participant-status-reader';
import { ParticipantStatus } from '../../services/clients/api-client';

describe('ParticipantStatusReader', () => {
    const reader = new ParticipantStatusReader();

    const testCasesForGetStatusAsText = [
        { status: ParticipantStatus.None, expected: 'Not Signed In' },
        { status: ParticipantStatus.NotSignedIn, expected: 'Not Signed In' },
        { status: ParticipantStatus.InConsultation, expected: 'In Consultation' },
        { status: ParticipantStatus.InHearing, expected: 'In Hearing' },
        { status: ParticipantStatus.UnableToJoin, expected: 'Unable to Join' }
    ];

    testCasesForGetStatusAsText.forEach((testCase) => {
        it('should get status as text', () => {
            expect(reader.getStatusAsText(testCase.status)).toBe(testCase.expected);
        });
    });

    const testCasesForgetStatusAsTextForJudge = [
        { status: ParticipantStatus.None, expected: 'Unavailable' },
        { status: ParticipantStatus.NotSignedIn, expected: 'Unavailable' },
        { status: ParticipantStatus.InConsultation, expected: 'Unavailable' },
        { status: ParticipantStatus.UnableToJoin, expected: 'Unavailable' },
        { status: ParticipantStatus.InHearing, expected: 'In Hearing' },
        { status: ParticipantStatus.Available, expected: 'Available' }
    ];

    testCasesForgetStatusAsTextForJudge.forEach((testCase) => {
        it('should get status as text for judge', () => {
            expect(reader.getStatusAsTextForJudge(testCase.status)).toBe(testCase.expected);
        });
    });
});
