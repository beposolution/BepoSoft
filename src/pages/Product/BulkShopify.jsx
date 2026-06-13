


// ------------------------------------------------
// -------------SHOPIFY ORDER PAGES----------------
// ------------------------------------------------

// shopify order object reference for logs:

// Full updated OrdersComponent.jsx
// Includes detailed success and failure UI logs.

// import { useEffect, useState } from "react";
// import axios from "axios";
// import { ToastContainer, toast } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";

// const API_BASE_URL = import.meta.env.VITE_APP_KEY;
// const token = localStorage.getItem("token");

// const SecretConfig = {
//   shopifyAccessToken: import.meta.env.VITE_SHOPIFY_ACCESS_TOKEN,
// };

// const OrdersComponent = () => {
//   const [states, setStates] = useState([]);

//   const [successLogs, setSuccessLogs] = useState([]);
//   const [failureLogs, setFailureLogs] = useState([]);
//   const [failedStockProducts, setFailedStockProducts] = useState([]);

//   const [isLoading, setIsLoading] = useState(false);
//   const [loadingText, setLoadingText] = useState("Processing orders...");

//   const shopifyEndpoint =
//     "https://ekve0y-1k.myshopify.com/admin/api/2025-01/graphql.json";

//   useEffect(() => {
//     fetchStates();
//   }, []);

//   const apiUrl = (path) => {
//     const base = API_BASE_URL.endsWith("/")
//       ? API_BASE_URL
//       : `${API_BASE_URL}/`;
//     return `${base}${path}`;
//   };

//   const cleanPhone = (phone = "") => {
//     let value = phone.toString().trim();

//     if (value.startsWith("+91")) {
//       value = value.substring(3);
//     } else if (value.startsWith("91") && value.length > 10) {
//       value = value.substring(2);
//     }

//     value = value.replace(/\D/g, "");

//     if (value.length > 10) {
//       value = value.substring(value.length - 10);
//     }

//     return value;
//   };

//   const getStateId = (provinceName) => {
//     if (!provinceName) return 14;

//     const matchedState = states.find(
//       (state) =>
//         state.name?.toLowerCase() === provinceName.toLowerCase() ||
//         state.province?.toLowerCase() === provinceName.toLowerCase()
//     );

//     return matchedState ? matchedState.id : 14;
//   };

//   const getOrderDetails = (order) => {
//     const usedAddress = order?.shippingAddress || order?.billingAddress;

//     return {
//       shopifyOrder: order?.name || "Unknown",
//       shopifyOrderId: order?.id || "N/A",
//       customerName:
//         `${order?.customer?.firstName || ""} ${order?.customer?.lastName || ""
//           }`.trim() || "Unknown Customer",
//       phone: cleanPhone(usedAddress?.phone || ""),
//       email: order?.customer?.email || "N/A",
//       amount: order?.totalPriceSet?.shopMoney?.amount || "0",
//       paymentStatus: order?.displayFinancialStatus || "N/A",
//       paymentMethod: order?.paymentGatewayNames?.[0] || "N/A",
//       address: `${usedAddress?.address1 || ""}, ${usedAddress?.address2 || ""
//         }`,
//       city: usedAddress?.city || "N/A",
//       state: usedAddress?.province || "N/A",
//       products:
//         order?.lineItems?.edges?.map((item) => ({
//           title: item?.node?.title || "Unknown Product",
//           sku: item?.node?.variant?.sku || "No SKU",
//           quantity: item?.node?.quantity || 0,
//         })) || [],
//     };
//   };

//   const addSuccessLog = (order, message, extra = {}) => {
//     setSuccessLogs((prev) => [
//       ...prev,
//       {
//         ...getOrderDetails(order),
//         message,
//         ...extra,
//       },
//     ]);
//   };

//   const getErrorReason = (error) => {
//     const data = error?.response?.data || error;

//     if (!data) return "No reason returned from backend";

//     if (typeof data === "string") return data;

//     if (data.detail) return data.detail;
//     if (data.message) return data.message;
//     if (data.error) return data.error;
//     if (data.non_field_errors) return data.non_field_errors.join(", ");

//     return JSON.stringify(data);
//   };

