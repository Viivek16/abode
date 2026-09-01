# Supabase migrations

Applied to project `jizrzsaosmuhdqslgnqm`. Full history (`list_migrations`):

| Version | Name | In this folder? |
|---|---|---|
| 20260830155900 | init_schema | No — predates this record (Supabase history) |
| 20260830155923 | seed_quota_and_pots | No — predates this record |
| 20260830160124 | add_entry_rpcs | No — predates this record |
| 20260831120917 | add_transfer_rpc | ✅ |
| 20260831131104 | multi_tenant_isolation | ✅ |
| 20260831131700 | harden_rls_auto_enable | ✅ |

The first three were applied directly (dashboard/agent) before migrations were
tracked here; their exact SQL is not reproduced to avoid guessing. The live DB
is the source of truth. The three recorded files contain the exact SQL applied.
