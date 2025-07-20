declare module 'sslcommerz-lts' {
    class SSLCommerzPayment {
      store_id: string;
      store_passwd: string;
      is_live: boolean;
  
      // eslint-disable-next-line no-unused-vars
      constructor(store_id: string, store_passwd: string, is_live: boolean);
  
      // Method to initialize the payment
      // eslint-disable-next-line no-unused-vars
      init(data: PaymentData): Promise<APIResponse>;
  
      // Optionally, you can define other methods if needed based on the API documentation
    }
  
    // Type for the data parameter in init method
    interface PaymentData {
        total_amount: string;
        currency: string;
        tran_id: string;
        success_url: string;
        fail_url: string;
        cancel_url: string;
        ipn_url: string;
        shipping_method: string;
        product_name: string;
        product_category: string;
        product_profile: string;
        cus_name: string;
        cus_email: string;
        cus_add1: string;
        cus_add2: string;
        cus_city: string;
        cus_state: string;
        cus_postcode: string;
        cus_country: string;
        cus_phone: string;
        cus_fax: string;
        ship_name: string;
        ship_add1: string;
        ship_add2: string;
        ship_city: string;
        ship_state: string;
        ship_postcode: number; // Ensure it's string here
        ship_country: string;
      }
      
  
    // Type for the API response from the init method
    interface APIResponse {
      GatewayPageURL: string;
      // You can add more response attributes based on the API documentation
    }
  
    export = SSLCommerzPayment;
  }
  