//   const addFailureLog = (order, reason, step, error = null) => {
//     setFailureLogs((prev) => [
//       ...prev,
//       {
//         ...getOrderDetails(order),
//         reason,
//         step,
//         backendError:
//           error?.response?.data ||
//           error?.message ||
//           error ||
//           "No backend error response",
//         statusCode: error?.response?.status || "N/A",
//       },
//     ]);
//   };

//   const mapPaymentStatus = (status) => {
//     if (!status) return "PENDING";

//     const value = status.toUpperCase();

//     switch (value) {
//       case "PAID":
//         return "paid";
//       case "PENDING":
//         return "COD";
//       case "VOIDED":
//         return "VOIDED";
//       default:
//         return "PENDING";
//     }
//   };

//   const fetchStates = async () => {
//     try {
//       const response = await axios.get(apiUrl("states/"), {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "application/json",
//         },
//       });

//       if (response.status === 200) {
//         setStates(response.data.data || []);
//       }
//     } catch (error) {
//       console.log("State fetch error:", error.response?.data || error.message);
//       toast.error("Error fetching states");
//     }
//   };

//   const getCustomerByPhone = async (phone) => {
//     try {
//       const cleanedPhone = cleanPhone(phone);

//       const response = await axios.get(apiUrl("customers/"), {
//         params: {
//           search: cleanedPhone,
//           page: 1,
//         },
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "application/json",
//         },
//       });

//       const results = response.data?.results || [];

//       for (const item of results) {
//         const apiPhone = cleanPhone(item?.phone || "");

//         if (apiPhone === cleanedPhone) {
//           return item;
//         }
//       }

//       return null;
//     } catch (error) {
//       console.log(
//         "getCustomerByPhone error:",
//         error.response?.data || error.message
//       );
//       return null;
//     }
//   };

//   const orderAlreadyExists = async (shopOrder) => {
//     try {
//       const shopifyId = shopOrder?.id?.toString();

//       if (!shopifyId) return null;

//       const orderName = shopOrder?.name?.toString() || "";

//       const customerName = `${shopOrder?.customer?.firstName || ""
//         } ${shopOrder?.customer?.lastName || ""}`.trim();

//       const searchValue = customerName || orderName.replace("#", "");

//       const response = await axios.get(apiUrl("orders/all/"), {
//         params: searchValue
//           ? {
//             search: searchValue,
//           }
//           : {},
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "application/json",
//         },
//       });

//       const data = response.data;

//       let orders = [];

//       if (Array.isArray(data)) {
//         orders = data;
//       } else if (Array.isArray(data?.data)) {
//         orders = data.data;
//       } else if (Array.isArray(data?.results)) {
//         orders = data.results;
//       } else if (Array.isArray(data?.results?.results)) {
//         orders = data.results.results;
//       }

//       for (const ord of orders) {
//         const existingShopifyId = ord?.shopify_order_id?.toString();

//         if (existingShopifyId && existingShopifyId === shopifyId) {
//           return ord?.id;
//         }
//       }

//       return null;
//     } catch (error) {
//       console.log(
//         "orderAlreadyExists error:",
//         error.response?.data || error.message
//       );
//       return null;
//     }
//   };

//   const fetchLatestOrders = async () => {
//     const ordersQuery = `
//       query getOrdersWithAllLineItems($first: Int!) {
//         orders(first: $first, sortKey: CREATED_AT, reverse: true) {
//           edges {
//             node {
//               id
//               name
//               email
//               createdAt
//               displayFinancialStatus
//               paymentGatewayNames
//               totalPriceSet {
//                 shopMoney {
//                   amount
//                   currencyCode
//                 }
//               }
//               customer {
//                 id
//                 firstName
//                 lastName
//                 email
//                 phone
//                 defaultAddress {
//                   address1
//                   address2
//                   city
//                   province
//                   country
//                   zip
//                 }
//               }
//               lineItems(first: 10) {
//                 edges {
//                   node {
//                     title
//                     quantity
//                     variant {
//                       id
//                       title
//                       price
//                       sku
//                       product {
//                         id
//                         title
//                         vendor
//                         productType
//                       }
//                     }
//                     discountedTotalSet {
//                       shopMoney {
//                         amount
//                         currencyCode
//                       }
//                     }
//                   }
//                 }
//               }
//               billingAddress {
//                 address1
//                 address2
//                 city
//                 province
//                 country
//                 zip
//                 phone
//               }
//               shippingAddress {
//                 address1
//                 address2
//                 city
//                 province
//                 country
//                 zip
//                 phone
//               }
//               fulfillments {
//                 id
//                 status
//                 trackingInfo {
//                   number
//                   url
//                 }
//               }
//               discountApplications(first: 10) {
//                 edges {
//                   node {
//                     allocationMethod
//                     targetType
//                     value {
//                       ... on MoneyV2 {
//                         amount
//                         currencyCode
//                       }
//                       ... on PricingPercentageValue {
//                         percentage
//                       }
//                     }
//                   }
//                 }
//               }
//             }
//           }
//         }
//       }
//     `;

