import React, { Fragment, useEffect, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_BASE_URL = import.meta.env.VITE_APP_KEY;
// const token = localStorage.getItem("token");

const getToken = () => localStorage.getItem("token");

const authHeaders = () => ({
  Authorization: `Bearer ${getToken()}`,
  "Content-Type": "application/json",
});

const OrdersComponent = () => {
  const [states, setStates] = useState([]);
  const [userId, setUserId] = useState(null);
  const [successLogs, setSuccessLogs] = useState([]);
  const [failureLogs, setFailureLogs] = useState([]);
  const [failedStockProducts, setFailedStockProducts] = useState([]);

  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Processing orders...");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}profile/`, {
          headers: authHeaders(),
        });

        const userId = res?.data?.data?.id;
        setUserId(userId);
      } catch {
        toast.error("Failed to load profile");
      }
    };

    fetchProfile();
  }, []);

  useEffect(() => {
    fetchStates();
  }, []);

  const apiUrl = (path) => {
    const base = API_BASE_URL.endsWith("/") ? API_BASE_URL : `${API_BASE_URL}/`;
    return `${base}${path}`;
  };

  const cleanPhone = (phone = "") => {
    let value = phone.toString().trim();

    if (value.startsWith("+91")) {
      value = value.substring(3);
    } else if (value.startsWith("91") && value.length > 10) {
      value = value.substring(2);
    }

    value = value.replace(/\D/g, "");

    if (value.length > 10) {
      value = value.substring(value.length - 10);
    }

    return value;
  };

  const getStateId = (provinceName) => {
    if (!provinceName) return 14;

    const matchedState = states.find(
      (state) =>
        state.name?.toLowerCase() === provinceName.toLowerCase() ||
        state.province?.toLowerCase() === provinceName.toLowerCase()
    );

    return matchedState ? matchedState.id : 14;
  };

  const getValue = (row, keys, defaultValue = "") => {
    for (const key of keys) {
      if (
        row[key] !== undefined &&
        row[key] !== null &&
        row[key].toString().trim() !== ""
      ) {
        return row[key];
      }
    }

    return defaultValue;
  };

  const getOrderDetails = (order) => {
    const usedAddress = order?.shippingAddress || order?.billingAddress;

    return {
      orderName: order?.name || "Unknown",
      orderId: order?.id || "N/A",
      customerName:
        `${order?.customer?.firstName || ""} ${order?.customer?.lastName || ""
          }`.trim() || "Unknown Customer",
      phone: cleanPhone(usedAddress?.phone || order?.customer?.phone || ""),
      email: order?.customer?.email || "N/A",
      amount: order?.totalPriceSet?.shopMoney?.amount || "0",
      paymentStatus: order?.displayFinancialStatus || "N/A",
      paymentMethod: order?.paymentGatewayNames?.[0] || "N/A",
      address: `${usedAddress?.address1 || ""}, ${usedAddress?.address2 || ""}`,
      city: usedAddress?.city || "N/A",
      state: usedAddress?.province || "N/A",
      products:
        order?.lineItems?.edges?.map((item) => ({
          title: item?.node?.title || "Unknown Product",
          sku: item?.node?.variant?.sku || "No SKU",
          quantity: item?.node?.quantity || 0,
        })) || [],
    };
  };

  const addSuccessLog = (order, message, extra = {}) => {
    setSuccessLogs((prev) => [
      ...prev,
      {
        ...getOrderDetails(order),
        message,
        ...extra,
      },
    ]);
  };

  const addFailureLog = (order, reason, step, error = null) => {
    setFailureLogs((prev) => [
      ...prev,
      {
        ...getOrderDetails(order),
        reason,
        step,
        backendError:
          error?.response?.data ||
          error?.message ||
          error ||
          "No backend error response",
        statusCode: error?.response?.status || "N/A",
      },
    ]);
  };

  const mapPaymentStatus = (status) => {
    if (!status) return "PENDING";

    const value = status.toString().toUpperCase();

    switch (value) {
      case "PAID":
        return "paid";
      case "PENDING":
      case "COD":
        return "COD";
      case "VOIDED":
        return "VOIDED";
      default:
        return "PENDING";
    }
  };

  const fetchStates = async () => {
    try {
      const response = await axios.get(apiUrl("states/"), {
        headers: authHeaders(),
      });

      if (response.status === 200) {
        setStates(response.data.data || []);
      }
    } catch (error) {
      toast.error("Error fetching states");
    }
  };

  const getCustomerByPhone = async (phone) => {
    try {
      const cleanedPhone = cleanPhone(phone);

      const response = await axios.get(apiUrl("customers/"), {
        params: {
          search: cleanedPhone,
          page: 1,
        },
        headers: authHeaders(),
      });

      const results = response.data?.results || [];

      for (const item of results) {
        const apiPhone = cleanPhone(item?.phone || "");

        if (apiPhone === cleanedPhone) {
          return item;
        }
      }

      return null;
    } catch (error) {
      console.log(
        "getCustomerByPhone error:",
        error.response?.data || error.message
      );
      return null;
    }
  };

  const orderAlreadyExists = async (excelOrder) => {
    try {
      const excelOrderId = excelOrder?.id?.toString();

      if (!excelOrderId) return null;

      const orderName = excelOrder?.name?.toString() || "";

      const customerName = `${excelOrder?.customer?.firstName || ""} ${excelOrder?.customer?.lastName || ""
        }`.trim();

      const searchValue = customerName || orderName.replace("#", "");

      const response = await axios.get(apiUrl("orders/all/"), {
        params: searchValue ? { search: searchValue } : {},
        headers: authHeaders(),
      });

      const data = response.data;
      let orders = [];

      if (Array.isArray(data)) {
        orders = data;
      } else if (Array.isArray(data?.data)) {
        orders = data.data;
      } else if (Array.isArray(data?.results)) {
        orders = data.results;
      } else if (Array.isArray(data?.results?.results)) {
        orders = data.results.results;
      }

      for (const ord of orders) {
        const existingExcelId = ord?.shopify_order_id?.toString();

        if (existingExcelId && existingExcelId === excelOrderId) {
          return ord?.id;
        }
      }

      return null;
    } catch (error) {
      console.log(
        "orderAlreadyExists error:",
        error.response?.data || error.message
      );
      return null;
    }
  };

  const convertExcelRowsToOrders = (rows) => {
    const groupedOrders = {};

    rows.forEach((row, index) => {
      const orderName =
        getValue(row, ["Name", "Order Name", "Order", "Invoice", "Order No"]) ||
        `EXCEL-${index + 1}`;

      const orderId =
        getValue(row, ["Id", "ID", "Order ID", "Order Id"]) || orderName;

      const phone = getValue(row, [
        "Phone",
        "phone",
        "Shipping Phone",
        "Billing Phone",
        "Customer Phone",
      ]);

      const customerName = getValue(row, [
        "Shipping Name",
        "Billing Name",
        "Customer Name",
        "Name",
      ]);

      const email = getValue(row, ["Email", "Customer Email", "email"]);

      const lineItemPrice = parseFloat(
        getValue(row, ["Lineitem price", "Price", "Rate"], "0")
      ) || 0;

      const lineItemQuantity = Number(
        getValue(row, ["Lineitem quantity", "Quantity", "Qty"], 1)
      ) || 1;

      const shippingCharge = parseFloat(
        getValue(row, ["Shipping", "Shipping Charge", "shipping_charge"], "0")
      ) || 0;

      const codeCharge = parseFloat(
        getValue(row, ["Total", "total", "code_charge"], "0")
      ) || 0;

      const total = lineItemPrice * lineItemQuantity;

      const paymentStatus = getValue(
        row,
        ["Financial Status", "Payment Status", "payment_status"],
        "PENDING"
      );

      const paymentMethod = getValue(
        row,
        ["Payment Method", "Payment Gateway", "Gateway"],
        "N/A"
      );

      if (!groupedOrders[orderName]) {
        groupedOrders[orderName] = {
          id: orderId,
          name: orderName,
          email,
          shippingCharge: shippingCharge,
          codeCharge: codeCharge,
          createdAt:
            getValue(row, ["Created at", "Order Date", "Date"]) ||
            new Date().toISOString(),
          displayFinancialStatus: paymentStatus,
          paymentGatewayNames: [paymentMethod],
          productErrors: [],
          totalPriceSet: {
            shopMoney: {
              amount: "0",
              currencyCode: getValue(row, ["Currency"], "INR"),
            },
          },
          customer: {
            id: "",
            firstName: "",
            lastName: customerName || "Unknown Customer",
            email,
            phone,
            defaultAddress: {
              address1: getValue(row, [
                "Shipping Address1",
                "Shipping Street",
                "Address",
              ]),
              address2: getValue(row, ["Shipping Address2"]),
              city: getValue(row, ["Shipping City", "City"]),
              province: getValue(row, [
                "Shipping Province Name",
                "Shipping Province",
                "State",
              ]),
              country: getValue(row, ["Shipping Country", "Country"]),
              zip: getValue(row, ["Shipping Zip", "Zip", "Pincode"]),
            },
          },
          shippingAddress: {
            address1: getValue(row, [
              "Shipping Address1",
              "Shipping Street",
              "Address",
            ]),
            address2: getValue(row, ["Shipping Address2"]),
            city: getValue(row, ["Shipping City", "City"]),
            province: getValue(row, [
              "Shipping Province Name",
              "Shipping Province",
              "State",
            ]),
            country: getValue(row, ["Shipping Country", "Country"]),
            zip: getValue(row, ["Shipping Zip", "Zip", "Pincode"]),
            phone,
          },
          billingAddress: {
            address1: getValue(row, [
              "Billing Address1",
              "Billing Street",
              "Address",
            ]),
            address2: getValue(row, ["Billing Address2"]),
            city: getValue(row, ["Billing City", "City"]),
            province: getValue(row, [
              "Billing Province Name",
              "Billing Province",
              "State",
            ]),
            country: getValue(row, ["Billing Country", "Country"]),
            zip: getValue(row, ["Billing Zip", "Zip", "Pincode"]),
            phone,
          },
          lineItems: {
            edges: [],
          },
        };
      }

      const sku = getValue(row, [
        "Lineitem sku",
        "SKU",
        "Sku",
        "Product SKU",
        "Product Code",
      ]);

      const title = getValue(row, [
        "Lineitem name",
        "Product Name",
        "Product",
        "Item Name",
      ]);

      const quantity = Number(
        getValue(row, ["Lineitem quantity", "Quantity", "Qty"], 0)
      );

      const price = lineItemPrice.toString();

      if (!sku) {
        groupedOrders[orderName].productErrors.push(
          `${title || "Unknown Product"} has no SKU in Excel file`
        );
        return;
      }

      if (!quantity || quantity <= 0) {
        groupedOrders[orderName].productErrors.push(
          `${title || "Unknown Product"} has invalid quantity in Excel file`
        );
        return;
      }

      groupedOrders[orderName].totalPriceSet.shopMoney.amount = (
        parseFloat(
          groupedOrders[orderName].totalPriceSet.shopMoney.amount || 0
        ) +
        (lineItemPrice * quantity)
      ).toFixed(2);

      groupedOrders[orderName].lineItems.edges.push({
        node: {
          title: title || "Unknown Product",
          quantity,
          variant: {
            id: "",
            title: title || "",
            price,
            sku,
            product: {
              id: "",
              title: title || "",
              vendor: "",
              productType: "",
            },
          },
        },
      });
    });

    return Object.values(groupedOrders);
  };

  const handleExcelUpload = async (event) => {
    const file = event.target.files[0];

    if (!file) return;

    setIsLoading(true);
    setLoadingText("Reading Excel/CSV file...");
    setSuccessLogs([]);
    setFailureLogs([]);
    setFailedStockProducts([]);

    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });

        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        const rows = XLSX.utils.sheet_to_json(sheet, {
          defval: "",
        });

        if (!rows.length) {
          toast.error("No rows found in uploaded file");
          setIsLoading(false);
          return;
        }

        const orders = convertExcelRowsToOrders(rows);

        if (!orders.length) {
          toast.error("No valid orders found in uploaded file");
          setIsLoading(false);
          return;
        }

        setLoadingText("Processing uploaded orders...");
        await compareCustomers(orders);

        toast.success("Excel/CSV orders processed successfully");
      } catch (error) {
        toast.error("Failed to process Excel/CSV file");
      } finally {
        setIsLoading(false);
        event.target.value = "";
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const compareCustomers = async (allOrders) => {
    for (const order of allOrders) {
      if (order?.displayFinancialStatus?.toString().toUpperCase() === "VOIDED") {
        addFailureLog(order, "VOIDED order skipped", "Payment status check");
        continue;
      }

      const existingOrderId = await orderAlreadyExists(order);

      if (existingOrderId) {
        addFailureLog(
          order,
          `Already Created. Backend Order ID: ${existingOrderId}`,
          "Duplicate order check"
        );
        continue;
      }

      const orderPhone =
        order?.shippingAddress?.phone ||
        order?.billingAddress?.phone ||
        order?.customer?.phone;

      if (!orderPhone || orderPhone.toString().trim() === "") {
        addFailureLog(order, "No phone number found", "Phone validation");
        continue;
      }

      const normalizedOrderPhone = cleanPhone(orderPhone);
      const usedAddress = order?.shippingAddress || order?.billingAddress;

      if (!usedAddress) {
        addFailureLog(
          order,
          "No shipping or billing address found",
          "Address validation"
        );
        continue;
      }

      try {
        const existingCustomer = await getCustomerByPhone(normalizedOrderPhone);

        if (existingCustomer?.id) {
          const customerId = existingCustomer.id;

          const addressId = await addAddress({
            customerId,
            order,
            name:
              `${order?.customer?.firstName || ""} ${order?.customer?.lastName || ""
                }`.trim() || "Unknown Customer",
            phone: usedAddress?.phone || normalizedOrderPhone,
            email: order?.customer?.email || "",
            address: `${usedAddress?.address1 || ""}, ${usedAddress?.address2 || ""
              }`,
            city: usedAddress?.city || "",
            state: usedAddress?.province || "",
            zipcode: usedAddress?.zip || "",
            country: usedAddress?.country || "",
          });

          if (!addressId) continue;

          const shippingStateId = getStateId(usedAddress?.province);
          const cartSuccess = await addToCart(order);

          if (!cartSuccess) continue;

          await createOrder({
            order,
            customerId,
            addressId,
            shippingStateId,
            customerType: "Existing customer",
          });

          continue;
        }

        const customerId = await addCustomer({
          order,
          name:
            `${order?.customer?.firstName || ""} ${order?.customer?.lastName || ""
              }`.trim() || "Unknown Customer",
          phone: normalizedOrderPhone,
          email: order?.customer?.email || "",
          address: `${usedAddress?.address1 || ""}, ${usedAddress?.address2 || ""
            }`,
          city: usedAddress?.city || "",
          state: usedAddress?.province || "",
          zipcode: usedAddress?.zip || "",
        });

        if (!customerId) continue;

        const addressId = await addAddress({
          customerId,
          order,
          name:
            `${order?.customer?.firstName || ""} ${order?.customer?.lastName || ""
              }`.trim() || "Unknown Customer",
          phone: usedAddress?.phone || normalizedOrderPhone,
          email: order?.customer?.email || "",
          address: `${usedAddress?.address1 || ""}, ${usedAddress?.address2 || ""
            }`,
          city: usedAddress?.city || "",
          state: usedAddress?.province || "",
          zipcode: usedAddress?.zip || "",
          country: usedAddress?.country || "",
        });

        if (!addressId) continue;

        const shippingStateId = getStateId(usedAddress?.province);
        const cartSuccess = await addToCart(order);

        if (!cartSuccess) continue;

        await createOrder({
          order,
          customerId,
          addressId,
          shippingStateId,
          customerType: "New customer",
        });
      } catch (error) {
        console.log(
          "compareCustomers error:",
          error.response?.data || error.message
        );

        addFailureLog(order, "Failed due to exception", "Processing", error);
        await deleteCartItems();
      }
    }
  };

  const addCustomer = async ({
    order,
    name,
    phone,
    altPhone,
    email,
    address,
    city,
    state,
    zipcode,
  }) => {
    try {
      const stateId = getStateId(state);

      const body = {
        name: name || "Unknown Customer",
        manager: userId,
        state: stateId,
        phone: cleanPhone(phone),
        alt_phone: "7025400833",
        // alt_phone: cleanPhone(altPhone) || "7025400833",
        email: email || "no-email@example.com",
        address,
        zip_code: zipcode,
        city,
        comment: "Auto-created from Excel order",
      };

      const response = await axios.post(apiUrl("add/customer/"), body, {
        headers: authHeaders(),
      });

      if (response.status === 201) {
        return response.data?.data?.id;
      }

      addFailureLog(order, "Customer creation failed", "Add Customer API");
      return null;
    } catch (error) {
      if (error?.response?.status === 401) {
        toast.error("Login expired. Please login again.");
      }

      addFailureLog(order, "Customer creation failed", "Add Customer API", error);
      return null;
    }
  };

  const addAddress = async ({
    customerId,
    order,
    name,
    phone,
    email,
    address,
    city,
    state,
    zipcode,
    country,
  }) => {
    try {
      const stateId = getStateId(state);

      const body = {
        customer: customerId,
        name,
        address,
        zipcode,
        city,
        state: stateId,
        country,
        phone: cleanPhone(phone) || "0000000000",
        email,
      };

      const response = await axios.post(
        apiUrl(`add/customer/address/${customerId}/`),
        body,
        {
          headers: authHeaders(),
        }
      );

      if (response.status === 200) {
        return response.data?.data?.id;
      }

      addFailureLog(order, "Address creation failed", "Add Address API");
      return null;
    } catch (error) {
      addFailureLog(order, "Address creation failed", "Add Address API", error);
      return null;
    }
  };

  const addToCart = async (order) => {
    try {
      const itemsList = order?.lineItems?.edges || [];

      if (!itemsList.length) {
        const productErrors = order?.productErrors || [];

        addFailureLog(
          order,
          productErrors.length
            ? productErrors.join(", ")
            : "No valid products found. Check SKU and quantity in Excel file.",
          "Excel product validation"
        );

        return false;
      }

      for (const item of itemsList) {
        const node = item?.node;
        const productSku = node?.variant?.sku;
        const quantity = node?.quantity;
        const productTitle = node?.title || "";
        const excelPrice = node?.variant?.price || 0;

        if (!productSku || !quantity) {
          addFailureLog(
            order,
            `Invalid product data. SKU: ${productSku || "Missing"
            }, Qty: ${quantity || "Missing"}`,
            "Product validation"
          );
          return false;
        }

        const response = await axios.post(
          apiUrl("cart/product/excel/"),
          {
            product: productSku,
            quantity,
            price: excelPrice,
          },
          {
            headers: authHeaders(),
          }
        );

        if (response.status !== 201) {
          await deleteCartItems();

          addFailureLog(
            order,
            `Failed to add SKU ${productSku} (${productTitle}) to cart`,
            "Cart API",
            response.data
          );

          return false;
        }
      }

      return true;
    } catch (error) {
      await deleteCartItems();

      addFailureLog(order, "Product add to cart failed", "Cart API", error);

      return false;
    }
  };

  const mapPaymentMethod = (method) => {
    if (!method) return "Net Banking";

    const value = method.toString().toLowerCase();

    if (value.includes("razorpay")) return "1 Razorpay";
    if (value.includes("credit")) return "Credit Card";
    if (value.includes("debit")) return "Debit Card";
    if (value.includes("paypal")) return "PayPal";
    if (value.includes("cod") || value.includes("cash on delivery")) {
      return "Cash on Delivery (COD)";
    }
    if (value.includes("bank") || value.includes("net banking")) {
      return "Net Banking";
    }

    return "Net Banking";
  };

  const createOrder = async ({
    order,
    customerId,
    addressId,
    shippingStateId,
    customerType,
  }) => {
    try {
      let totalAmount = parseFloat(
        order?.totalPriceSet?.shopMoney?.amount || "0"
      );

      let shippingCharge = parseFloat(order?.shippingCharge || 0) || 0;

      let codeCharge = parseFloat(order?.codeCharge || 0) || 0;

      totalAmount += shippingCharge;

      const body = {
        manage_staff: userId,
        company: 5,
        customer: customerId,
        billing_address: addressId,
        order_date: new Date().toISOString().split("T")[0],
        family: 3,
        state: shippingStateId,
        payment_status: mapPaymentStatus(order?.displayFinancialStatus),
        total_amount: totalAmount.toString(),
        shipping_charge: shippingCharge.toString(),
        // code_charge: codeCharge.toString(),
        code_charge:
          mapPaymentMethod(order?.paymentGatewayNames?.[0]) === "Cash on Delivery (COD)"
            ? "0"
            : codeCharge.toString(),

        cod_amount:
          mapPaymentMethod(order?.paymentGatewayNames?.[0]) === "Cash on Delivery (COD)"
            ? codeCharge.toString()
            : "0",
        bank: 8,
        // payment_method: order?.paymentGatewayNames?.[0] || "N/A",
        payment_method: mapPaymentMethod(order?.paymentGatewayNames?.[0]),
        warehouses: 1,
        status: "Invoice Created",
        shopify_order_id: order?.id,
      };

      const response = await axios.post(apiUrl("order/create/"), body, {
        headers: authHeaders(),
      });

      if (response.status === 201) {
        const orderId = response.data?.data?.id;

        addSuccessLog(order, "Order created successfully", {
          backendOrderId: orderId,
          customerId,
          addressId,
          shippingStateId,
          customerType,
          shippingCharge,
          finalAmount: totalAmount,
        });

        await updateAmount(order, orderId);
        await deleteCartItems();

        return;
      }

      addFailureLog(order, "Order creation failed", "Create Order API");
      await deleteCartItems();
    } catch (error) {

      const errorBody = JSON.stringify(error.response?.data || "");

      if (errorBody.includes("Not enough available stock")) {
        const itemsList = order?.lineItems?.edges || [];

        itemsList.forEach((item) => {
          const sku = item?.node?.variant?.sku;
          const title = item?.node?.title;
          const qty = item?.node?.quantity;

          setFailedStockProducts((prev) => [
            ...prev,
            `[${order?.name}] SKU ${sku} – ${title} (Qty ${qty}) → STOCK NOT AVAILABLE`,
          ]);
        });
      }

      addFailureLog(order, "Order creation failed", "Create Order API", error);
      await deleteCartItems();
    }
  };

  const updateAmount = async (order, orderId) => {
    try {
      const productAmount = parseFloat(
        order?.totalPriceSet?.shopMoney?.amount || "0"
      );

      const shippingCharge = parseFloat(
        order?.shippingCharge || 0
      );

      const codeCharge = parseFloat(order?.codeCharge || 0) || 0;

      const totalAmount = (
        productAmount + shippingCharge
      ).toFixed(2);

      await axios.put(
        apiUrl(`shipping/${orderId}/order/`),
        {
          total_amount: totalAmount,
          // code_charge: codeCharge.toString(),
          code_charge:
            mapPaymentMethod(order?.paymentGatewayNames?.[0]) === "Cash on Delivery (COD)"
              ? "0"
              : codeCharge.toString(),

          cod_amount:
            mapPaymentMethod(order?.paymentGatewayNames?.[0]) === "Cash on Delivery (COD)"
              ? codeCharge.toString()
              : "0",
        },
        {
          headers: authHeaders(),
        }
      );
    } catch (error) {
      console.log("updateAmount error:", error.response?.data || error.message);
    }
  };

  const deleteCartItems = async () => {
    try {
      const response = await axios.delete(apiUrl("cart/delete/all/"), {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        }
      });

      return response.status === 200 || response.status === 204;
    } catch (error) {
      console.log(
        "deleteCartItems error:",
        error.response?.data || error.message
      );
      return false;
    }
  };

  const filteredSuccessLogs = successLogs.filter(
    (item) =>
      item.orderName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredFailureLogs = failureLogs.filter(
    (item) =>
      item.orderName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.reason?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  document.title = "Bulk Order Creation | BEPOSOFT";

  return (
    <Fragment>
      <div
        className="page-content"
        style={{ background: "#f5f7fb", minHeight: "100vh" }}
      >
        <div className="container-fluid">
          <div
            className="card border-0 mb-4"
            style={{
              borderRadius: "22px",
              background:
                "linear-gradient(135deg, #1f2937 0%, #334155 45%, #0f172a 100%)",
              boxShadow: "0 12px 35px rgba(15, 23, 42, 0.18)",
              overflow: "hidden",
            }}
          >
            <div className="card-body p-4">
              <div className="row align-items-center">
                <div className="col-lg-8">
                  <div className="d-flex align-items-center gap-3">
                    <div
                      style={{
                        width: "58px",
                        height: "58px",
                        borderRadius: "18px",
                        background: "rgba(255,255,255,0.12)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontSize: "26px",
                      }}
                    >
                      <i className="bx bx-upload"></i>
                    </div>

                    <div>
                      <h4 className="mb-1 text-white fw-bold">
                        Bulk Order Creation
                      </h4>
                      <p
                        className="mb-0"
                        style={{ color: "rgba(255,255,255,0.72)" }}
                      >
                        Upload Excel or CSV file, validate products, create
                        customers, addresses, and backend orders.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="col-lg-4 mt-4 mt-lg-0">
                  <div className="d-flex justify-content-lg-end gap-2 flex-wrap">
                    <span
                      className="badge"
                      style={{
                        background: "rgba(34,197,94,0.18)",
                        color: "#bbf7d0",
                        padding: "10px 14px",
                        borderRadius: "999px",
                        fontSize: "13px",
                        fontWeight: 500,
                      }}
                    >
                      Success: {successLogs.length}
                    </span>

                    <span
                      className="badge"
                      style={{
                        background: "rgba(239,68,68,0.18)",
                        color: "#fecaca",
                        padding: "10px 14px",
                        borderRadius: "999px",
                        fontSize: "13px",
                        fontWeight: 500,
                      }}
                    >
                      Failed: {failureLogs.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="row mb-4">
            <div className="col-xl-3 col-md-6 mb-3">
              <SummaryCard
                title="Total Processed"
                value={successLogs.length + failureLogs.length}
                icon="bx bx-list-check"
                bg="#eef2ff"
                color="#4f46e5"
              />
            </div>

            <div className="col-xl-3 col-md-6 mb-3">
              <SummaryCard
                title="Success Orders"
                value={successLogs.length}
                icon="bx bx-check-circle"
                bg="#ecfdf5"
                color="#10b981"
              />
            </div>

            <div className="col-xl-3 col-md-6 mb-3">
              <SummaryCard
                title="Failed Orders"
                value={failureLogs.length}
                icon="bx bx-error-circle"
                bg="#fee2e2"
                color="#dc2626"
              />
            </div>

            <div className="col-xl-3 col-md-6 mb-3">
              <SummaryCard
                title="Stock Issues"
                value={failedStockProducts.length}
                icon="bx bx-package"
                bg="#fff7ed"
                color="#f97316"
              />
            </div>
          </div>

          <div
            className="card border-0 mb-4"
            style={{
              borderRadius: "22px",
              boxShadow: "0 10px 35px rgba(15, 23, 42, 0.08)",
              overflow: "hidden",
            }}
          >
            <div
              className="card-header border-0"
              style={{
                background: "#fff",
                padding: "22px 24px",
              }}
            >
              <div className="row align-items-center">
                <div className="col-lg-6">
                  <h5 className="mb-1 fw-bold text-dark">Upload Orders</h5>
                  <p className="text-muted mb-0">
                    Required columns: Name, Phone, Customer Name, Address, City,
                    State, SKU, Quantity, Total
                  </p>
                </div>

                <div className="col-lg-6 mt-3 mt-lg-0">
                  <div className="d-flex justify-content-lg-end">
                    <label
                      htmlFor="excelUpload"
                      style={{
                        cursor: "pointer",
                        width: "100%",
                        maxWidth: "420px",
                      }}
                    >
                      <div
                        style={{
                          background: "linear-gradient(135deg,#2563eb,#1d4ed8)",
                          borderRadius: "18px",
                          padding: "18px 20px",
                          color: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          boxShadow: "0 8px 25px rgba(37,99,235,0.25)",
                          transition: "0.3s",
                        }}
                      >
                        <div className="d-flex align-items-center">
                          <div
                            style={{
                              width: "50px",
                              height: "50px",
                              borderRadius: "14px",
                              background: "rgba(255,255,255,0.18)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              marginRight: "14px",
                            }}
                          >
                            <i
                              className="bx bx-cloud-upload"
                              style={{
                                fontSize: "26px",
                                color: "#fff",
                              }}
                            />
                          </div>

                          <div>
                            <div
                              style={{
                                fontWeight: 700,
                                fontSize: "15px",
                              }}
                            >
                              Upload Excel File
                            </div>

                            <div
                              style={{
                                fontSize: "12px",
                                opacity: 0.85,
                              }}
                            >
                              XLSX, XLS or CSV
                            </div>
                          </div>
                        </div>

                        <div
                          style={{
                            background: "#fff",
                            color: "#2563eb",
                            padding: "8px 14px",
                            borderRadius: "10px",
                            fontWeight: 600,
                          }}
                        >
                          Browse
                        </div>
                      </div>
                    </label>

                    <input
                      id="excelUpload"
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleExcelUpload}
                      disabled={isLoading}
                      style={{ display: "none" }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div
              className="card-body"
              style={{
                background: "#fff",
                borderTop: "1px solid #edf0f4",
                padding: "20px 24px",
              }}
            >
              <div className="row align-items-center">
                <div className="col-lg-6">
                  <div
                    className="position-relative"
                    style={{ width: "100%", maxWidth: "420px" }}
                  >
                    <i
                      className="bx bx-search"
                      style={{
                        position: "absolute",
                        left: "16px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#94a3b8",
                        fontSize: "20px",
                      }}
                    ></i>

                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search order, customer, phone or reason..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{
                        borderRadius: "14px",
                        padding: "12px 16px 12px 45px",
                        border: "1px solid #e5e7eb",
                        background: "#f8fafc",
                      }}
                    />
                  </div>
                </div>

                <div className="col-lg-6 mt-3 mt-lg-0">
                  <div className="d-flex justify-content-lg-end gap-2 flex-wrap">
                    <span
                      className="badge"
                      style={{
                        background: "#dcfce7",
                        color: "#15803d",
                        borderRadius: "999px",
                        padding: "9px 13px",
                      }}
                    >
                      Valid: {successLogs.length}
                    </span>

                    <span
                      className="badge"
                      style={{
                        background: "#fee2e2",
                        color: "#b91c1c",
                        borderRadius: "999px",
                        padding: "9px 13px",
                      }}
                    >
                      Error: {failureLogs.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {isLoading ? (
            <LoadingCard loadingText={loadingText} />
          ) : (
            <>
              {filteredFailureLogs.length > 0 && (
                <OrderTable
                  title="Failed Orders"
                  subtitle="These orders were not created. Check the highlighted reason column."
                  type="failed"
                  logs={filteredFailureLogs}
                />
              )}

              {filteredSuccessLogs.length > 0 && (
                <OrderTable
                  title="Success Orders"
                  subtitle="These orders were created successfully in backend."
                  type="success"
                  logs={filteredSuccessLogs}
                />
              )}

              {successLogs.length === 0 && failureLogs.length === 0 && (
                <EmptyCard />
              )}
            </>
          )}
        </div>
      </div>

      <ToastContainer />
    </Fragment>
  );
};

const SummaryCard = ({ title, value, icon, bg, color }) => {
  return (
    <div
      className="card border-0 h-100"
      style={{
        borderRadius: "18px",
        boxShadow: "0 8px 25px rgba(15, 23, 42, 0.06)",
      }}
    >
      <div className="card-body">
        <div className="d-flex align-items-center justify-content-between">
          <div>
            <p className="text-muted mb-1">{title}</p>
            <h3 className="mb-0 fw-bold">{value}</h3>
          </div>

          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "15px",
              background: bg,
              color,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
            }}
          >
            <i className={icon}></i>
          </div>
        </div>
      </div>
    </div>
  );
};

