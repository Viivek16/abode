-- Edit / delete existing entries. All user-scoped; pot balances are adjusted by
-- the delta so the ledger stays consistent (mirrors the add_* RPCs).

create or replace function public.update_income(p_id uuid, p_amount numeric, p_source text)
returns void language plpgsql set search_path to '' as $$
declare uid uuid := auth.uid(); old numeric;
begin
  select amount into old from public.income_entries where id = p_id and user_id = uid;
  if old is null then return; end if;
  update public.income_entries
    set amount = p_amount, source_name = p_source, category = p_source
    where id = p_id and user_id = uid;
  update public.pots set current_balance = current_balance + (p_amount - old)
    where is_bank and user_id = uid;
end; $$;

create or replace function public.delete_income(p_id uuid)
returns void language plpgsql set search_path to '' as $$
declare uid uuid := auth.uid(); old numeric;
begin
  select amount into old from public.income_entries where id = p_id and user_id = uid;
  if old is null then return; end if;
  delete from public.income_entries where id = p_id and user_id = uid;
  update public.pots set current_balance = current_balance - old
    where is_bank and user_id = uid;
end; $$;

create or replace function public.update_expense(p_id uuid, p_amount numeric, p_bucket text, p_category text)
returns void language plpgsql set search_path to '' as $$
declare uid uuid := auth.uid(); old numeric;
begin
  select amount into old from public.expense_entries where id = p_id and user_id = uid;
  if old is null then return; end if;
  update public.expense_entries
    set amount = p_amount, bucket_key = p_bucket, category = p_category
    where id = p_id and user_id = uid;
  update public.pots set current_balance = current_balance - (p_amount - old)
    where is_bank and user_id = uid;
end; $$;

create or replace function public.delete_expense(p_id uuid)
returns void language plpgsql set search_path to '' as $$
declare uid uuid := auth.uid(); old numeric;
begin
  select amount into old from public.expense_entries where id = p_id and user_id = uid;
  if old is null then return; end if;
  delete from public.expense_entries where id = p_id and user_id = uid;
  update public.pots set current_balance = current_balance + old
    where is_bank and user_id = uid;
end; $$;

create or replace function public.update_transfer(p_id uuid, p_amount numeric)
returns void language plpgsql set search_path to '' as $$
declare uid uuid := auth.uid(); old numeric; pot uuid;
begin
  select amount, pot_id into old, pot from public.transfers where id = p_id and user_id = uid;
  if old is null then return; end if;
  update public.transfers set amount = p_amount where id = p_id and user_id = uid;
  update public.pots set current_balance = current_balance + (p_amount - old)
    where id = pot and user_id = uid;
  update public.pots set current_balance = current_balance - (p_amount - old)
    where is_bank and user_id = uid;
end; $$;

create or replace function public.delete_transfer(p_id uuid)
returns void language plpgsql set search_path to '' as $$
declare uid uuid := auth.uid(); old numeric; pot uuid;
begin
  select amount, pot_id into old, pot from public.transfers where id = p_id and user_id = uid;
  if old is null then return; end if;
  delete from public.transfers where id = p_id and user_id = uid;
  update public.pots set current_balance = current_balance - old
    where id = pot and user_id = uid;
  update public.pots set current_balance = current_balance + old
    where is_bank and user_id = uid;
end; $$;