//     try {
//       const response = await axios.post(
//         shopifyEndpoint,
//         {
//           query: ordersQuery,
//           variables: {
//             first: 20,
//           },
//         },
//         {
//           headers: {
//             "Content-Type": "application/json",
//             "X-Shopify-Access-Token": SecretConfig.shopifyAccessToken,
//           },
//         }
//       );

//       const edges = response?.data?.data?.orders?.edges || [];
//       const orders = edges.map((edge) => edge.node);

//       await compareCustomers(orders);
//     } catch (error) {
//       console.log("Shopify error:", error.response?.data || error.message);
//       toast.error("Failed to fetch Shopify orders");
//     }
//   };

//   const compareCustomers = async (allOrders) => {
//     for (const order of allOrders) {
//       const orderName = order?.name || "Unknown Order";

//       if (order?.displayFinancialStatus === "VOIDED") {
//         addFailureLog(order, "VOIDED order skipped", "Shopify status check");
//         continue;
//       }

//       const existingOrderId = await orderAlreadyExists(order);

//       if (existingOrderId) {
//         addFailureLog(
//           order,
//           `Already Created. Backend Order ID: ${existingOrderId}`,
//           "Duplicate order check"
//         );
//         continue;
//       }

//       const orderPhone =
//         order?.shippingAddress?.phone || order?.billingAddress?.phone;

//       if (!orderPhone || orderPhone.trim() === "") {
//         addFailureLog(order, "No phone number found", "Phone validation");
//         continue;
//       }

//       const normalizedOrderPhone = cleanPhone(orderPhone);

//       const shippingAddress = order?.shippingAddress;
//       const billingAddress = order?.billingAddress;
//       const usedAddress = shippingAddress || billingAddress;

//       if (!usedAddress) {
//         addFailureLog(
//           order,
//           "No shipping or billing address found",
//           "Address validation"
//         );
//         continue;
//       }

//       try {
//         const existingCustomer = await getCustomerByPhone(normalizedOrderPhone);

//         if (existingCustomer?.id) {
//           const customerId = existingCustomer.id;

//           const addressId = await addAddress({
//             customerId,
//             order,
//             name:
//               `${order?.customer?.firstName || ""} ${order?.customer?.lastName || ""
//                 }`.trim() || "Unknown Customer",
//             phone: usedAddress?.phone || normalizedOrderPhone,
//             email: order?.customer?.email || "",
//             address: `${usedAddress?.address1 || ""}, ${usedAddress?.address2 || ""
//               }`,
//             city: usedAddress?.city || "",
//             state: usedAddress?.province || "",
//             zipcode: usedAddress?.zip || "",
//             country: usedAddress?.country || "",
//           });

//           if (!addressId) continue;

//           const shippingStateId = getStateId(usedAddress?.province);

//           const cartSuccess = await addToCart(order);

//           if (!cartSuccess) continue;

//           await createOrder({
//             order,
//             customerId,
//             addressId,
//             shippingStateId,
//             customerType: "Existing customer",
//           });

//           continue;
//         }

//         const customerId = await addCustomer({
//           order,
//           name:
//             `${order?.customer?.firstName || ""} ${order?.customer?.lastName || ""
//               }`.trim() || "Unknown Customer",
//           phone: normalizedOrderPhone,
//           email: order?.customer?.email || "",
//           address: `${usedAddress?.address1 || ""}, ${usedAddress?.address2 || ""
//             }`,
//           city: usedAddress?.city || "",
//           state: usedAddress?.province || "",
//           zipcode: usedAddress?.zip || "",
//         });

//         if (!customerId) continue;

