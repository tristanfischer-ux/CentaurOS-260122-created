-- Add comprehensive tracking fields to work_plan_audit_records
ALTER TABLE work_plan_audit_records
  ADD COLUMN IF NOT EXISTS task_title TEXT,
  ADD COLUMN IF NOT EXISTS task_description TEXT,
  ADD COLUMN IF NOT EXISTS team_member_ids UUID[],
  ADD COLUMN IF NOT EXISTS team_member_names TEXT[],
  ADD COLUMN IF NOT EXISTS duration_weeks DECIMAL(4,1),
  ADD COLUMN IF NOT EXISTS total_tu_spent DECIMAL(6,1),
  ADD COLUMN IF NOT EXISTS total_cost DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS actual_end_date TIMESTAMPTZ;

-- Add comment to explain the table purpose
COMMENT ON TABLE work_plan_audit_records IS 'Tracks completed work plans with full details: what was done, who did it, and how long it took';
