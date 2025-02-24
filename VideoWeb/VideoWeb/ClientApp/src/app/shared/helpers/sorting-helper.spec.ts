import { SortingHelper } from './sorting-helper';

describe('SortingHelper', () => {
    it('should create an instance', () => {
        expect(new SortingHelper()).toBeTruthy();
    });

    describe('orderByRoleThenName', () => {
        it('should sort by role', () => {
            const users = [
                { role: 'Admin', hearingRole: 'Judge', displayName: 'Alice' },
                { role: 'User', hearingRole: 'Witness', displayName: 'Bob' },
                { role: 'Admin', hearingRole: 'Witness', displayName: 'Charlie' }
            ];
            users.sort(SortingHelper.orderByRoleThenName);
            expect(users[0].displayName).toBe('Alice');
            expect(users[1].displayName).toBe('Charlie');
            expect(users[2].displayName).toBe('Bob');
        });

        it('should sort by hearing role when roles are equal', () => {
            const users = [
                { role: 'User', hearingRole: 'Witness', displayName: 'Alice' },
                { role: 'User', hearingRole: 'Judge', displayName: 'Bob' },
                { role: 'User', hearingRole: 'Witness', displayName: 'Charlie' }
            ];
            users.sort(SortingHelper.orderByRoleThenName);
            expect(users[0].displayName).toBe('Bob');
            expect(users[1].displayName).toBe('Alice');
            expect(users[2].displayName).toBe('Charlie');
        });

        it('should sort by display name when roles and hearing roles are equal', () => {
            const users = [
                { role: 'User', hearingRole: 'Witness', displayName: 'Charlie' },
                { role: 'User', hearingRole: 'Witness', displayName: 'Alice' },
                { role: 'User', hearingRole: 'Witness', displayName: 'Bob' }
            ];
            users.sort(SortingHelper.orderByRoleThenName);
            expect(users[0].displayName).toBe('Alice');
            expect(users[1].displayName).toBe('Bob');
            expect(users[2].displayName).toBe('Charlie');
        });
    });
});