//         const addressId = await addAddress({
//           customerId,
//           order,
//           name:
//             `${order?.customer?.firstName || ""} ${order?.customer?.lastName || ""
//               }`.trim() || "Unknown Customer",
//           phone: usedAddress?.phone || normalizedOrderPhone,
//           email: order?.customer?.email || "",
//           address: `${usedAddress?.address1 || ""}, ${usedAddress?.address2 || ""
//             }`,
//           city: usedAddress?.city || "",
//           state: usedAddress?.province || "",
//           zipcode: usedAddress?.zip || "",
//           country: usedAddress?.country || "",
//         });

//         if (!addressId) continue;

//         const shippingStateId = getStateId(usedAddress?.province);

//         const cartSuccess = await addToCart(order);

//         if (!cartSuccess) continue;

//         await createOrder({
//           order,
//           customerId,
//           addressId,
//           shippingStateId,
//           customerType: "New customer",
//         });
//       } catch (error) {
//         console.log(
//           "compareCustomers error:",
//           error.response?.data || error.message
//         );

//         addFailureLog(order, "Failed due to exception", "Processing", error);

//         await deleteCartItems();
//       }
//     }
//   };

//   const addCustomer = async ({
//     order,
//     name,
//     phone,
//     email,
//     address,
//     city,
//     state,
//     zipcode,
//   }) => {
//     try {
//       const stateId = getStateId(state);

//       const body = {
//         name: name || "Unknown Customer",
//         manager: 17,
//         state: stateId,
//         phone: cleanPhone(phone),
//         alt_phone: "",
//         email: email || "no-email@example.com",
//         address,
//         zip_code: zipcode,
//         city,
//         comment: "Auto-created from order",
//       };

//       const response = await axios.post(apiUrl("add/customer/"), body, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "application/json",
//         },
//       });

//       if (response.status === 201) {
//         return response.data?.data?.id;
//       }

//       addFailureLog(order, "Customer creation failed", "Add Customer API");
//       return null;
//     } catch (error) {
//       console.log("addCustomer error:", error.response?.data || error.message);
//       addFailureLog(order, "Customer creation failed", "Add Customer API", error);
//       return null;
//     }
//   };

//   const addAddress = async ({
//     customerId,
//     order,
//     name,
//     phone,
//     email,
//     address,
//     city,
//     state,
//     zipcode,
//     country,
//   }) => {
//     try {
//       const stateId = getStateId(state);

//       const body = {
//         customer: customerId,
//         name,
//         address,
//         zipcode,
//         city,
//         state: stateId,
//         country,
//         phone: cleanPhone(phone) || "0000000000",
//         email,
//       };

//       const response = await axios.post(
//         apiUrl(`add/customer/address/${customerId}/`),
//         body,
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json",
//           },
//         }
//       );

//       if (response.status === 200) {
//         return response.data?.data?.id;
//       }

//       addFailureLog(order, "Address creation failed", "Add Address API");
//       return null;
//     } catch (error) {
//       console.log("addAddress error:", error.response?.data || error.message);
//       addFailureLog(order, "Address creation failed", "Add Address API", error);
//       return null;
//     }
//   };

//   const addToCart = async (order) => {
//     try {
//       const itemsList = order?.lineItems?.edges || [];

//       if (!itemsList.length) {
//         addFailureLog(order, "No products found", "Cart validation");
//         return false;
//       }

//       for (const item of itemsList) {
//         const node = item?.node;
//         const productSku = node?.variant?.sku;
//         const quantity = node?.quantity;
//         const productTitle = node?.title || "";

//         if (!productSku || !quantity) {
//           addFailureLog(
//             order,
//             `Invalid product data. SKU: ${productSku || "Missing"}, Qty: ${quantity || "Missing"
//             }`,
//             "Product validation"
//           );
//           return false;
//         }

//         const response = await axios.post(
//           apiUrl("cart/product/"),
//           {
//             product: productSku,
//             quantity,
//           },
//           {
//             headers: {
//               Authorization: `Bearer ${token}`,
//               "Content-Type": "application/json",
//             },
//           }
//         );

//         if (response.status !== 201) {
//           await deleteCartItems();

//           addFailureLog(
//             order,
//             `Failed to add SKU ${productSku} (${productTitle}) to cart`,
//             "Cart API",
//             response.data
//           );

//           return false;
//         }
//       }

//       return true;
//     } catch (error) {
//       console.log("addToCart error:", error.response?.data || error.message);

