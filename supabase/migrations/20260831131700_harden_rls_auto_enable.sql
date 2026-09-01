-- Security hardening: the DDL helper should not be callable via the public API.
revoke execute on function public.rls_auto_enable() from anon, authenticated;