const formatBackendError = (error) => {
  if (!error) return "No backend error response";

  if (typeof error === "string") return error;

  if (typeof error === "object") {
    return Object.entries(error)
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          return `${key}: ${value.join(", ")}`;
        }

        if (typeof value === "object" && value !== null) {
          return `${key}: ${JSON.stringify(value)}`;
        }

        return `${key}: ${value}`;
      })
      .join("\n");
  }

  return String(error);
};

const OrderTable = ({ title, subtitle, logs, type }) => {
  const isFailed = type === "failed";

  return (
    <div
      className="card border-0 mb-4"
      style={{
        borderRadius: "22px",
        boxShadow: "0 10px 35px rgba(15, 23, 42, 0.08)",
        overflow: "hidden",
      }}
    >
      <div
        className="card-header border-0"
        style={{
          background: "#fff",
          padding: "22px 24px",
        }}
      >
        <h5
          className="mb-1 fw-bold"
          style={{ color: isFailed ? "#dc2626" : "#15803d" }}
        >
          {title}: {logs.length}
        </h5>
        <p className="text-muted mb-0">{subtitle}</p>
      </div>

      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead>
              <tr
                style={{
                  background: "#f8fafc",
                  borderTop: "1px solid #edf0f4",
                }}
              >
                <TableHead>#</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Products</TableHead>
                {isFailed ? (
                  <>
                    <TableHead>Failed Step</TableHead>
                    <TableHead>Highlighted Reason</TableHead>
                  </>
                ) : (
                  <>
                    <TableHead>Status</TableHead>
                    <TableHead>Backend ID</TableHead>
                  </>
                )}
              </tr>
            </thead>

            <tbody>
              {logs.map((log, index) => (
                <tr
                  key={index}
                  style={{
                    borderBottom: "1px solid #f1f5f9",
                    background: isFailed ? "#fffafa" : "#ffffff",
                  }}
                >
                  <td style={tdStyle}>{index + 1}</td>

                  <td style={tdStyle}>
                    <h6 className="mb-1 fw-bold text-dark">
                      {log.orderName}
                    </h6>
                    <span style={smallText}>Excel ID: {log.orderId}</span>
                    <br />
                    <span style={smallText}>
                      Payment: {log.paymentMethod || "N/A"}
                    </span>
                  </td>

                  <td style={tdStyle}>
                    <h6 className="mb-1 fw-bold text-dark">
                      {log.customerName}
                    </h6>
                    <span style={smallText}>Phone: {log.phone || "N/A"}</span>
                    <br />
                    <span style={smallText}>City: {log.city || "N/A"}</span>
                    <br />
                    <span style={smallText}>State: {log.state || "N/A"}</span>
                  </td>

                  <td style={tdStyle}>
                    <span
                      className="badge"
                      style={{
                        background: "#f1f5f9",
                        color: "#334155",
                        borderRadius: "999px",
                        padding: "8px 12px",
                        fontSize: "13px",
                      }}
                    >
                      ₹{log.amount}
                    </span>
                  </td>

                  <td style={tdStyle}>
                    {log.products.length > 0 ? (
                      <div style={{ minWidth: "230px" }}>
                        {log.products.map((product, i) => (
                          <div
                            key={i}
                            style={{
                              background: "#f8fafc",
                              border: "1px solid #e5e7eb",
                              borderRadius: "10px",
                              padding: "8px 10px",
                              marginBottom: "6px",
                            }}
                          >
                            <div className="fw-bold text-dark">
                              {product.title}
                            </div>
                            <span style={smallText}>
                              SKU: {product.sku} | Qty: {product.quantity}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span
                        className="badge"
                        style={{
                          background: "#fee2e2",
                          color: "#b91c1c",
                          borderRadius: "999px",
                          padding: "8px 12px",
                        }}
                      >
                        No products
                      </span>
                    )}
                  </td>

                  {isFailed ? (
                    <>
                      <td style={tdStyle}>
                        <span
                          className="badge"
                          style={{
                            background: "#ffedd5",
                            color: "#c2410c",
                            borderRadius: "999px",
                            padding: "8px 12px",
                          }}
                        >
                          {log.step}
                        </span>
                      </td>

                      <td style={tdStyle}>
                        <div
                          style={{
                            minWidth: "280px",
                            border: "2px solid #ef4444",
                            background: "#fef2f2",
                            borderRadius: "14px",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              background: "#ef4444",
                              color: "#fff",
                              padding: "8px 12px",
                              fontWeight: 800,
                              fontSize: "12px",
                              textTransform: "uppercase",
                              letterSpacing: "0.04em",
                            }}
                          >
                            Reason
                          </div>

                          <div
                            style={{
                              padding: "12px",
                              color: "#991b1b",
                              fontWeight: 700,
                              lineHeight: "1.5",
                              whiteSpace: "pre-wrap",
                            }}
                          >
                            {log.reason}
                            {log.backendError && (
                              <>
                                {"\n\n"}
                                {formatBackendError(log.backendError)}
                              </>
                            )}
                          </div>

                          <div
                            style={{
                              padding: "10px 12px",
                              borderTop: "1px solid #fecaca",
                              background: "#fff",
                              color: "#64748b",
                              fontSize: "12px",
                            }}
                          >
                            Status Code: {log.statusCode}
                          </div>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={tdStyle}>
                        <span
                          className="badge"
                          style={{
                            background: "#dcfce7",
                            color: "#15803d",
                            borderRadius: "999px",
                            padding: "8px 12px",
                          }}
                        >
                          <i className="bx bx-check me-1"></i>
                          Created
                        </span>
                      </td>

                      <td style={tdStyle}>
                        <strong>{log.backendOrderId || "N/A"}</strong>
                        <br />
                        <span style={smallText}>
                          Customer ID: {log.customerId || "N/A"}
                        </span>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const TableHead = ({ children }) => {
  return (
    <th
      style={{
        padding: "16px 22px",
        color: "#64748b",
        fontSize: "12px",
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        borderBottom: "1px solid #edf0f4",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </th>
  );
};

const LoadingCard = ({ loadingText }) => {
  return (
    <div
      className="card border-0"
      style={{
        borderRadius: "22px",
        boxShadow: "0 10px 35px rgba(15, 23, 42, 0.08)",
      }}
    >
      <div className="card-body p-4">
        {[1, 2, 3, 4, 5].map((item) => (
          <div
            key={item}
            className="d-flex align-items-center mb-3"
            style={{
              padding: "16px",
              background: "#f8fafc",
              borderRadius: "16px",
            }}
          >
            <div
              style={{
                width: "58px",
                height: "58px",
                borderRadius: "14px",
                background: "#e5e7eb",
              }}
            ></div>

            <div className="flex-grow-1 ms-3">
              <div
                style={{
                  height: "14px",
                  width: "40%",
                  background: "#e5e7eb",
                  borderRadius: "10px",
                  marginBottom: "10px",
                }}
              ></div>
              <div
                style={{
                  height: "12px",
                  width: "25%",
                  background: "#edf2f7",
                  borderRadius: "10px",
                }}
              ></div>
            </div>
          </div>
        ))}

        <p className="text-center text-muted mb-0">{loadingText}</p>
      </div>
    </div>
  );
};

const EmptyCard = () => {
  return (
    <div
      className="card border-0"
      style={{
        borderRadius: "22px",
        boxShadow: "0 10px 35px rgba(15, 23, 42, 0.08)",
      }}
    >
      <div className="card-body text-center" style={{ padding: "70px 20px" }}>
        <div
          style={{
            width: "82px",
            height: "82px",
            borderRadius: "26px",
            background: "#f1f5f9",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 18px",
            color: "#64748b",
            fontSize: "38px",
          }}
        >
          <i className="bx bx-upload"></i>
        </div>

        <h5 className="fw-bold text-dark mb-2">No orders uploaded yet</h5>
        <p className="text-muted mb-0">
          Upload an Excel or CSV file to start bulk order creation.
        </p>
      </div>
    </div>
  );
};

const tdStyle = {
  padding: "18px 22px",
  verticalAlign: "top",
};

const smallText = {
  fontSize: "12px",
  color: "#64748b",
};

export default OrdersComponent;
