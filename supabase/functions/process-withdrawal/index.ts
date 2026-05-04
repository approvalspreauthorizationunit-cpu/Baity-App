import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0"

serve(async (req) => {
  try {
    const { withdrawal_request_id, transaction_reference } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Get withdrawal details
    const { data: request, error: requestError } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .eq('id', withdrawal_request_id)
      .single()

    if (requestError || !request) throw new Error('Withdrawal request not found')
    if (request.status === 'completed') throw new Error('Withdrawal already processed')

    // 2. Deduct from seller wallet
    const { data: profile, error: profileError } = await supabase.rpc('decrement_wallet_balance', {
      row_id: request.seller_id,
      amount: request.amount
    })

    // Fallback if RPC doesn't exist
    if (profileError) {
       const { data: currentProfile } = await supabase
         .from('seller_profiles')
         .select('wallet_balance')
         .eq('id', request.seller_id)
         .single()

       await supabase
         .from('seller_profiles')
         .update({ wallet_balance: (currentProfile?.wallet_balance || 0) - request.amount })
         .eq('id', request.seller_id)
    }

    // 3. Update request status
    await supabase
      .from('withdrawal_requests')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        transaction_reference
      })
      .eq('id', withdrawal_request_id)

    // 4. Record transaction
    await supabase.from('wallet_transactions').insert({
      seller_id: request.seller_id,
      type: 'debit',
      amount: request.amount,
      description: `Withdrawal payout: ${transaction_reference}`
    })

    // Get new balance
    const { data: newProfile } = await supabase
      .from('seller_profiles')
      .select('wallet_balance')
      .eq('id', request.seller_id)
      .single()

    return new Response(
      JSON.stringify({ success: true, new_wallet_balance: newProfile?.wallet_balance }),
      { headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 })
  }
})
