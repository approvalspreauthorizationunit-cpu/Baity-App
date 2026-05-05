begin;
  alter table special_requests add constraint special_requests_customer_desc_key unique (customer_id, description);
  alter table special_request_offers add constraint special_request_offers_request_seller_key unique (request_id, seller_id);
commit;
