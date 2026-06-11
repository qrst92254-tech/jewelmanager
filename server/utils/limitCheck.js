const { supabase } = require('../services/supabase');

const LIMITS = {
  customers: 100,
  quotations: 100,
  repair_orders: 100,
  scheme_plans: 100,
  scheme_enrollments: 100,
  karigars: 50,
  products: 200,
  sales: 500,
  purchase_orders: 200,
  expenses: 500,
  girvi_records: 100,
  suppliers: 50,
};

async function checkLimit(table, userId) {
  const limit = LIMITS[table];
  if (!limit) return { allowed: true };

  const { count, error } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) {
    console.error(`Limit check error for ${table}:`, error);
    return { allowed: true };
  }

  if (count >= limit) {
    return {
      allowed: false,
      message: `You have reached the maximum of ${limit} ${table.replace('_', ' ')} records. Please contact support to increase your limit.`
    };
  }

  return { allowed: true };
}

module.exports = { checkLimit, LIMITS };
