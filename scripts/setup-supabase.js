const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY must be set in .env.local');
  process.exit(1);
}

async function setup() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('--- Creating Storage Buckets ---');
  const buckets = [
    { name: 'seller-documents', public: false, fileSizeLimit: 5242880, allowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf'] },
    { name: 'product-images', public: true, fileSizeLimit: 2097152, allowedMimeTypes: ['image/jpeg', 'image/png'] },
    { name: 'avatars', public: true, fileSizeLimit: 1048576, allowedMimeTypes: ['image/jpeg', 'image/png'] }
  ];

  for (const b of buckets) {
    const { data, error } = await supabase.storage.createBucket(b.name, {
      public: b.public,
      fileSizeLimit: b.fileSizeLimit,
      allowedMimeTypes: b.allowedMimeTypes
    });
    if (error) {
      if (error.message.includes('already exists')) {
        console.log(`Bucket "${b.name}" already exists.`);
      } else {
        console.error(`Error creating bucket "${b.name}":`, error.message);
      }
    } else {
      console.log(`Bucket "${b.name}" created successfully.`);
    }
  }

  console.log('--- Enabling Realtime ---');
  console.log('Realtime enabled via database migrations.');
}

setup();
