-- REGIONS
create table regions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country text not null default 'Egypt',
  is_active boolean default false,
  delivery_fee numeric default 0,
  created_at timestamptz default now()
);

-- USERS
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text unique not null,
  role text check (role in ('customer', 'seller', 'admin')) not null,
  region_id uuid references regions(id),
  avatar_url text,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- SELLER PROFILES
create table seller_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references users(id) on delete cascade,
  kitchen_name text,
  bio text,
  working_hours text,
  national_id_front_url text,
  national_id_back_url text,
  health_certificate_url text,
  health_certificate_expiry date,
  status text check (status in ('pending', 'needs_info', 'approved', 'suspended')) default 'pending',
  rejection_reason text,
  commission_rate numeric default 10,
  region_id uuid references regions(id),
  wallet_balance numeric default 0,
  created_at timestamptz default now()
);

-- PRODUCTS
create table products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid references seller_profiles(id) on delete cascade,
  name text not null,
  description text,
  price numeric not null,
  category text,
  image_url text,
  is_available boolean default true,
  created_at timestamptz default now()
);

-- ORDERS
create table orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references users(id),
  seller_id uuid references seller_profiles(id),
  status text check (status in ('pending','accepted','preparing','ready','delivered','cancelled')) default 'pending',
  total_amount numeric not null,
  delivery_fee numeric default 0,
  commission_amount numeric default 0,
  seller_earnings numeric default 0,
  delivery_address text,
  scheduled_time timestamptz,
  donation_amount numeric default 0,
  donation_type text check (donation_type in ('money','meal')),
  notes text,
  created_at timestamptz default now()
);

-- ORDER ITEMS
create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  product_id uuid references products(id),
  quantity int not null,
  unit_price numeric not null
);

-- SPECIAL REQUESTS
create table special_requests (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references users(id),
  region_id uuid references regions(id),
  description text not null,
  requested_items jsonb,
  delivery_date date not null,
  status text check (status in ('open','closed','cancelled')) default 'open',
  created_at timestamptz default now()
);

-- SPECIAL REQUEST OFFERS
create table special_request_offers (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references special_requests(id) on delete cascade,
  seller_id uuid references seller_profiles(id),
  price numeric not null,
  notes text,
  status text check (status in ('pending','accepted','rejected')) default 'pending',
  created_at timestamptz default now()
);

-- WALLET TRANSACTIONS
create table wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid references seller_profiles(id),
  type text check (type in ('credit','debit')) not null,
  amount numeric not null,
  reference_order_id uuid references orders(id),
  description text,
  created_at timestamptz default now()
);

-- WITHDRAWAL REQUESTS
create table withdrawal_requests (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid references seller_profiles(id),
  amount numeric not null,
  status text check (status in ('pending','completed','rejected')) default 'pending',
  payment_method text,
  transaction_reference text,
  admin_note text,
  created_at timestamptz default now(),
  completed_at timestamptz
);

-- RATINGS
create table ratings (
  id uuid primary key default gen_random_uuid(),
  order_id uuid unique references orders(id),
  customer_id uuid references users(id),
  seller_id uuid references seller_profiles(id),
  score int check (score between 1 and 5),
  comment text,
  created_at timestamptz default now()
);

-- PLATFORM SETTINGS
create table platform_settings (
  key text primary key,
  value text not null,
  description text
);

insert into platform_settings (key, value, description) values
('default_commission_rate', '10', 'Default commission percentage'),
('min_withdrawal_amount', '100', 'Minimum wallet balance to request withdrawal'),
('default_delivery_fee', '15', 'Default delivery fee in EGP');

alter table users enable row level security;
alter table seller_profiles enable row level security;
alter table products enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table special_requests enable row level security;
alter table special_request_offers enable row level security;
alter table wallet_transactions enable row level security;
alter table withdrawal_requests enable row level security;
alter table ratings enable row level security;
alter table regions enable row level security;
alter table platform_settings enable row level security;

-- USERS
create policy "Users can read own profile" on users for select using (auth.uid() = id);
create policy "Users can update own profile" on users for update using (auth.uid() = id);
create policy "Admin full access on users" on users for all using (
  exists (select 1 from users where id = auth.uid() and role = 'admin')
);

-- SELLER PROFILES
create policy "Public can view approved sellers" on seller_profiles for select using (status = 'approved');
create policy "Seller can view own profile" on seller_profiles for select using (user_id = auth.uid());
create policy "Seller can update own profile" on seller_profiles for update using (user_id = auth.uid());
create policy "Admin full access on seller_profiles" on seller_profiles for all using (
  exists (select 1 from users where id = auth.uid() and role = 'admin')
);

-- PRODUCTS
create policy "Public can view available products" on products for select using (is_available = true);
create policy "Seller manages own products" on products for all using (
  seller_id in (select id from seller_profiles where user_id = auth.uid() and status = 'approved')
);
create policy "Admin full access on products" on products for all using (
  exists (select 1 from users where id = auth.uid() and role = 'admin')
);

-- ORDERS
create policy "Customer views own orders" on orders for select using (customer_id = auth.uid());
create policy "Seller views own orders" on orders for select using (
  seller_id in (select id from seller_profiles where user_id = auth.uid())
);
create policy "Customer creates order" on orders for insert with check (customer_id = auth.uid());
create policy "Seller updates order status" on orders for update using (
  seller_id in (select id from seller_profiles where user_id = auth.uid())
);
create policy "Admin full access on orders" on orders for all using (
  exists (select 1 from users where id = auth.uid() and role = 'admin')
);

-- SPECIAL REQUESTS
create policy "Customer creates special request" on special_requests
  for insert with check (customer_id = auth.uid());
create policy "Customer views own requests" on special_requests
  for select using (customer_id = auth.uid());
create policy "Approved sellers view open requests in region" on special_requests
  for select using (
    exists (
      select 1 from seller_profiles
      where user_id = auth.uid()
      and status = 'approved'
      and region_id = special_requests.region_id
    )
  );

-- SPECIAL REQUEST OFFERS
create policy "Seller creates offer" on special_request_offers
  for insert with check (
    seller_id in (select id from seller_profiles where user_id = auth.uid() and status = 'approved')
  );
create policy "Customer views offers on own request" on special_request_offers
  for select using (
    request_id in (select id from special_requests where customer_id = auth.uid())
  );
create policy "Seller views own offers" on special_request_offers
  for select using (
    seller_id in (select id from seller_profiles where user_id = auth.uid())
  );

-- WALLET TRANSACTIONS
create policy "Seller views own wallet transactions" on wallet_transactions
  for select using (
    seller_id in (select id from seller_profiles where user_id = auth.uid())
  );
create policy "Admin full access on wallet" on wallet_transactions for all using (
  exists (select 1 from users where id = auth.uid() and role = 'admin')
);

-- WITHDRAWAL REQUESTS
create policy "Seller manages own withdrawal requests" on withdrawal_requests
  for all using (
    seller_id in (select id from seller_profiles where user_id = auth.uid())
  );
create policy "Admin full access on withdrawals" on withdrawal_requests for all using (
  exists (select 1 from users where id = auth.uid() and role = 'admin')
);

-- REGIONS
create policy "Public can view active regions" on regions for select using (is_active = true);
create policy "Admin full access on regions" on regions for all using (
  exists (select 1 from users where id = auth.uid() and role = 'admin')
);

-- PLATFORM SETTINGS
create policy "Admin full access on settings" on platform_settings for all using (
  exists (select 1 from users where id = auth.uid() and role = 'admin')
);
