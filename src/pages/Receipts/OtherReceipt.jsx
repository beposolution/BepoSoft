import React, { useState, useEffect } from "react";
import axios from 'axios';
import { ToastContainer, toast } from "react-toastify";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { Card, CardBody, Col, Row, Label, CardTitle, Form, Input, Button } from "reactstrap";
import Select from 'react-select';

const OtherReceipt = () => {
  const [banks, setBanks] = useState([]);
  const token = localStorage.getItem("token");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedBank, setSelectedBank] = useState(null);

  const [formData, setFormData] = useState({
    bank: '',
    amount: '',
    received_at: '',
    transactionID: '',
    remark: ''
  });

  const authHeaders = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // --- NEW: DataLog POST after success
  const postDataLog = async () => {
    const payload = {
      // No order/customer context for "Other Receipt"; logging the action only.
      before_data: { Action: "Creating Bank Receipt" },
      after_data: {
        Data: "Amount, Bank",
        amount: Number(formData.amount || 0),
        bank_name: selectedBank?.label || "",
        transactionID: formData.transactionID || "",
        received_at: formData.received_at || "",
        remark: formData.remark || ""
      }
    };

    try {
      await axios.post(`${import.meta.env.VITE_APP_KEY}datalog/create/`, payload, {
        headers: authHeaders
      });
      // optional: toast.info("Action logged.");
    } catch (err) {
      toast.warn("Receipt saved, but logging to DataLog failed.");
      console.error("DataLog error:", err?.response?.data || err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.bank) return toast.error("Please select a bank.");
    if (!formData.amount) return toast.error("Please enter amount.");

    setIsLoading(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_APP_KEY}bank-receipts/`,
        formData,
        { headers: authHeaders }
      );

      if (response.status === 201 || response.status === 200) {
        toast.success("Receipt created successfully");

        // --- NEW: log to datalog (non-blocking to user success)
        await postDataLog();

        // Reset form + selector
        setFormData({
          bank: '',
          amount: '',
          received_at: '',
          transactionID: '',
          remark: ''
        });
        setSelectedBank(null);
      }
    } catch (error) {
      toast.error("Failed to create receipt");
      if (error.response?.data) {
        toast.error("Details: " + JSON.stringify(error.response.data));
      }
      console.error("Other receipt error:", error?.response?.data || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchbanks = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_APP_KEY}banks/`, {
          headers: authHeaders
        });
        if (response.status === 200) {
          setBanks(response?.data?.data);
        }
      } catch (error) {
        toast.error('Error fetching bank data');
      }
    };
    fetchbanks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBankChange = (selected) => {
    setSelectedBank(selected);
    setFormData(prev => ({ ...prev, bank: selected ? selected.value : '' }));
  };

  return (
    <React.Fragment>
      <div className="page-content">
        <div className="container-fluid">
          <Breadcrumbs title="PAYMENTS" breadcrumbItem="OTHER RECEIPT" />
          <Row>
            <Col xl={12}>
              <Card>
                <CardBody>
                  <CardTitle className="mb-4">OTHER RECEIPTS</CardTitle>
                  {/* switched to onSubmit to support Enter key + proper form semantics */}
                  <Form onSubmit={handleSubmit}>
                    <Row>
                      <Col md={4}>
                        <div className="mb-3">
                          <Label>Bank</Label>
                          <Select
                            value={selectedBank}
                            onChange={handleBankChange}
                            options={banks.map(bank => ({
                              label: bank.name,
                              value: bank.id
                            }))}
                            isClearable
                            placeholder="Select Bank"
                          />
                        </div>
                      </Col>
                      <Col md={4}>
                        <div className="mb-3">
                          <Label>Amount</Label>
                          <Input type="number" name="amount" value={formData.amount} onChange={handleChange} />
                        </div>
                      </Col>
                      <Col md={4}>
                        <div className="mb-3">
                          <Label>Received Date</Label>
                          <Input type="date" name="received_at" value={formData.received_at} onChange={handleChange} />
                        </div>
                      </Col>
                    </Row>
                    <Row>
                      <Col md={6}>
                        <div className="mb-3">
                          <Label>Transaction ID</Label>
                          <Input type="text" name="transactionID" value={formData.transactionID} onChange={handleChange} />
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="mb-3">
                          <Label>Remarks</Label>
                          <Input type="text" name="remark" value={formData.remark} onChange={handleChange} />
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

export default OtherReceipt;
