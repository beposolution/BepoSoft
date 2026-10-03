import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { Card, CardBody, Col, Row, Label, CardTitle, Form, Input, Button } from "reactstrap";
import Select from "react-select";
import { createAuditLog } from "../../services/auditService";

const OrderReceipt = () => {
  const { id } = useParams(); // get order ID from route
  const token = localStorage.getItem("token");
  const [banks, setBanks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [order, setOrder] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedBank, setSelectedBank] = useState(null);
  const [searchBank, setSearchBank] = useState("");
  const [searchOrder, setSearchOrder] = useState("");

  const [formData, setFormData] = useState({
    bank: "",
    amount: "",
    received_at: "",
    transactionID: "",
    remark: "",
  });

  const authHeaders = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const createOrderReceiptDataLog = async (
    receiptData,
    responseData = null,
    orderData = null,
    bankData = null
  ) => {
    try {
      const afterData = {
        receipt_id:
          responseData?.id ??
          null,

        payment_receipt:
          responseData?.payment_receipt ??
          responseData?.receipt_no ??
          "",

        order:
          orderData?.label ??
          "",

        order_id:
          responseData?.order ??
          receiptData?.order ??
          "",

        bank:
          responseData?.bank_name ??
          bankData?.label ??
          "",

        bank_id:
          responseData?.bank ??
          receiptData?.bank ??
          "",

        amount:
          responseData?.amount ??
          Number(receiptData?.amount || 0),

        received_at:
          responseData?.received_at ??
          receiptData?.received_at ??
          "",

        transactionID:
          responseData?.transactionID ??
          receiptData?.transactionID ??
          "",

        remark:
          responseData?.remark ??
          receiptData?.remark ??
          "",
      };

      const auditCreated = await createAuditLog({
        action: "order_receipt_created_website",
        beforeData: {},
        afterData: afterData,
        orderId: receiptData?.order || null,
      });

      if (!auditCreated) {
        console.error(
          "Order receipt created successfully, but DataLog creation failed."
        );

        return false;
      }

      return true;
    } catch (error) {
      console.error(
        "Order Receipt DataLog creation error:",
        error
      );

      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent duplicate submission
    if (isLoading) {
      return;
    }


    if (!selectedOrderId) {
      toast.error("Please select an order.");
      return;
    }

    if (!formData.bank) {
      toast.error("Please select a bank.");
      return;
    }

    if (!formData.amount) {
      toast.error("Please enter amount.");
      return;
    }

    setIsLoading(true);

    try {

      const submittedData = {
        order: Number(selectedOrderId),
        bank: Number(formData.bank),
        amount: formData.amount,
        received_at: formData.received_at,
        transactionID: formData.transactionID,
        remark: formData.remark,
      };

      const submittedOrder = selectedOrder
        ? { ...selectedOrder }
        : null;

      const submittedBank = selectedBank
        ? { ...selectedBank }
        : null;

      const receiptPayload = {
        bank: submittedData.bank,
        amount: submittedData.amount,
        received_at: submittedData.received_at,
        transactionID: submittedData.transactionID,
        remark: submittedData.remark,
      };

      const response = await axios.post(
        `${import.meta.env.VITE_APP_KEY}payment/${submittedData.order}/reciept/`,
        receiptPayload,
        {
          headers: authHeaders,
        }
      );

      if (
        response?.status === 200 ||
        response?.status === 201
      ) {
        toast.success(
          "Order receipt created successfully!"
        );

        // Supports APIs returning:
        // { data: {...} }
        // or directly {...}
        const createdReceipt =
          response?.data?.data ??
          response?.data ??
          null;


        const auditCreated =
          await createOrderReceiptDataLog(
            submittedData,
            createdReceipt,
            submittedOrder,
            submittedBank
          );

        // Receipt remains successfully created even if logging fails
        if (!auditCreated) {
          console.error(
            "Order receipt created successfully, but DataLog creation failed."
          );

          toast.warn(
            "Order receipt saved, but logging to DataLog failed."
          );
        }


        setFormData({
          bank: "",
          amount: "",
          received_at: "",
          transactionID: "",
          remark: "",
        });

        setSelectedBank(null);
        setSelectedOrderId("");
        setSelectedOrder(null);
      }
    } catch (error) {

      console.error(
        "Order receipt creation error:",
        error?.response?.data ||
        error?.message ||
        error
      );

      toast.error(
        "Failed to create order receipt"
      );

      if (error?.response?.data) {
        console.error(
          "Order receipt API error details:",
          error.response.data
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchBanks = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_APP_KEY}banks/`, {
          headers: authHeaders,
        });
        if (response?.status === 200) {
          setBanks(response?.data?.data);
        }
      } catch (error) {
        toast.error("Error fetching banks");
      }
    };
    fetchBanks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const fetchOrders = async (search = "") => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_APP_KEY}orders/?search=${search}`,
        { headers: authHeaders }
      );

      if (response.status === 200) {
        setOrder(response?.data?.results?.results || []);
      }
    } catch (error) {
      toast.error("Error fetching orders");
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleOrderSearch = (inputValue) => {
    setSearchOrder(inputValue);
    fetchOrders(inputValue);
  };

  const filteredBanks = banks.filter((bank) =>
    (bank?.name || "").toLowerCase().includes(searchBank.toLowerCase())
  );

  const filteredOrders = order.filter(
    (ord) =>
      (ord?.invoice || "").toLowerCase().includes(searchOrder.toLowerCase()) ||
      (ord?.customer?.name || "").toLowerCase().includes(searchOrder.toLowerCase())
  );

  const handleBankChange = (selected) => {
    setSelectedBank(selected);
    setFormData((prev) => ({ ...prev, bank: selected ? selected.value : "" }));
  };

  const handleOrderChange = (selected) => {
    setSelectedOrder(selected);
    setSelectedOrderId(selected ? selected.value : "");
  };

  return (
    <React.Fragment>
      <div className="page-content">
        <div className="container-fluid">
          <Breadcrumbs title="PAYMENTS" breadcrumbItem="ORDER RECEIPT" />
          <Row>
            <Col xl={12}>
              <Card>
                <CardBody>
                  <CardTitle className="mb-4">ORDER RECEIPT</CardTitle>
                  <Form onSubmit={handleSubmit}>
                    <Row>
                      <Col md={4}>
                        <div className="mb-3">
                          <Label>Orders</Label>
                          <Select
                            value={selectedOrder}
                            onChange={handleOrderChange}
                            onInputChange={handleOrderSearch}
                            options={order.map((o) => ({
                              label: `${o.invoice} - ${o.customer?.name} - ₹${o.total_amount}`,
                              value: o.id,
                            }))}
                            isClearable
                            placeholder="Search Order"
                          />
                        </div>
                      </Col>
                      <Col md={4}>
                        <div className="mb-3">
                          <Label>Bank</Label>
                          <Select
                            value={selectedBank}
                            onChange={handleBankChange}
                            options={filteredBanks.map((bank) => ({
                              label: bank.name,
                              value: bank.id,
                            }))}
                            isClearable
                            placeholder="Select Bank"
                          />
                        </div>
                      </Col>
                      <Col md={4}>
                        <div className="mb-3">
                          <Label>Amount</Label>
                          <Input
                            type="number"
                            name="amount"
                            value={formData.amount}
                            onChange={handleChange}
                          />
                        </div>
                      </Col>
                    </Row>
                    <Row>
                      <Col md={4}>
                        <div className="mb-3">
                          <Label>Received Date</Label>
                          <Input
                            type="date"
                            name="received_at"
                            value={formData.received_at}
                            onChange={handleChange}
                          />
                        </div>
                      </Col>
                      <Col md={4}>
                        <div className="mb-3">
                          <Label>Transaction ID</Label>
                          <Input
                            type="text"
                            name="transactionID"
                            value={formData.transactionID}
                            onChange={handleChange}
                          />
                        </div>
                      </Col>
                      <Col md={4}>
                        <div className="mb-3">
                          <Label>Remarks</Label>
                          <Input
                            type="text"
                            name="remark"
                            value={formData.remark}
                            onChange={handleChange}
                          />
                        </div>
                      </Col>
                    </Row>
                    <Row>
                      <Col md={3}>
                        <div className="w-5">
                          <Button
                            color="primary"
                            type="submit"
                            className="mt-4 w-100"
                            disabled={isLoading}
                          >
                            {isLoading ? "Creating..." : "Create Receipt"}
                          </Button>
                        </div>
                      </Col>
                    </Row>
                  </Form>
                </CardBody>
              </Card>
            </Col>
          </Row>
          <ToastContainer />
        </div>
      </div>
    </React.Fragment>
  );
};

export default OrderReceipt;
