create or replace function increment_wallet_balance(row_id uuid, amount numeric)
returns void as $$
begin
  update seller_profiles
  set wallet_balance = wallet_balance + amount
  where id = row_id;
end;
$$ language plpgsql security definer;

create or replace function decrement_wallet_balance(row_id uuid, amount numeric)
returns void as $$
begin
  update seller_profiles
  set wallet_balance = wallet_balance - amount
  where id = row_id;
end;
$$ language plpgsql security definer;
