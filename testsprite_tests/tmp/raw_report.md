
# TestSprite AI Testing Report(MCP)

---

## 1️⃣ Document Metadata
- **Project Name:** ShiftPro
- **Date:** 2026-06-08
- **Prepared by:** TestSprite AI Team

---

## 2️⃣ Requirement Validation Summary

#### Test TC001 Clock out and complete the shift
- **Test Code:** [TC001_Clock_out_and_complete_the_shift.py](./TC001_Clock_out_and_complete_the_shift.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/ab5d14b6-ffe6-4612-a64d-1073b4aac17e/ceba0fa5-fcdb-45c0-8055-674a6a5cfd1a
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC002 Clock in and see the shift begin
- **Test Code:** [TC002_Clock_in_and_see_the_shift_begin.py](./TC002_Clock_in_and_see_the_shift_begin.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/ab5d14b6-ffe6-4612-a64d-1073b4aac17e/68291986-8740-4e24-a1af-7dece4f1c519
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC003 Clock in from the dashboard
- **Test Code:** [TC003_Clock_in_from_the_dashboard.py](./TC003_Clock_in_from_the_dashboard.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/ab5d14b6-ffe6-4612-a64d-1073b4aac17e/8c22e473-bab9-4583-ace4-e3466c872795
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC004 Save a shift and review it in logs
- **Test Code:** [TC004_Save_a_shift_and_review_it_in_logs.py](./TC004_Save_a_shift_and_review_it_in_logs.py)
- **Test Error:** TEST FAILURE

The completed shift was not recorded correctly in Logs — the daily history entry shows only the clock-in time and no clock-out time, and the total duration is 00:00.

Observations:
- Daily history row for 06-08 shows In = 03:07 AM, Out = —, Total = 00:00
- Monthly overview shows Total Hours = 00:00 and Days Worked = 1
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/ab5d14b6-ffe6-4612-a64d-1073b4aac17e/ae1cf297-65c6-430a-86b5-273df0e4bfe5
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC005 Completed shift appears in logs
- **Test Code:** [TC005_Completed_shift_appears_in_logs.py](./TC005_Completed_shift_appears_in_logs.py)
- **Test Error:** TEST FAILURE

A completed shift (with both In and Out timestamps) was expected to appear in the logs after clocking out, but the logs do not show an Out time for today's entry.

Observations:
- The logs table row for 06-08 shows In = 03:07 AM and Out = — (no Out timestamp).
- The Total column shows 00:01, indicating only the clock-in was recorded.
- The Clock Out action performed earlier did not produce a recorded Out time in the logs.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/ab5d14b6-ffe6-4612-a64d-1073b4aac17e/170f568c-d75e-4e92-9684-960e2aa5edef
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC006 Switch between all main app sections
- **Test Code:** [TC006_Switch_between_all_main_app_sections.py](./TC006_Switch_between_all_main_app_sections.py)
- **Test Error:** TEST FAILURE

Clicking the Logs bottom navigation did not activate the Logs view — the main content remained on the Dashboard ('Monthly Overview') even though the Logs tab was set to selected.

Observations:
- The Logs tab interactive element (index 31) shows selected=true in the page state.
- The main content area continues to display Dashboard content ('Monthly Overview') and did not change after 5 click attempts.

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/ab5d14b6-ffe6-4612-a64d-1073b4aac17e/d7beeb3d-c196-4949-887a-9a3da2831cb0
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC007 Clocked-in state persists while navigating tabs
- **Test Code:** [TC007_Clocked_in_state_persists_while_navigating_tabs.py](./TC007_Clocked_in_state_persists_while_navigating_tabs.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/ab5d14b6-ffe6-4612-a64d-1073b4aac17e/a14758a2-8462-419e-8c17-5c0c4108e6b6
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC008 Open the logs section from the main shell
- **Test Code:** [TC008_Open_the_logs_section_from_the_main_shell.py](./TC008_Open_the_logs_section_from_the_main_shell.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/ab5d14b6-ffe6-4612-a64d-1073b4aac17e/e94b093b-a478-4ac1-8a97-570b595ea3ef
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC009 Timer updates while a shift remains active
- **Test Code:** [TC009_Timer_updates_while_a_shift_remains_active.py](./TC009_Timer_updates_while_a_shift_remains_active.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/ab5d14b6-ffe6-4612-a64d-1073b4aac17e/f15d59f0-0794-4d75-996f-dccf458549a0
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC010 Timer stops after clock out
- **Test Code:** [TC010_Timer_stops_after_clock_out.py](./TC010_Timer_stops_after_clock_out.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/ab5d14b6-ffe6-4612-a64d-1073b4aac17e/6575f454-ae10-4315-8298-30d3bffc9018
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC011 View monthly summary and daily history in logs
- **Test Code:** [TC011_View_monthly_summary_and_daily_history_in_logs.py](./TC011_View_monthly_summary_and_daily_history_in_logs.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/ab5d14b6-ffe6-4612-a64d-1073b4aac17e/dbe04866-089c-4953-aad0-f44e38bc3d3e
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC012 View monthly attendance totals on Logs
- **Test Code:** [TC012_View_monthly_attendance_totals_on_Logs.py](./TC012_View_monthly_attendance_totals_on_Logs.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/ab5d14b6-ffe6-4612-a64d-1073b4aac17e/2ba73e0c-2b00-48cc-8264-dfb4853d1075
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC013 Log a sick leave entry from the dashboard
- **Test Code:** [TC013_Log_a_sick_leave_entry_from_the_dashboard.py](./TC013_Log_a_sick_leave_entry_from_the_dashboard.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/ab5d14b6-ffe6-4612-a64d-1073b4aac17e/c0d665e1-92e3-4dd4-8227-75a4686ac29e
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC014 Review daily attendance history columns
- **Test Code:** [TC014_Review_daily_attendance_history_columns.py](./TC014_Review_daily_attendance_history_columns.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/ab5d14b6-ffe6-4612-a64d-1073b4aac17e/ee215d83-9513-4148-bd28-c4c110b96044
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC015 Log a vacation entry from the dashboard
- **Test Code:** [TC015_Log_a_vacation_entry_from_the_dashboard.py](./TC015_Log_a_vacation_entry_from_the_dashboard.py)
- **Test Error:** TEST FAILURE

A vacation attendance record could not be verified in Logs after using the Dashboard quick log.

Observations:
- The Logs view is selected and displays 'No records this month'.
- The 'Vacation' quick log was clicked earlier but no confirmation modal, toast, or new history row appeared.
- The history table contains no entry corresponding to the attempted vacation log.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/ab5d14b6-ffe6-4612-a64d-1073b4aac17e/f5478da3-c132-4e71-98c5-efebc8c393be
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---


## 3️⃣ Coverage & Matching Metrics

- **73.33** of tests passed

| Requirement        | Total Tests | ✅ Passed | ❌ Failed  |
|--------------------|-------------|-----------|------------|
| ...                | ...         | ...       | ...        |
---


## 4️⃣ Key Gaps / Risks
{AI_GNERATED_KET_GAPS_AND_RISKS}
---