begin;
  alter table orders replica identity full;
  alter table special_request_offers replica identity full;
  alter table withdrawal_requests replica identity full;
  alter publication supabase_realtime add table orders, special_request_offers, withdrawal_requests;
commit;
