const { supabaseAdmin } = require('./supabase');

const METALS = ['gold_24k', 'gold_22k', 'gold_18k', 'silver'];

async function getUserRates(userId) {
  try {
    const { data, error } = await supabaseAdmin
      .from('price_cache')
      .select('metal, price, updated_date')
      .eq('user_id', userId)
      .in('metal', METALS);

    if (error) {
      console.error('[PriceService] getUserRates error:', error.message);
      return buildEmptyRates();
    }

    if (!data || data.length === 0) {
      return buildEmptyRates();
    }

    const rates = buildEmptyRates();
    for (const row of data) {
      if (METALS.includes(row.metal)) {
        rates[row.metal] = row.price;
        rates.updated_date = row.updated_date || null;
      }
    }
    return rates;
  } catch (err) {
    console.error('[PriceService] getUserRates exception:', err.message);
    return buildEmptyRates();
  }
}

async function saveUserRates(userId, rates) {
  try {
    const today = new Date().toISOString().split('T')[0];

    const rows = METALS.map(metal => ({
      user_id: userId,
      metal,
      city: 'Chennai',
      currency: 'INR',
      price: rates[metal] ? parseFloat(rates[metal]) : null,
      source: 'manual',
      updated_date: today,
      fetched_at: new Date().toISOString(),
      timestamp: new Date().toISOString(),
    }));

    const { error: deleteError } = await supabaseAdmin
      .from('price_cache')
      .delete()
      .eq('user_id', userId)
      .in('metal', METALS);

    if (deleteError) {
      console.error('[PriceService] delete error:', deleteError.message);
      return { success: false, message: deleteError.message };
    }

    const { error: insertError } = await supabaseAdmin
      .from('price_cache')
      .insert(rows);

    if (insertError) {
      console.error('[PriceService] insert error:', insertError.message);
      return { success: false, message: insertError.message };
    }

    return { success: true };
  } catch (err) {
    console.error('[PriceService] saveUserRates exception:', err.message);
    return { success: false, message: err.message };
  }
}

function buildEmptyRates() {
  return { gold_24k: null, gold_22k: null, gold_18k: null, silver: null, updated_date: null };
}

module.exports = { getUserRates, saveUserRates };
