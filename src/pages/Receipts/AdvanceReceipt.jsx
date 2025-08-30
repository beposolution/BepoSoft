import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { Card, CardBody, Col, Row, Label, CardTitle, Form, Input, Button } from "reactstrap";
import "react-toastify/dist/ReactToastify.css";
import Select from "react-select";

const AdvanceReceipt = () => {
  const [banks, setBanks] = useState([]);
  const token = localStorage.getItem("token");
  const [isLoading, setIsLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [selectedBank, setSelectedBank] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const [formData, setFormData] = useState({
    bank: "",
    amount: "",
    received_at: "",
    transactionID: "",
    remark: "",
    customer: "",
  });

  const authHeaders = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ---- NEW: post to datalog after advance receipt success
  const postDataLog = async () => {
    // Build payload similar to the order-receipt page; here we log the customer instead of order.
    const payload = {
      // If your backend allows recording customer context, include it:
      customer: formData.customer ? Number(formData.customer) : undefined,
      before_data: { Action: "Advance Receipt Added" },
      after_data: {
        amount: Number(formData.amount || 0),
        bank_name: selectedBank?.label || "",
        customer_name: selectedCustomer?.label || "",
        transactionID: formData.transactionID || "",
        received_at: formData.received_at || "",
        remark: formData.remark || "",
      },
    };

    try {
      await axios.post(`${import.meta.env.VITE_APP_KEY}datalog/create/`, payload, {
        headers: authHeaders,
      });
      // optional: toast.info("Advance receipt action logged.");
    } catch (err) {
      toast.warn("Advance receipt saved, but logging to DataLog failed.");
      console.error("DataLog error:", err?.response?.data || err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.bank) return toast.error("Please select a bank.");
    if (!formData.customer) return toast.error("Please select a customer.");
    if (!formData.amount) return toast.error("Please enter amount.");

    setIsLoading(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_APP_KEY}advancereceipt/`,
        formData,
        { headers: authHeaders }
      );

      if (response.status === 201 || response.status === 200) {
        toast.success("Advance receipt created successfully");

        // ---- NEW: fire the datalog create call (does not block success)
        await postDataLog();

        // reset form + selects
        setFormData({
          bank: "",
          amount: "",
          received_at: "",
          transactionID: "",
          customer: "",
          remark: "",
        });
        setSelectedBank(null);
        setSelectedCustomer(null);
      }
    } catch (error) {
      toast.error("Failed to create advance receipt");
      if (error.response?.data) {
        toast.error("Details: " + JSON.stringify(error.response.data));
      }
      console.error("Advance receipt error:", error?.response?.data || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchbanks = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_APP_KEY}banks/`, {
          headers: authHeaders,
        });
        if (response.status === 200) setBanks(response?.data?.data);
      } catch {
        toast.error("Error fetching bank data");
      }
    };
    fetchbanks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_APP_KEY}customers/`, {
          headers: authHeaders,
        });
        if (response.status === 200) setCustomers(response?.data?.data);
      } catch {
        toast.error("Error fetching customer data");
      }
    };
    fetchCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBankChange = (selected) => {
    setSelectedBank(selected);
    setFormData((prev) => ({ ...prev, bank: selected ? selected.value : "" }));
  };

  const handleCustomerChange = (selected) => {
    setSelectedCustomer(selected);
    setFormData((prev) => ({ ...prev, customer: selected ? selected.value : "" }));
  };

  return (
    <React.Fragment>
      <div className="page-content">
        <div className="container-fluid">
          <Breadcrumbs title="PAYMENTS" breadcrumbItem="ADVANCE RECEIPT" />
          <Row>
            <Col xl={12}>
              <Card>
                <CardBody>
                  <CardTitle className="mb-4">ADVANCE RECEIPTS</CardTitle>
                  <Form onSubmit={handleSubmit}>
                    <Row>
                      <Col md={4}>
                        <div className="mb-3">
                          <Label>Bank</Label>
                          <Select
                            value={selectedBank}
                            onChange={handleBankChange}
                            options={banks.map((bank) => ({
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
                    </Row>
                    <Row>
                      <Col md={4}>
                        <div className="mb-3">
                          <Label>Customer</Label>
                          <Select
                            value={selectedCustomer}
                            onChange={handleCustomerChange}
                            options={customers.map((c) => ({
                              label: `${c.name} (${c.phone})`,
                              value: c.id,
                            }))}
                            isClearable
                            placeholder="Select Customer"
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
        </div>
        <ToastContainer />
      </div>
    </React.Fragment>
  );
};

export default AdvanceReceipt;
