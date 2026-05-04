import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0"

serve(async (req) => {
  try {
    const { seller_id, region_id, subtotal } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Get commission rate
    let commission_rate = 10
    const { data: seller } = await supabase
      .from('seller_profiles')
      .select('commission_rate')
      .eq('id', seller_id)
      .single()

    if (seller?.commission_rate !== undefined) {
      commission_rate = seller.commission_rate
    } else {
      const { data: setting } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('key', 'default_commission_rate')
        .single()
      if (setting) commission_rate = parseFloat(setting.value)
    }

    // 2. Get delivery fee
    let delivery_fee = 15
    const { data: region } = await supabase
      .from('regions')
      .select('delivery_fee')
      .eq('id', region_id)
      .single()

    if (region?.delivery_fee !== undefined) {
      delivery_fee = region.delivery_fee
    } else {
      const { data: setting } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('key', 'default_delivery_fee')
        .single()
      if (setting) delivery_fee = parseFloat(setting.value)
    }

    const commission_amount = subtotal * (commission_rate / 100)
    const seller_earnings = subtotal - commission_amount
    const total = subtotal + delivery_fee

    return new Response(
      JSON.stringify({
        delivery_fee,
        commission_rate,
        commission_amount,
        seller_earnings,
        total
      }),
      { headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 })
  }
})