//       await deleteCartItems();

//       addFailureLog(order, "Product add to cart failed", "Cart API", error);

//       return false;
//     }
//   };

//   const createOrder = async ({
//     order,
//     customerId,
//     addressId,
//     shippingStateId,
//     customerType,
//   }) => {
//     try {
//       let totalAmount = parseFloat(
//         order?.totalPriceSet?.shopMoney?.amount || "0"
//       );

//       let shippingCharge = 0;

//       if (totalAmount < 500) {
//         shippingCharge = 60;
//         totalAmount += shippingCharge;
//       }

//       const body = {
//         manage_staff: 17,
//         company: 5,
//         customer: customerId,
//         billing_address: addressId,
//         order_date: new Date().toISOString(),
//         family: 3,
//         state: shippingStateId,
//         payment_status: mapPaymentStatus(order?.displayFinancialStatus),
//         total_amount: totalAmount.toString(),
//         shipping_charge: shippingCharge.toString(),
//         bank: 8,
//         payment_method: order?.paymentGatewayNames?.[0] || "N/A",
//         warehouses: 1,
//         status: "Invoice Created",
//         shopify_order_id: order?.id,
//       };

//       const response = await axios.post(apiUrl("order/create/"), body, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "application/json",
//         },
//       });

//       if (response.status === 201) {
//         const orderId = response.data?.data?.id;

//         addSuccessLog(order, "Order created successfully", {
//           backendOrderId: orderId,
//           customerId,
//           addressId,
//           shippingStateId,
//           customerType,
//           shippingCharge,
//           finalAmount: totalAmount,
//         });

//         await updateAmount(order, orderId);
//         await deleteCartItems();

//         return;
//       }

//       addFailureLog(order, "Order creation failed", "Create Order API");
//       await deleteCartItems();
//     } catch (error) {
//       console.log("createOrder error:", error.response?.data || error.message);

//       const errorBody = JSON.stringify(error.response?.data || "");

//       if (errorBody.includes("Not enough available stock")) {
//         const itemsList = order?.lineItems?.edges || [];

//         itemsList.forEach((item) => {
//           const sku = item?.node?.variant?.sku;
//           const title = item?.node?.title;
//           const qty = item?.node?.quantity;

//           setFailedStockProducts((prev) => [
//             ...prev,
//             `[${order?.name}] SKU ${sku} – ${title} (Qty ${qty}) → STOCK NOT AVAILABLE`,
//           ]);
//         });
//       }

//       addFailureLog(order, "Order creation failed", "Create Order API", error);
//       await deleteCartItems();
//     }
//   };

//   const updateAmount = async (order, orderId) => {
//     try {
//       const totalAmount = order?.totalPriceSet?.shopMoney?.amount || "0";

//       const response = await axios.put(
//         apiUrl(`shipping/${orderId}/order/`),
//         {
//           total_amount: totalAmount,
//         },
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json",
//           },
//         }
//       );

//       if (response.status === 200) {
//         toast.success("Total updated successfully");
//       } else {
//         toast.error("Failed to update total amount");
//       }
//     } catch (error) {
//       console.log("updateAmount error:", error.response?.data || error.message);
//       toast.error("Error updating amount");
//     }
//   };

//   const deleteCartItems = async () => {
//     try {
//       const response = await axios.delete(apiUrl("cart/delete/all/"), {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       return response.status === 200 || response.status === 204;
//     } catch (error) {
//       console.log(
//         "deleteCartItems error:",
//         error.response?.data || error.message
//       );
//       return false;
//     }
//   };

//   const handleFetchOrders = async () => {
//     setIsLoading(true);
//     setLoadingText("Fetching & processing latest orders...");

//     setSuccessLogs([]);
//     setFailureLogs([]);
//     setFailedStockProducts([]);

//     await fetchLatestOrders();

//     setIsLoading(false);
//   };

//   return (
//     <div style={styles.page}>
//       <ToastContainer />

//       <div style={styles.card}>
//         <div style={styles.icon}>☁</div>

//         <h2 style={styles.title}>Order Bulk Upload</h2>
//         <p style={styles.subtitle}>Fetch the Latest Shopify Orders</p>

