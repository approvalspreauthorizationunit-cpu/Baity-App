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
    { name: 'الزمالك', country: 'Egypt', is_active: true, delivery_fee: 20 },
    { name: 'المنصورة - وسط البلد', country: 'Egypt', is_active: true, delivery_fee: 10 },
    { name: 'دمياط - الجديدة', country: 'Egypt', is_active: true, delivery_fee: 12 }
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
    },
    {
      email: 'seller4@test.com',
      password: 'Test1234!',
      full_name: 'أم كريم',
      phone: '+201444444444',
      kitchen_name: 'مطبخ أم كريم',
      bio: 'متخصصة في الأكلات المنصورية الأصيلة',
      region: 'المنصورة - وسط البلد',
      is_verified: true,
      working_hours: '9:00 ص - 8:00 م',
      products: [
        { name: 'فسيخ وملوحة', price: 45, category: 'أكل بيتي', is_available: true },
        { name: 'طاجن باذنجان باللحمة', price: 80, category: 'أكل بيتي', is_available: true },
        { name: 'رز بالشعرية والكبد', price: 55, category: 'أكل بيتي', is_available: true }
      ]
    },
    {
      email: 'seller5@test.com',
      password: 'Test1234!',
      full_name: 'شيف هدى',
      phone: '+201555555556',
      kitchen_name: 'مطبخ هدى الدمياطي',
      bio: 'أشهى الأكلات الدمياطية التقليدية',
      region: 'دمياط - الجديدة',
      is_verified: false,
      working_hours: '10:00 ص - 9:00 م',
      products: [
        { name: 'جبنة دمياطي طازجة', price: 35, category: 'منتجات', is_available: true },
        { name: 'بط محشي', price: 150, category: 'مشويات', is_available: true },
        { name: 'فتة جمبري', price: 120, category: 'أكل بيتي', is_available: true }
      ]
    }
  ];

  const sellerProfiles = [];

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
      working_hours: s.working_hours || '9:00 ص - 9:00 م',
      is_verified: s.is_verified || false
    }).select().single();

    if (profileError) {
      console.error(`Error creating seller profile for ${s.kitchen_name}:`, profileError.message);
      continue;
    }

    sellerProfiles.push(profile);

    // Seed Products
    const products = s.products.map(p => ({ ...p, seller_id: profile.id }));
    const { error: productsError } = await supabase.from('products').upsert(products, { onConflict: 'name,seller_id' });
    if (productsError) {
      console.error(`Error seeding products for ${s.kitchen_name}:`, productsError.message);
    }
  }

  // 3. Seed Test Customer
  console.log('Processing test customer...');
  const customerData = {
    email: 'customer1@test.com',
    password: 'Test1234!',
    full_name: 'أحمد محمد',
    phone: '+201012345678',
    region: 'المعادي'
  };

  const { data: authCust, error: authCustError } = await supabase.auth.admin.createUser({
    email: customerData.email,
    password: customerData.password,
    email_confirm: true,
    phone: customerData.phone,
    phone_confirm: true
  });

  let custId;
  if (authCustError) {
    if (authCustError.message.includes('already registered')) {
      const { data: users } = await supabase.auth.admin.listUsers();
      custId = users.users.find(u => u.email === customerData.email).id;
    } else {
      console.error('Error creating auth customer:', authCustError.message);
    }
  } else {
    custId = authCust.user.id;
  }

  if (custId) {
    await supabase.from('users').upsert({
      id: custId,
      full_name: customerData.full_name,
      phone: customerData.phone,
      role: 'customer',
      region_id: getRegionId(customerData.region),
      is_active: true
    });
    console.log('Customer seeded.');
  }

  // 4. Seed Test Orders
  console.log('Seeding test orders...');
  const seller1 = sellerProfiles.find(p => p.kitchen_name === 'مطبخ أم أحمد');
  const seller2 = sellerProfiles.find(p => p.kitchen_name === 'مطبخ أم علي');
  const seller4 = sellerProfiles.find(p => p.kitchen_name === 'مطبخ أم كريم');

  if (custId && seller1 && seller2 && seller4) {
    const orders = [
      {
        customer_id: custId,
        seller_id: seller1.id,
        status: 'delivered',
        total_amount: 155,
        seller_earnings: 139.5,
        delivery_fee: 15,
        commission_amount: 15.5,
        delivery_address: 'المعادي، شارع 9',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        customer_id: custId,
        seller_id: seller2.id,
        status: 'preparing',
        total_amount: 195,
        seller_earnings: 175.5,
        delivery_fee: 15,
        commission_amount: 19.5,
        delivery_address: 'المعادي، شارع 9',
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        customer_id: custId,
        seller_id: seller4.id,
        status: 'pending',
        total_amount: 80,
        seller_earnings: 72,
        delivery_fee: 10,
        commission_amount: 8,
        delivery_address: 'المعادي، شارع 9',
        created_at: new Date().toISOString()
      }
    ];

    for (const o of orders) {
      const { data: newOrder, error: orderError } = await supabase.from('orders').upsert(o, { onConflict: 'customer_id,seller_id,created_at' }).select().single();
      if (orderError) {
        console.error('Error seeding order:', orderError.message);
        continue;
      }

      // Add order items for simulation
      if (o.status === 'delivered') {
          // Order 1 items: كشري بيتي x2, ملوخية x1
          const { data: p1 } = await supabase.from('products').select('id').eq('name', 'كشري بيتي').eq('seller_id', seller1.id).single();
          const { data: p2 } = await supabase.from('products').select('id').eq('name', 'ملوخية بالأرانب').eq('seller_id', seller1.id).single();
          if (p1 && p2) {
              await supabase.from('order_items').upsert([
                  { order_id: newOrder.id, product_id: p1.id, quantity: 2, unit_price: 35 },
                  { order_id: newOrder.id, product_id: p2.id, quantity: 1, unit_price: 85 }
              ], { onConflict: 'order_id,product_id' });
          }

          // Add rating for Order 1
          await supabase.from('ratings').upsert({
              order_id: newOrder.id,
              customer_id: custId,
              seller_id: seller1.id,
              score: 5,
              comment: 'أكل رائع وتوصيل سريع'
          }, { onConflict: 'order_id' });
      } else if (o.status === 'preparing') {
          // Order 2 items: كباب مشوي x1, أرز بخاري x1
          const { data: p1 } = await supabase.from('products').select('id').eq('name', 'كباب مشوي').eq('seller_id', seller2.id).single();
          const { data: p2 } = await supabase.from('products').select('id').eq('name', 'أرز بخاري').eq('seller_id', seller2.id).single();
          if (p1 && p2) {
              await supabase.from('order_items').upsert([
                  { order_id: newOrder.id, product_id: p1.id, quantity: 1, unit_price: 110 },
                  { order_id: newOrder.id, product_id: p2.id, quantity: 1, unit_price: 70 }
              ], { onConflict: 'order_id,product_id' });
          }

          // Add second test rating (Previous order)
          await supabase.from('ratings').upsert({
              customer_id: custId,
              seller_id: seller2.id,
              score: 4,
              comment: 'كويس جداً'
          }, { onConflict: 'customer_id,seller_id' });
      } else if (o.status === 'pending') {
          const { data: p1 } = await supabase.from('products').select('id').eq('name', 'طاجن باذنجان باللحمة').eq('seller_id', seller4.id).single();
          if (p1) {
              await supabase.from('order_items').upsert([
                  { order_id: newOrder.id, product_id: p1.id, quantity: 1, unit_price: 80 }
              ], { onConflict: 'order_id,product_id' });
          }
      }
    }
  }

  // 5. Seed Special Request
  console.log('Seeding special request...');
  if (custId) {
    const regionId = getRegionId('المنصورة - وسط البلد');
    await supabase.from('special_requests').upsert({
        customer_id: custId,
        region_id: regionId,
        description: 'عزومة فرح 30 شخص - محتاج كشري ومحشي وسلطة',
        requested_items: [
            { name: 'كشري', quantity: 30 },
            { name: 'محشي', quantity: 10 },
            { name: 'سلطة', quantity: 10 }
        ],
        delivery_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'open'
    }, { onConflict: 'customer_id,description' });
  }

  console.log('--- Seeding Complete ---');
}

seed();
