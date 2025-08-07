// import axios from 'axios';

// interface LocationData {
//   postalCode: string;
//   city: string;
//   state: string;
//   country: string;
//   latitude: number;
//   longitude: number;
//   formattedAddress: string;
// }

// export const getFormattedLocation = async (
//   postalCode: string,
//   countryCode = 'au',
//   apiKey: string
// ): Promise<LocationData | null> => {
//   try {
//     const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${postalCode},${countryCode}&key=${apiKey}`;
//     const response = await axios.get(url);

//     const result = response.data.results?.[0];

//     if (!result) {
//       console.error('❌ No results found for the given postal code.');
//       return null;
//     }

//     const addressComponents = result.address_components;

//     const getComponent = (type: string) =>
//       addressComponents.find((component: any) => component.types.includes(type))?.long_name || '';

//     const city = getComponent('locality');
//     const state = getComponent('administrative_area_level_1');
//     const country = getComponent('country');
//     const geometry = result.geometry.location;

//     const locationData: LocationData = {
//       postalCode,
//       city,
//       state,
//       country,
//       latitude: geometry.lat,
//       longitude: geometry.lng,
//       formattedAddress: result.formatted_address,
//     };

//     return locationData;
//   } catch (error) {
//     console.error('❌ Geocoding API Error:', error);
//     return null;
//   }
// };


import axios from 'axios';

interface LocationData {
  postalCode: string;
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  formattedAddress: string;
  street: string;
}

export const getFormattedLocation = async (
  postalCode: string,
  countryCode = 'au',
  apiKey: string
): Promise<LocationData | null> => {
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${postalCode},${countryCode}&key=${apiKey}`;
    const response = await axios.get(url);

    const result = response.data.results?.[0];

    if (!result) {
      console.error('❌ No results found for the given postal code.');
      return null;
    }

    const addressComponents = result.address_components;

    const getComponent = (type: string) =>
      addressComponents.find((component: any) => component.types.includes(type))?.long_name || '';

    const streetNumber = getComponent('street_number');
    const route = getComponent('route');
    const street = `${streetNumber} ${route}`.trim();

    const city = getComponent('locality') || getComponent('postal_town'); // fallback
    const state = getComponent('administrative_area_level_1');
    const country = getComponent('country');
    const geometry = result.geometry.location;

    const locationData: LocationData = {
      postalCode,
      city,
      state,
      country,
      latitude: geometry.lat,
      longitude: geometry.lng,
      formattedAddress: result.formatted_address,
      street,
    };

    return locationData;
  } catch (error) {
    console.error('❌ Geocoding API Error:', error);
    return null;
  }
};