//         <button
//           onClick={handleFetchOrders}
//           disabled={isLoading}
//           style={{
//             ...styles.button,
//             opacity: isLoading ? 0.7 : 1,
//             cursor: isLoading ? "not-allowed" : "pointer",
//           }}
//         >
//           {isLoading ? "Processing..." : "Fetch Orders"}
//         </button>

//         <div style={styles.summaryRow}>
//           <div style={styles.summarySuccess}>
//             Success: {successLogs.length}
//           </div>
//           <div style={styles.summaryFailed}>Failed: {failureLogs.length}</div>
//         </div>

//         {successLogs.length > 0 && (
//           <DetailedLogBox
//             title={`Success Orders: ${successLogs.length}`}
//             logs={successLogs}
//             type="success"
//           />
//         )}

//         {failureLogs.length > 0 && (
//           <DetailedLogBox
//             title={`Failed Orders: ${failureLogs.length}`}
//             logs={failureLogs}
//             type="failed"
//           />
//         )}

//         {failedStockProducts.length > 0 && (
//           <ResultBox
//             title="Products with Stock Issues:"
//             color="red"
//             background="#fff0f0"
//             items={failedStockProducts}
//           />
//         )}
//       </div>

//       {isLoading && (
//         <div style={styles.overlay}>
//           <div style={styles.loaderBox}>
//             <div style={styles.spinner}></div>
//             <p style={{ color: "white", marginTop: 15 }}>{loadingText}</p>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// const DetailedLogBox = ({ title, logs, type }) => {
//   const isSuccess = type === "success";

//   return (
//     <div style={{ marginTop: 30, textAlign: "left" }}>
//       <h3 style={{ color: isSuccess ? "green" : "red" }}>{title}</h3>

//       {logs.map((log, index) => (
//         <div
//           key={index}
//           style={{
//             background: isSuccess ? "#eaffea" : "#fff0f0",
//             border: `1px solid ${isSuccess ? "#80d980" : "#ffb3b3"}`,
//             borderRadius: 10,
//             padding: 15,
//             marginBottom: 15,
//           }}
//         >
//           <h4 style={{ margin: "0 0 8px 0" }}>
//             {index + 1}. {log.shopifyOrder}
//           </h4>

//           <p>
//             <b>Shopify Order ID:</b> {log.shopifyOrderId}
//           </p>
//           <p>
//             <b>Customer:</b> {log.customerName}
//           </p>
//           <p>
//             <b>Phone:</b> {log.phone || "N/A"}
//           </p>
//           <p>
//             <b>Email:</b> {log.email}
//           </p>
//           <p>
//             <b>Amount:</b> ₹{log.amount}
//           </p>
//           <p>
//             <b>Payment Status:</b> {log.paymentStatus}
//           </p>
//           <p>
//             <b>Payment Method:</b> {log.paymentMethod}
//           </p>
//           <p>
//             <b>Address:</b> {log.address}
//           </p>
//           <p>
//             <b>City:</b> {log.city}
//           </p>
//           <p>
//             <b>State:</b> {log.state}
//           </p>

//           {isSuccess ? (
//             <>
//               <p>
//                 <b>Status:</b> {log.message}
//               </p>
//               <p>
//                 <b>Customer Type:</b> {log.customerType || "N/A"}
//               </p>
//               <p>
//                 <b>Backend Order ID:</b> {log.backendOrderId || "N/A"}
//               </p>
//               <p>
//                 <b>Customer ID:</b> {log.customerId || "N/A"}
//               </p>
//               <p>
//                 <b>Address ID:</b> {log.addressId || "N/A"}
//               </p>
//               <p>
//                 <b>State ID:</b> {log.shippingStateId || "N/A"}
//               </p>
//               <p>
//                 <b>Shipping Charge:</b> ₹{log.shippingCharge ?? 0}
//               </p>
//               <p>
//                 <b>Shopify Amount:</b> ₹{log.amount}
//               </p>
//               <p>
//                 <b>Final Amount:</b> ₹{log.finalAmount || log.amount}
//               </p>
//               <p>
//                 <b>Payment Status:</b> {log.paymentStatus}
//               </p>
//               <p>
//                 <b>Payment Method:</b> {log.paymentMethod}
//               </p>
//               <p>
//                 <b>Customer Name:</b> {log.customerName}
//               </p>
//               <p>
//                 <b>Customer Phone:</b> {log.phone || "N/A"}
//               </p>
//               <p>
//                 <b>Customer Email:</b> {log.email || "N/A"}
//               </p>
//               <p>
//                 <b>Shipping Address:</b> {log.address}
//               </p>
//               <p>
//                 <b>City:</b> {log.city}
//               </p>
//               <p>
//                 <b>State:</b> {log.state}
//               </p>
//             </>
//           ) : (
//             <>
//               <p>
//                 <b>Failed Step:</b> {log.step}
//               </p>
//               <p>
//                 <b>Reason:</b> {log.reason}
//               </p>
//               <p>
//                 <b>Status Code:</b> {log.statusCode}
//               </p>

