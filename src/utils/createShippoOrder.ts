import axios from "axios";

export const createShippoOrder = async (orderData:any) => {
  // console.log(orderData);
  const shippoAPIUrl = 'https://api.goshippo.com/orders/';

  try {
    // Step 1: Call the Shippo API to create the order
    const response = await axios.post(
      shippoAPIUrl,
      orderData,
      {
        headers: {
          'Authorization': `ShippoToken ${process.env.SHIPPO_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    // Step 2: If the Shippo API request is successful, store the order in Prisma
     } catch (error) {
    console.error("Error creating order:", error);
    throw new Error('Error creating order');
  }
};