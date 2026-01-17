-- Seed data for initial testing
-- Run this AFTER 001_data_architecture.sql

-- ============================================================================
-- UNIVERSAL DATA SEEDS
-- ============================================================================

-- AI Tools Catalog
INSERT INTO ai_tools (name, provider, category, description, typical_monthly_cost) VALUES
  ('GPT-4', 'openai', 'text', 'Advanced language model for text generation and analysis', 200.00),
  ('Claude 3.5 Sonnet', 'anthropic', 'text', 'Intelligent AI assistant for complex tasks', 180.00),
  ('DALL-E 3', 'openai', 'image', 'AI image generation from text prompts', 150.00),
  ('Midjourney', 'midjourney', 'image', 'High-quality AI art and image generation', 60.00),
  ('ElevenLabs', 'elevenlabs', 'voice', 'AI voice generation and text-to-speech', 99.00),
  ('Stable Diffusion', 'stability', 'image', 'Open-source image generation', 0.00);

-- Function Templates
INSERT INTO function_templates (name, description, typical_cost_per_day) VALUES
  ('Engineering', 'Software development and technical implementation', 800.00),
  ('Marketing', 'Growth, branding, and customer acquisition', 600.00),
  ('Finance', 'Financial planning, accounting, and analysis', 700.00),
  ('Operations', 'Process optimization and operational excellence', 650.00),
  ('Product', 'Product strategy, design, and management', 750.00),
  ('Sales', 'Revenue generation and customer relationships', 700.00),
  ('Legal', 'Legal compliance and contract management', 900.00),
  ('HR', 'People operations and talent management', 600.00);

-- Role Definitions
INSERT INTO role_definitions (name, description, permissions) VALUES
  ('Founder', 'Company founder with full access', '{"all": true}'::jsonb),
  ('FractionalExec', 'Fractional executive with function-specific access', '{"read": true, "write": true, "delete": false}'::jsonb),
  ('Apprentice', 'Junior team member with task execution access', '{"read": true, "write": false, "delete": false}'::jsonb);

-- ============================================================================
-- SAMPLE COMPANY DATA (for initial testing workspace)
-- ============================================================================

-- Insert a test workspace
-- Note: In production, workspaces will be created via the app
INSERT INTO workspaces (id, name) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Acme Corp');

-- Insert test members (no user_id for now, will be linked when users sign up)
INSERT INTO members (id, workspace_id, name, role, function, status, days_per_week, cost_per_day) VALUES
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Sarah Johnson', 'Founder', 'Product', 'active', 5.0, 0),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Mike Chen', 'FractionalExec', 'Engineering', 'active', 3.0, 800.00),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Emily Davis', 'FractionalExec', 'Marketing', 'active', 2.0, 600.00),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'James Wilson', 'Apprentice', 'Engineering', 'active', 5.0, 300.00);

-- Insert sample work plans
INSERT INTO work_plans (id, workspace_id, title, description, status, priority, progress, start_date, end_date, created_by) VALUES
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Launch MVP', 'Build and launch minimum viable product', 'in-progress', 'critical', 65, '2026-01-01', '2026-03-31', '10000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'User Authentication', 'Implement secure user login and registration', 'completed', 'high', 100, '2026-01-01', '2026-01-15', '10000000-0000-0000-0000-000000000002'),
  ('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Marketing Campaign', 'Q1 growth marketing campaign', 'in-progress', 'high', 40, '2026-01-15', '2026-03-31', '10000000-0000-0000-0000-000000000003'),
  ('20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Database Optimization', 'Improve query performance', 'planning', 'medium', 0, '2026-02-01', '2026-02-28', '10000000-0000-0000-0000-000000000002');

-- Insert work plan allocations
INSERT INTO work_plan_allocations (work_plan_id, member_id, squares_per_week) VALUES
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 2.0),
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 4.0),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 6.0),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000004', 4.0),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 4.0);

-- Insert audit record for completed work plan
INSERT INTO work_plan_audit_records (work_plan_id, completed_at, completed_by, notes) VALUES
  ('20000000-0000-0000-0000-000000000002', '2026-01-15T18:30:00Z', '10000000-0000-0000-0000-000000000002', 'Authentication system fully implemented and tested');

-- Insert sample OKRs
INSERT INTO okrs (id, workspace_id, title, description, status, quarter, owner_id) VALUES
  ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Launch Product to Market', 'Successfully launch MVP and acquire first customers', 'on-track', 'Q1 2026', '10000000-0000-0000-0000-000000000001'),
  ('30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Build Engineering Team', 'Establish technical foundation and team structure', 'on-track', 'Q1 2026', '10000000-0000-0000-0000-000000000002');

