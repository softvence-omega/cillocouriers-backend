// // src/services/LocationService.ts
// import axios from 'axios';

// export const getLocationByPostalCode = async (postalCode: string, countryCode = 'au') => {
//   try {
//     const url = `https://api.zippopotam.us/${countryCode.toLowerCase()}/${postalCode}`;
//     const response = await axios.get(url);

//     const data = response.data;
//     const place = data.places?.[0];

//     return {
//       postalCode: data['post code'],
//       country: data.country,
//       placeName: place['place name'],
//       state: place.state,
//       latitude: place.latitude,
//       longitude: place.longitude,
//     };
//   } catch (error) {
//     console.error('❌ Zippopotam API Error:');
//     return null;
//   }
// };




import axios from 'axios';

export const getLocationByPostalCode = async (postalCode: string, countryCode = 'au', apiKey: string) => {
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${postalCode},${countryCode}&key=${apiKey}`;
    const response = await axios.get(url);

    const data = response.data;
    const result = data.results?.[0];

    // console.log(result);

    // if (result) {
    //   const addressComponents = result.address_components;
    //   const placeName = addressComponents?.find((component: any) =>
    //     component.types.includes('locality')
    //   )?.long_name;
    //   const state = addressComponents?.find((component: any) =>
    //     component.types.includes('administrative_area_level_1')
    //   )?.long_name;
    //   const country = addressComponents?.find((component: any) =>
    //     component.types.includes('country')
    //   )?.long_name;

    //   const geometry = result.geometry.location;
      
    //   return {
    //     postalCode: postalCode, // In Google API, it won't return postal code directly; we use the input
    //     country,
    //     placeName,
    //     state,
    //     latitude: geometry.lat,
    //     longitude: geometry.lng,
    //   };
    // } else {
    //   console.error('❌ No results found for the given postal code.');
    //   return null;
    // }

    return result?.formatted_address
  } catch (error) {
    console.error('❌ Geocoding API Error:', error);
    return null;
  }
};
