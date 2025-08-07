import axios from "axios";

export const sendParcelToShipday = async (parcelData: any) => {
  console.log({ parcelData });
  try {
    // Send the data to Shipday API
    const response = await axios.post(
      "https://dispatch.shipday.com/orders", // Correct API endpoint

      {
        orderNumber: parcelData.orderNumber,
        customerName: parcelData.customerName,
        customerAddress: parcelData.customerAddress,
        customerEmail: parcelData.customerEmail,
        customerPhoneNumber: parcelData.customerPhoneNumber,
        restaurantName: parcelData.restaurantName,
        restaurantAddress: parcelData.restaurantAddress,
        restaurantPhoneNumber: parcelData.restaurantPhoneNumber,
        totalOrderCost: parcelData.totalOrderCost,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${process.env.SHIPDAY_API_KEY}`, // Your API key
        },
      }
    );

    return response.data; // Return the Shipday response
  } catch (error) {
    console.error("Error sending data to Shipday:", error);
  }
};
