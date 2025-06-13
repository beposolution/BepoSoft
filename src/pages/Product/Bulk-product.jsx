import { useEffect, useState } from "react";
import axios from "axios";
const API_BASE_URL = import.meta.env.VITE_APP_KEY;
const token = localStorage.getItem("token");

const OrdersComponent = () => {
  const [shopifyOrders, setShopifyOrders] = useState([]);
  const [states, setStates] = useState([]); // Store state list

  useEffect(() => {
    fetchStates();
    fetchShopifyOrders();
  }, []);

  // Step 1: Fetch State List from API
  const fetchStates = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}states/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 200) {
        setStates(response.data.data); // Store states in state variable
      }
    } catch (error) {
      console.error("Error fetching states:", error);
    }
  };

  // Step 2: Fetch Shopify Orders (Limit to 10)
  const fetchShopifyOrders = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}shopify/orders/?limit=10`);
      const orders = response?.data?.data?.orders.edges || [];
      setShopifyOrders(orders);

      processOrders(orders);
    } catch (error) {
      console.error("Error fetching Shopify orders:", error);
    }
  };

  // Step 3: Process Shopify Orders
  const processOrders = async (orders) => {
    for (const order of orders) {
      const shopifyCustomer = order.node.customer;
      if (!shopifyCustomer) continue;

      const customerId = await createCustomer(shopifyCustomer);
      if (!customerId) continue;

      // Step 4: Create Shipping Address
      const shippingAddress = order.node.shippingAddress;
      const addressId = await createShippingAddress(customerId, shippingAddress);

      // Step 5: Add Products to Cart
      const cartItems = order.node.lineItems.edges.map((item) => ({
        product: 25556, // Correct Shopify Product ID
        quantity: item.node.quantity,
      }));
      await addProductsToCart(cartItems);

      // Step 6: Create Order
      await createOrder(order.node, customerId, addressId);
    }
  };

  // Step 4: Match State Name and Get State ID
  const getStateId = (provinceName) => {
    if (!provinceName) return null; // Handle empty values

    const matchedState = states.find(
      (state) =>
        state.name.toLowerCase() === provinceName.toLowerCase() || state.province?.toLowerCase() === provinceName.toLowerCase()
    );

    return matchedState ? matchedState.id : 14; // Default to Kerala (ID: 14) if no match
  };

  // Step 5: Create Customer with Correct State ID
  const createCustomer = async (customerData) => {
    try {
      const province = customerData.defaultAddress?.province || null;
      const stateId = getStateId(province);

      const response = await axios.post(
        `${API_BASE_URL}add/customer/`,
        {
          name: `${customerData.firstName} ${customerData.lastName}`,
          email: customerData.email,
          phone: customerData.phone || "N/A",
          address: customerData.defaultAddress?.address1 || "N/A",
          zip_code: customerData.defaultAddress?.zip || "000000",
          city: customerData.defaultAddress?.city || "N/A",
          state: stateId, // ✅ Pass correct state ID
          manager: 2,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 201) {
        console.log("Customer created:", response.data);
        return response.data.data.id;
      }
    } catch (error) {
      console.error("Error creating customer:", error);
    }
    return null;
  };

  // Step 6: Create Shipping Address with Correct State ID
  const createShippingAddress = async (customerId, address) => {
    try {
      const stateId = getStateId(address.province);

      const response = await axios.post(
        `${API_BASE_URL}add/customer/address/${customerId}/`,
        {
          customer: customerId,
          name: address.address1 || "N/A",
          address: `${address.address1}, ${address.address2}` || "N/A",
          city: address.city || "N/A",
          state: stateId, // ✅ Pass correct state ID
          zip_code: address.zip || "000000",
          country: address.country || "N/A",
          phone: address.phone || "N/A",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 200) {
        console.log("Address added:", response.data);
        return response.data.data.id;
      }
    } catch (error) {
      console.error("Error adding shipping address:", error);
    }
    return null;
  };

  // Step 7: Add Products to Cart
  const addProductsToCart = async (cartItems) => {
    for (const item of cartItems) {
      try {
        await axios.post(
          `${API_BASE_URL}cart/product/`,
          { product: 2556, quantity: item.quantity }, // ✅ Correct Shopify Product ID
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (error) {
        console.error("Error adding to cart:", error);
      }
    }
  };

  // Step 8: Create Order
  const createOrder = async (order, customerId, addressId) => {
    try {
      const stateId = getStateId(order.shippingAddress.province);

      await axios.post(
        `${API_BASE_URL}order/create/`,
        {
          manage_staff: 2,
          company: 4,
          customer: customerId,
          billing_address: addressId,
          order_date: order.createdAt,
          family: 3,
          state: stateId, // ✅ Pass correct state ID
          payment_status: order.displayFinancialStatus,
          total_amount: order.totalPriceSet.shopMoney.amount,
          bank: 2,
          payment_method: order.paymentGatewayNames[0] || "N/A",
          warehouses: 2,
          status: "Invoice Created",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("Order created successfully");
    } catch (error) {
      console.error("Error creating order:", error);
    }
  };

  return (
    <div>
      <h3>Import Shopify Orders</h3>
      <button onClick={fetchShopifyOrders} style={{ padding: "10px 20px", background:"green", color:"white", border:"none", marginTop:"50px", fontSize: "16px", cursor: "pointer" }}>
        Import bepocart Orders
      </button>
    </div>
  );
};

export default OrdersComponent;
