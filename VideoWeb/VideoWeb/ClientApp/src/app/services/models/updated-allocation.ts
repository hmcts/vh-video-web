export class UpdatedAllocationDto {
    constructor(public conference_id: string, public scheduled_date_time: Date, public case_name: string, public judge_display_name: string) {}
}
