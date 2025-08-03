const addCarrier = async (data: {
  name: string;
  email: string;
  phoneNumber: string;
}) => {
  console.log("Add Carrier...", data);

  const url = 'https://api.shipday.com/carriers';
  const options = {
    method: 'POST',
    headers: {
      accept: 'application/json',
      Authorization: `Basic ${process.env.SHIPDAY_API_KEY}`, 
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      name: data.name,
      email: data.email,
      phoneNumber: data.phoneNumber,
    }),
  };

  try {
    const response = await fetch(url, options);
    const result = await response.json();
    console.log("Carrier Created:", result);
    return result;
  } catch (error) {
    console.error("Error creating carrier:", error);
    throw error;
  }
};

const getCarriers = async () => {
  const url = 'https://api.shipday.com/carriers';

  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      Authorization: `Basic ${process.env.SHIPDAY_API_KEY}`, 
    },
  };

  try {
    const response = await fetch(url, options);
    const result = await response.json();
    console.log("All Carriers:", result);
    return result;
  } catch (error) {
    console.error("Error fetching carriers:", error);
    throw error;
  }
};


const assignOrderToCarrier = async (orderId: string, carrierId: string) => {
  const url = `https://api.shipday.com/orders/assign/${orderId}/${carrierId}`;

  const options = {
    method: 'PUT',
    headers: {
      accept: 'application/json',
      Authorization: `Basic ${process.env.SHIPDAY_API_KEY}`, 
    },
  };

  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Assign API Error:", errorText);
      throw new Error(`Assign Error (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    console.log("Order Assigned:", result);
    return result;
  } catch (error) {
    console.error("Error assigning order:", error);
    throw error;
  }
};
const unassignOrderToCarrier = async (orderId: string) => {
  const url = `https://api.shipday.com/orders/unassign/${orderId}`;

  const options = {
    method: 'PUT',
    headers: {
      accept: 'application/json',
      Authorization: `Basic ${process.env.SHIPDAY_API_KEY}`, 
    },
  };

  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Assign API Error:", errorText);
      throw new Error(`Assign Error (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    console.log("Order Assigned:", result);
    return result;
  } catch (error) {
    console.error("Error assigning order:", error);
    throw error;
  }
};



export const CarrierService = {
  addCarrier,
  getCarriers,
  assignOrderToCarrier,
  unassignOrderToCarrier
};
