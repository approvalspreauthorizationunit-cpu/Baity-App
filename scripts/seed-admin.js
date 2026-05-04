const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY must be set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function seedAdmin() {
  console.log('--- Seeding Admin User ---');

  const adminEmail = 'admin@baiti.app';
  const adminPassword = 'BaitiAdmin2026!';

  // 1. Create user in Supabase Auth
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true
  });

  if (authError) {
    if (authError.message.includes('already registered')) {
       console.log('Admin user already exists in Auth.');
    } else {
       console.error('Error creating admin in Auth:', authError.message);
       return;
    }
  } else {
    console.log('Admin user created in Auth successfully.');
  }

  // Get user ID (either newly created or existing)
  let userId;
  if (authUser?.user) {
    userId = authUser.user.id;
  } else {
    const { data: users } = await supabase.auth.admin.listUsers();
    userId = users.users.find(u => u.email === adminEmail)?.id;
  }

  if (!userId) {
    console.error('Could not find admin user ID');
    return;
  }

  // 2. Insert into users table
  const { error: dbError } = await supabase
    .from('users')
    .upsert({
      id: userId,
      full_name: 'Beiti Admin',
      phone: '+20000000000', // Dummy phone for admin
      role: 'admin',
      is_active: true
    }, { onConflict: 'id' });

  if (dbError) {
    console.error('Error upserting admin in users table:', dbError.message);
  } else {
    console.log('Admin user record upserted in "users" table successfully.');
  }
}

seedAdmin();
