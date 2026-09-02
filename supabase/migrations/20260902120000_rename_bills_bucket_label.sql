-- Rename the first quota bucket from "Bills + Savings" to just "Bills"
-- app-wide. quota_config is the global source of truth for bucket names,
-- read by the rings, the flow, and every legend for every user, so this one
-- row updates the label everywhere. ("+ Savings" was confusing next to the
-- new "Savings" stat tile.)
update public.quota_config set name = 'Bills' where key = 'bills';
