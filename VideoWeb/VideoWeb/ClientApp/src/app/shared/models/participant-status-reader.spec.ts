import { ParticipantStatusReader } from './participant-status-reader';
import { ParticipantStatus } from '../../services/clients/api-client';

describe('ParticipantStatusReader', () => {
    const reader = new ParticipantStatusReader();

    const testCasesForGetStatusAsText = [
        { status: ParticipantStatus.None, expected: 'Not signed in' },
        { status: ParticipantStatus.NotSignedIn, expected: 'Not signed in' },
        { status: ParticipantStatus.InConsultation, expected: 'In consultation' },
        { status: ParticipantStatus.InHearing, expected: 'In hearing' },
        { status: ParticipantStatus.UnableToJoin, expected: 'Unable to join' }
    ];

    testCasesForGetStatusAsText.forEach(testCase => {
        it(`should get status ${testCase.status} as text`, () => {
            expect(reader.getStatusAsText(testCase.status)).toBe(testCase.expected);
        });
    });

    const testCasesForgetStatusAsTextForJudge = [
        { status: ParticipantStatus.None, expected: 'Unavailable' },
        { status: ParticipantStatus.NotSignedIn, expected: 'Unavailable' },
        { status: ParticipantStatus.InConsultation, expected: 'Unavailable' },
        { status: ParticipantStatus.UnableToJoin, expected: 'Unavailable' },
        { status: ParticipantStatus.InHearing, expected: 'In hearing' },
        { status: ParticipantStatus.Available, expected: 'Available' }
    ];

    testCasesForgetStatusAsTextForJudge.forEach(testCase => {
        it(`should get status ${testCase.status} as text for judge`, () => {
            expect(reader.getStatusAsTextForJudge(testCase.status)).toBe(testCase.expected);
        });
    });
});
