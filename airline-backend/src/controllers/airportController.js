const airportStore = require('../utils/airportStore');

function getAirports(req, res, next) {
  try {
    const airports = airportStore.getAllAirports();
    return res.json({
      success: true,
      count: airports.length,
      airports
    });
  } catch (err) {
    next(err);
  }
}

function createAirport(req, res, next) {
  try {
    const { airport_code, airport_name, city, country } = req.body;
    if (!airport_code || !airport_name || !city) {
      return res.status(400).json({ success: false, message: 'Airport code, name, and city are required.' });
    }
    const airports = airportStore.getAllAirports();
    const newAirport = {
      id: airports.length + 1,
      airport_code: airport_code.toUpperCase().trim(),
      airport_name: airport_name.trim(),
      city: city.trim(),
      country: country || 'India',
      status: 'Active'
    };
    airports.push(newAirport);
    return res.status(201).json({ success: true, message: 'Airport created successfully.', airport: newAirport });
  } catch (err) {
    next(err);
  }
}

function updateAirport(req, res, next) {
  try {
    const id = req.params.id;
    const airports = airportStore.getAllAirports();
    const idx = airports.findIndex(a => String(a.id) === String(id) || a.airport_code === id.toUpperCase());
    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Airport not found.' });
    }
    airports[idx] = { ...airports[idx], ...req.body };
    return res.json({ success: true, message: 'Airport updated successfully.', airport: airports[idx] });
  } catch (err) {
    next(err);
  }
}

function deleteAirport(req, res, next) {
  try {
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
