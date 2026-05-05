ALTER TABLE seller_profiles
ADD COLUMN is_verified boolean default false,
ADD COLUMN verified_at timestamptz,
ADD COLUMN verified_by uuid references users(id);