//               <p>
//                 <b>Backend Error:</b>
//               </p>

//               <pre
//                 style={{
//                   background: "#ffeaea",
//                   padding: 10,
//                   borderRadius: 5,
//                   whiteSpace: "pre-wrap",
//                   overflowX: "auto",
//                   color: "red",
//                 }}
//               >
//                 {typeof log.backendError === "object"
//                   ? JSON.stringify(log.backendError, null, 2)
//                   : log.backendError}
//               </pre>
//             </>
//           )}

//           <div>
//             <b>Products:</b>
//             {log.products.length > 0 ? (
//               <ul>
//                 {log.products.map((product, i) => (
//                   <li key={i}>
//                     {product.title} | SKU: {product.sku} | Qty:{" "}
//                     {product.quantity}
//                   </li>
//                 ))}
//               </ul>
//             ) : (
//               <p>No products found</p>
//             )}
//           </div>
//         </div>
//       ))}
//     </div>
//   );
// };

// const ResultBox = ({ title, items, color, background }) => {
//   return (
//     <div style={{ marginTop: 30, textAlign: "left" }}>
//       <h4 style={{ color }}>{title}</h4>

//       <div
//         style={{
//           padding: "12px",
//           background,
//           borderRadius: "8px",
//         }}
//       >
//         {items.map((item, index) => (
//           <p key={index} style={{ margin: "4px 0" }}>
//             - {item}
//           </p>
//         ))}
//       </div>
//     </div>
//   );
// };

// const styles = {
//   page: {
//     width: "100%",
//     minHeight: "100vh",
//     background: "#f7f7f7",
//     padding: "40px 20px",
//     boxSizing: "border-box",
//   },

//   card: {
//     maxWidth: "900px",
//     margin: "0 auto",
//     background: "white",
//     borderRadius: "16px",
//     padding: "40px 24px",
//     textAlign: "center",
//     boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
//     position: "relative",
//   },

//   icon: {
//     fontSize: "70px",
//     color: "green",
//   },

//   title: {
//     margin: "10px 0",
//     fontSize: "24px",
//     fontWeight: "700",
//   },

//   subtitle: {
//     fontSize: "16px",
//     fontWeight: "600",
//     color: "#333",
//     marginBottom: "30px",
//   },

//   button: {
//     padding: "14px 28px",
//     background: "#01b90d",
//     color: "white",
//     border: "none",
//     borderRadius: "30px",
//     fontSize: "16px",
//     fontWeight: "600",
//     boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
//   },

//   summaryRow: {
//     display: "flex",
//     justifyContent: "center",
//     gap: "15px",
//     marginTop: "25px",
//     flexWrap: "wrap",
//   },

//   summarySuccess: {
//     background: "#eaffea",
//     color: "green",
//     border: "1px solid #80d980",
//     borderRadius: "8px",
//     padding: "10px 20px",
//     fontWeight: "700",
//   },

//   summaryFailed: {
//     background: "#fff0f0",
//     color: "red",
//     border: "1px solid #ffb3b3",
//     borderRadius: "8px",
//     padding: "10px 20px",
//     fontWeight: "700",
//   },

//   overlay: {
//     position: "fixed",
//     inset: 0,
//     background: "rgba(0,0,0,0.5)",
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "center",
//     zIndex: 9999,
//   },

//   loaderBox: {
//     textAlign: "center",
//   },

//   spinner: {
//     width: "45px",
//     height: "45px",
//     border: "5px solid #ffffff",
//     borderTop: "5px solid #01b90d",
//     borderRadius: "50%",
//     animation: "spin 1s linear infinite",
//     margin: "0 auto",
//   },
// };

// export default OrdersComponent;