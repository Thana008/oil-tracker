const axios = require('axios');
const { getAllHistory } = require('./services/dataStore');

async function run() {
  try {
    const history = await getAllHistory(90);
    const sliced = history.slice(-180);
    const fuelType = 'diesel_b7';
    const horizonDays = 7;
    console.log(`Sending ${sliced.length} history items...`);
    const response = await axios.post('http://localhost:8000/predict', {
      history: sliced,
      fuelType,
      horizonDays
    });
    console.log('Success:', response.data);
  } catch (err) {
    if (err.response) {
      console.log('Error Data:', err.response.data);
    } else {
      console.log('Error:', err);
    }
  }
}

run();
