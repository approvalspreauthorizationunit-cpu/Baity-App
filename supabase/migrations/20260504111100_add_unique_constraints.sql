begin;
  alter table regions add constraint regions_name_key unique (name);
  alter table products add constraint products_name_seller_id_key unique (name, seller_id);
commit;
