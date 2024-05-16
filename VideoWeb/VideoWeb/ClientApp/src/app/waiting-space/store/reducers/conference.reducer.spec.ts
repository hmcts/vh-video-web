import { conferenceReducer, initialState } from './conference.reducer';

describe('Conference Reducer', () => {
    describe('an unknown action', () => {
        it('should return the previous state', () => {
            const action = {} as any;

            const result = conferenceReducer(initialState, action);

            expect(result).toBe(initialState);
        });
    });
});
