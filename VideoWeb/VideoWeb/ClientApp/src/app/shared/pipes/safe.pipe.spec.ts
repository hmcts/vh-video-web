import { SafePipe } from './safe.pipe';

describe('SafePipe', () => {
    it('should remove special characters from string', () => {
        const pipe = new SafePipe();
        expect(pipe.transform('manual_judge_8<script>Alert("test")</script>')).toEqual('manual_judge_8scriptAlerttestscript');
        expect(pipe.transform('manual_judge_8 11!£$2')).toEqual('manual_judge_8 112');
        expect(pipe.transform('manual_ju&^%dge_8')).toEqual('manual_judge_8');
    });
});
