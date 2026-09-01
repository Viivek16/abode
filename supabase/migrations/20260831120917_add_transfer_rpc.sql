-- Allocate money out of a quota into a pot (reallocation: bank -> pot).
-- NOTE: superseded by 20260831131104_multi_tenant_isolation (adds user_id scoping).
create or replace function public.add_transfer(
  p_amount numeric,
  p_pot_id uuid,
  p_quota text,
  p_date date default current_date
)
returns void
language plpgsql
set search_path to ''
as $function$
begin
  insert into public.transfers (entry_date, ym, pot_id, quota_key, amount)
  values (p_date, to_char(p_date, 'YYYY-MM'), p_pot_id, p_quota, p_amount);

  -- Reallocation: money leaves the liquid bank and lands in the target pot.
  update public.pots set current_balance = current_balance + p_amount where id = p_pot_id;
  update public.pots set current_balance = current_balance - p_amount where is_bank;
end;
$function$;