-- Insert OKR objectives
INSERT INTO okr_objectives (okr_id, title, progress) VALUES
  ('30000000-0000-0000-0000-000000000001', 'Complete MVP development', 65),
  ('30000000-0000-0000-0000-000000000001', 'Acquire 100 beta users', 30),
  ('30000000-0000-0000-0000-000000000001', 'Achieve product-market fit', 20),
  ('30000000-0000-0000-0000-000000000002', 'Hire 2 fractional engineers', 50),
  ('30000000-0000-0000-0000-000000000002', 'Establish CI/CD pipeline', 75);

-- Insert sample suppliers
INSERT INTO suppliers (id, workspace_id, name, category, description, website) VALUES
  ('40000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'TechFab Manufacturing', 'Manufacturing', 'Hardware component manufacturing', 'https://techfab.example.com'),
  ('40000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'CloudHost Pro', 'Infrastructure', 'Cloud hosting and infrastructure', 'https://cloudhost.example.com'),
  ('40000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'DataSync Analytics', 'AI Tools', 'AI-powered analytics platform', 'https://datasync.example.com');

-- Insert supplier engagements
INSERT INTO supplier_engagements (workspace_id, supplier_id, category, status, contract_value, paid_to_date, start_date, end_date) VALUES
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'Manufacturing', 'in_progress', 50000.00, 15000.00, '2025-12-01', '2026-06-30'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002', 'Infrastructure', 'in_progress', 12000.00, 2000.00, '2026-01-01', '2026-12-31'),
  ('00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000003', 'AI Tools', 'planning', 8000.00, 0.00, '2026-02-01', '2026-07-31');

-- Insert sample financial transactions
-- Revenue
INSERT INTO financial_transactions (workspace_id, type, category, subcategory, amount, transaction_date, description, recurring) VALUES
  ('00000000-0000-0000-0000-000000000001', 'revenue', 'product_sales', 'Direct Sales', 25000.00, '2025-12-15', 'Q4 product sales', false),
  ('00000000-0000-0000-0000-000000000001', 'revenue', 'product_sales', 'Direct Sales', 18000.00, '2026-01-10', 'January product sales', false),
  ('00000000-0000-0000-0000-000000000001', 'revenue', 'services', 'Consulting', 12000.00, '2025-12-20', 'Consulting engagement', false);

-- Costs
INSERT INTO financial_transactions (workspace_id, type, category, subcategory, amount, transaction_date, description, recurring, recurrence_period) VALUES
  -- Team costs
  ('00000000-0000-0000-0000-000000000001', 'cost', 'team', 'Engineering', 9600.00, '2026-01-05', 'Mike Chen - Engineering (3 days/week)', true, 'monthly'),
  ('00000000-0000-0000-0000-000000000001', 'cost', 'team', 'Marketing', 4800.00, '2026-01-05', 'Emily Davis - Marketing (2 days/week)', true, 'monthly'),
  ('00000000-0000-0000-0000-000000000001', 'cost', 'team', 'Engineering', 6000.00, '2026-01-05', 'James Wilson - Apprentice', true, 'monthly'),

  -- AI Tools costs
  ('00000000-0000-0000-0000-000000000001', 'cost', 'ai_tools', 'OpenAI', 200.00, '2026-01-01', 'GPT-4 subscription', true, 'monthly'),
  ('00000000-0000-0000-0000-000000000001', 'cost', 'ai_tools', 'Anthropic', 180.00, '2026-01-01', 'Claude subscription', true, 'monthly'),

  -- Infrastructure costs
  ('00000000-0000-0000-0000-000000000001', 'cost', 'infrastructure', 'Hosting', 500.00, '2026-01-01', 'Cloud hosting', true, 'monthly'),

  -- Manufacturing costs
  ('00000000-0000-0000-0000-000000000001', 'cost', 'manufacturing', 'Components', 15000.00, '2025-12-15', 'TechFab payment', false);

-- Insert budget targets
INSERT INTO budget_targets (workspace_id, month, category, target_amount) VALUES
  ('00000000-0000-0000-0000-000000000001', '2026-01-01', 'revenue', 40000.00),
  ('00000000-0000-0000-0000-000000000001', '2026-01-01', 'team_cost', 20000.00),
  ('00000000-0000-0000-0000-000000000001', '2026-01-01', 'ai_cost', 500.00),
  ('00000000-0000-0000-0000-000000000001', '2026-01-01', 'cogs', 15000.00),
  ('00000000-0000-0000-0000-000000000001', '2026-02-01', 'revenue', 50000.00),
  ('00000000-0000-0000-0000-000000000001', '2026-02-01', 'team_cost', 22000.00);
