import { attendanceService } from '../../application/attendanceService.js';
import { dom } from '../../shared/dom.js';

export function mount() {
  dom.onAll(dom.qsa('.quick-actions__btn'), 'click', async (e) => {
    const btn = e.currentTarget;
    const type = btn.dataset.type;
    try {
      await attendanceService.logAttendance({ userId: 'local', type });
    } catch (err) {
      console.error('[quickLog] failed:', err);
    }
  });
}

export function unmount() {}
