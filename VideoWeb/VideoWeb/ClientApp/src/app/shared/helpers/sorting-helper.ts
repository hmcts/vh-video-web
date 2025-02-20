export class SortingHelper {
    static orderByRoleThenName = (a, b) => {
        // Sort by User Role
        if (a.role < b.role) {
            return -1;
        }
        if (a.role > b.role) {
            return 1;
        }
        // Sort by Hearing Role
        if (a.hearingRole < b.hearingRole) {
            return -1;
        }
        if (a.hearingRole > b.hearingRole) {
            return 1;
        }
        // Sort by Name
        return a.displayName.localeCompare(b.displayName);
    };
}
