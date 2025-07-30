// src/services/LocationService.ts
import axios from 'axios';

export const getLocationByPostalCode = async (postalCode: string, countryCode = 'au') => {
  try {
    const url = `https://api.zippopotam.us/${countryCode.toLowerCase()}/${postalCode}`;
    const response = await axios.get(url);

    const data = response.data;
    const place = data.places?.[0];

    return {
      postalCode: data['post code'],
      country: data.country,
      placeName: place['place name'],
      state: place.state,
      latitude: place.latitude,
      longitude: place.longitude,
    };
  } catch (error) {
    console.error('❌ Zippopotam API Error:');
    return null;
  }
};
