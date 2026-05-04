import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0"

serve(async (req) => {
  try {
    const { order_id } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('seller_id, seller_earnings, status')
      .eq('id', order_id)
      .single()

    if (orderError || !order) throw new Error('Order not found')
    if (order.status === 'delivered') throw new Error('Order already completed')

    // 2. Update seller wallet
    const { data: profile, error: profileError } = await supabase.rpc('increment_wallet_balance', {
      row_id: order.seller_id,
      amount: order.seller_earnings
    })

    // Fallback if RPC doesn't exist yet (we'll add it to migration)
    if (profileError) {
       const { data: currentProfile } = await supabase
         .from('seller_profiles')
         .select('wallet_balance')
         .eq('id', order.seller_id)
         .single()

       await supabase
         .from('seller_profiles')
         .update({ wallet_balance: (currentProfile?.wallet_balance || 0) + order.seller_earnings })
         .eq('id', order.seller_id)
    }

    // 3. Record transaction
    await supabase.from('wallet_transactions').insert({
      seller_id: order.seller_id,
      type: 'credit',
      amount: order.seller_earnings,
      reference_order_id: order_id,
      description: `Earnings from order #${order_id.slice(-6)}`
    })

    // 4. Finalize order status
    const { data: updatedOrder } = await supabase
      .from('orders')
      .update({ status: 'delivered' })
      .eq('id', order_id)
      .select('status')
      .single()

    // Get new balance
    const { data: newProfile } = await supabase
      .from('seller_profiles')
      .select('wallet_balance')
      .eq('id', order.seller_id)
      .single()

    return new Response(
      JSON.stringify({ success: true, new_wallet_balance: newProfile?.wallet_balance }),
      { headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 })
  }
})
