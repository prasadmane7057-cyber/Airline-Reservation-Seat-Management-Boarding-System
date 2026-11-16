function airportDataUnavailable(req, res) {
  return res.status(501).json({
    success: false,
    message: 'Airport APIs are unavailable because the current Supabase schema has no airports table.'
  });
}

module.exports = {
  getAirports: airportDataUnavailable,
  createAirport: airportDataUnavailable,
  updateAirport: airportDataUnavailable,
  deleteAirport: airportDataUnavailable
};
