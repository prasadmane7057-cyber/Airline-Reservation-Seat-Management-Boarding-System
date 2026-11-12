const { supabase } = require('../lib/supabaseClient');

async function getAirports(req, res, next) {
  try {
    const { data, error } = await supabase.from('airports').select('*').order('city');
    if (error) throw error;
    return res.json({ success: true, count: data.length, airports: data });
  } catch (err) {
    next(err);
  }
}

async function createAirport(req, res, next) {
  try {
    const { airport_code, airport_name, city, country = 'India' } = req.body;
    if (!airport_code?.trim() || !airport_name?.trim() || !city?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Airport code, name, and city are required.'
      });
    }
    const { data, error } = await req.supabase
      .from('airports')
      .insert({
        airport_code: airport_code.toUpperCase().trim(),
        airport_name: airport_name.trim(),
        city: city.trim(),
        country: country.trim()
      })
      .select()
      .single();
    if (error) throw error;
    return res.status(201).json({ success: true, airport: data });
  } catch (err) {
    next(err);
  }
}

async function updateAirport(req, res, next) {
  try {
    const allowed = ['airport_code', 'airport_name', 'city', 'country'];
    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([key, value]) => allowed.includes(key) && value !== undefined)
    );
    if (updates.airport_code) updates.airport_code = updates.airport_code.toUpperCase().trim();
    const { data, error } = await req.supabase
      .from('airports')
      .update(updates)
      .eq('id', req.params.id)
      .select('id')
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, message: 'Airport not found.' });
    return res.json({ success: true, message: 'Airport updated successfully.' });
  } catch (err) {
    next(err);
  }
}

async function deleteAirport(req, res, next) {
  try {
    const { data, error } = await req.supabase
      .from('airports')
      .delete()
      .eq('id', req.params.id)
      .select('id')
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, message: 'Airport not found.' });
    return res.json({ success: true, message: 'Airport removed successfully.' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAirports,
  createAirport,
  updateAirport,
  deleteAirport
};
