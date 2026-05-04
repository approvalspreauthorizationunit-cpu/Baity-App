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

async function seed() {
  console.log('--- Seeding Test Data ---');

  // 1. Seed Regions
  const regions = [
    { name: 'المعادي', country: 'Egypt', is_active: true, delivery_fee: 15 },
    { name: 'مدينة نصر', country: 'Egypt', is_active: true, delivery_fee: 15 },
    { name: 'الزمالك', country: 'Egypt', is_active: true, delivery_fee: 20 }
  ];

  const { data: seededRegions, error: regionsError } = await supabase
    .from('regions')
    .upsert(regions, { onConflict: 'name' })
    .select();

  if (regionsError) {
    console.error('Error seeding regions:', regionsError.message);
    return;
  }
  console.log('Regions seeded.');

  const getRegionId = (name) => seededRegions.find(r => r.name === name).id;

  // 2. Seed Sellers
  const sellersData = [
    {
      email: 'seller1@test.com',
      password: 'Test1234!',
      full_name: 'أم أحمد',
      phone: '+201111111111',
      kitchen_name: 'مطبخ أم أحمد',
      bio: 'متخصصة في الأكل البيتي المصري الأصيل',
      region: 'المعادي',
      products: [
        { name: 'كشري بيتي', price: 35, category: 'كشري', is_available: true },
        { name: 'ملوخية بالأرانب', price: 85, category: 'أكل بيتي', is_available: true },
        { name: 'محشي كرنب ورز', price: 75, category: 'أكل بيتي', is_available: true },
        { name: 'فتة لحمة', price: 95, category: 'أكل بيتي', is_available: true }
      ]
    },
    {
      email: 'seller2@test.com',
      password: 'Test1234!',
      full_name: 'أم علي',
      phone: '+201222222222',
      kitchen_name: 'مطبخ أم علي',
      bio: 'أشهى المأكولات الشامية والمصرية',
      region: 'مدينة نصر',
      products: [
        { name: 'كباب مشوي', price: 110, category: 'مشويات', is_available: true },
        { name: 'كفتة بالصلصة', price: 90, category: 'مشويات', is_available: true },
        { name: 'فراخ مشوية', price: 95, category: 'مشويات', is_available: true },
        { name: 'أرز بخاري', price: 70, category: 'أكل بيتي', is_available: true }
      ]
    },
    {
      email: 'seller3@test.com',
      password: 'Test1234!',
      full_name: 'شيف مريم',
      phone: '+201333333333',
      kitchen_name: 'مطبخ مريم',
      bio: 'متخصصة في الحلويات الشرقية والكيك',
      region: 'الزمالك',
      products: [
        { name: 'كنافة بالقشطة', price: 65, category: 'حلويات', is_available: true },
        { name: 'بسبوسة بالمكسرات', price: 55, category: 'حلويات', is_available: true },
        { name: 'كيك الشوكولاتة', price: 120, category: 'حلويات', is_available: true },
        { name: 'أم علي', price: 60, category: 'حلويات', is_available: true }
      ]
    }
  ];

  for (const s of sellersData) {
    console.log(`Processing seller: ${s.full_name}`);

    // Create Auth User
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: s.email,
      password: s.password,
      email_confirm: true,
      phone: s.phone,
      phone_confirm: true
    });

    let userId;
    if (authError) {
      if (authError.message.includes('already registered')) {
        const { data: users } = await supabase.auth.admin.listUsers();
        userId = users.users.find(u => u.email === s.email).id;
      } else {
        console.error(`Error creating auth user for ${s.email}:`, authError.message);
        continue;
      }
    } else {
      userId = authUser.user.id;
    }

    // Create User record
    await supabase.from('users').upsert({
      id: userId,
      full_name: s.full_name,
      phone: s.phone,
      role: 'seller',
      region_id: getRegionId(s.region),
      is_active: true
    });

    // Create Seller Profile
    const { data: profile, error: profileError } = await supabase.from('seller_profiles').upsert({
      user_id: userId,
      kitchen_name: s.kitchen_name,
      bio: s.bio,
      status: 'approved',
      commission_rate: 10,
      region_id: getRegionId(s.region),
      wallet_balance: 0,
      working_hours: s.working_hours || '9:00 ص - 9:00 م'
    }).select().single();

    if (profileError) {
      console.error(`Error creating seller profile for ${s.kitchen_name}:`, profileError.message);
      continue;
    }

    // Seed Products
    const products = s.products.map(p => ({ ...p, seller_id: profile.id }));
    const { error: productsError } = await supabase.from('products').upsert(products, { onConflict: 'name,seller_id' });
    if (productsError) {
      console.error(`Error seeding products for ${s.kitchen_name}:`, productsError.message);
    }
  }

  // 3. Seed Test Customer
  console.log('Processing test customer...');
  const customer = {
    email: 'customer1@test.com',
    password: 'Test1234!',
    full_name: 'أحمد محمد',
    phone: '+201012345678',
    region: 'المعادي'
  };

  const { data: authCust, error: authCustError } = await supabase.auth.admin.createUser({
    email: customer.email,
    password: customer.password,
    email_confirm: true,
    phone: customer.phone,
    phone_confirm: true
  });

  let custId;
  if (authCustError) {
    if (authCustError.message.includes('already registered')) {
      const { data: users } = await supabase.auth.admin.listUsers();
      custId = users.users.find(u => u.email === customer.email).id;
    } else {
      console.error('Error creating auth customer:', authCustError.message);
    }
  } else {
    custId = authCust.user.id;
  }

  if (custId) {
    await supabase.from('users').upsert({
      id: custId,
      full_name: customer.full_name,
      phone: customer.phone,
      role: 'customer',
      region_id: getRegionId(customer.region),
      is_active: true
    });
    console.log('Customer seeded.');
  }

  // 4. Seed Pending Seller
  console.log('Processing test pending seller...');
  const pendingSeller = {
    email: 'pending_seller@test.com',
    password: 'Test1234!',
    full_name: 'سارة خالد',
    phone: '+201555555555',
    kitchen_name: 'مطبخ سارة',
    region: 'المعادي'
  };

  const { data: authPending, error: authPendingError } = await supabase.auth.admin.createUser({
    email: pendingSeller.email,
    password: pendingSeller.password,
    email_confirm: true,
    phone: pendingSeller.phone,
    phone_confirm: true
  });

  let pendingId;
  if (authPendingError) {
    if (authPendingError.message.includes('already registered')) {
      const { data: users } = await supabase.auth.admin.listUsers();
      pendingId = users.users.find(u => u.email === pendingSeller.email).id;
    } else {
      console.error('Error creating auth pending seller:', authPendingError.message);
    }
  } else {
    pendingId = authPending.user.id;
  }

  if (pendingId) {
    await supabase.from('users').upsert({
      id: pendingId,
      full_name: pendingSeller.full_name,
      phone: pendingSeller.phone,
      role: 'seller',
      region_id: getRegionId(pendingSeller.region),
      is_active: true
    });

    await supabase.from('seller_profiles').upsert({
      user_id: pendingId,
      kitchen_name: pendingSeller.kitchen_name,
      status: 'pending',
      region_id: getRegionId(pendingSeller.region)
    });
    console.log('Pending seller seeded.');
  }

  // 5. Seed Special Request & Offer
  console.log('Seeding special request and offer...');
  const { data: customerUser } = await supabase.from('users').select('id, region_id').eq('phone', '+201012345678').single();
  const { data: seller1Profile } = await supabase.from('seller_profiles').select('id').eq('kitchen_name', 'مطبخ أم أحمد').single();

  if (customerUser && seller1Profile) {
    // Check if request already exists
    let { data: request } = await supabase
        .from('special_requests')
        .select('id')
        .eq('customer_id', customerUser.id)
        .eq('description', 'عزومة عيد ميلاد 15 شخص')
        .single();

    if (!request) {
        const { data: newReq, error: reqError } = await supabase.from('special_requests').insert({
            customer_id: customerUser.id,
            region_id: customerUser.region_id,
            description: 'عزومة عيد ميلاد 15 شخص',
            requested_items: [
                { name: 'كشري', quantity: 15 },
                { name: 'سلطة خضراء', quantity: 5 }
            ],
            delivery_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'open'
        }).select().single();

        if (reqError) console.error('Error seeding request:', reqError.message);
        request = newReq;
    }

    if (request) {
        // Check if offer exists
        const { data: offer } = await supabase
            .from('special_request_offers')
            .select('id')
            .eq('request_id', request.id)
            .eq('seller_id', seller1Profile.id)
            .single();

        if (!offer) {
            const { error: offerError } = await supabase.from('special_request_offers').insert({
                request_id: request.id,
                seller_id: seller1Profile.id,
                price: 450,
                notes: 'يشمل التوصيل والأطباق',
                status: 'pending'
            });

            if (offerError) console.error('Error seeding offer:', offerError.message);
        }
    }
  }

  console.log('--- Seeding Complete ---');
}

seed();
