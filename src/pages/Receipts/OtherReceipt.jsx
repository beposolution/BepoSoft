import React, { useState, useEffect } from "react";
import axios from 'axios';
import { ToastContainer, toast } from "react-toastify";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { Card, CardBody, Col, Row, Label, CardTitle, Form, Input, Button } from "reactstrap";
import Select from 'react-select';
import { createAuditLog } from "../../services/auditService";

const OtherReceipt = () => {
  const [banks, setBanks] = useState([]);
  const token = localStorage.getItem("token");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedBank, setSelectedBank] = useState(null);

  const authHeaders = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json"
  };

  const [formData, setFormData] = useState({
    bank: '',
    amount: '',
    received_at: '',
    transactionID: '',
    remark: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const createOtherReceiptDataLog = async (
    receiptData,
    responseData = null,
    bankData = null
  ) => {
    try {
      const afterData = {
        amount:
          responseData?.amount ??
          Number(receiptData.amount || 0),

        bank:
          responseData?.bank_name ??
          bankData?.label ??
          "",

        bank_id:
          responseData?.bank ??
          receiptData.bank ??
          "",

        transactionID:
          responseData?.transactionID ??
          receiptData.transactionID ??
          "",

        received_at:
          responseData?.received_at ??
          receiptData.received_at ??
          "",

        remark:
          responseData?.remark ??
          receiptData.remark ??
          "",
      };

      const auditCreated = await createAuditLog({
        action: "other_receipt_created_website",
        beforeData: {},
        afterData: afterData,
      });

      if (!auditCreated) {
        console.error(
          "Other receipt created successfully, but DataLog creation failed."
        );

        return false;
      }

      return true;
    } catch (error) {
      console.error(
        "Other Receipt DataLog creation error:",
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
      // Keep submitted values before clearing the form
      const submittedData = {
        ...formData
      };

      const submittedBank = selectedBank
        ? { ...selectedBank }
        : null;

      // Create receipt
      const response = await axios.post(
        `${import.meta.env.VITE_APP_KEY}bank-receipts/`,
        submittedData,
        {
          headers: authHeaders
        }
      );

      if (
        response.status === 201 ||
        response.status === 200
      ) {
        toast.success(
          "Receipt created successfully"
        );

        // Get backend-created receipt
        const createdReceipt =
          response?.data?.data ??
          response?.data ??
          null;

        // Create DataLog
        const auditCreated =
          await createOtherReceiptDataLog(
            submittedData,
            createdReceipt,
            submittedBank
          );

        if (!auditCreated) {
          console.error(
            "Receipt created successfully, but DataLog creation failed."
          );

          toast.warn(
            "Receipt saved, but logging to DataLog failed."
          );
        }

        // Reset form
        setFormData({
          bank: "",
          amount: "",
          received_at: "",
          transactionID: "",
          remark: ""
        });

        setSelectedBank(null);
      }
    } catch (error) {
      toast.error(
        "Failed to create receipt"
      );

      if (error.response?.data) {
        toast.error(
          "Details: " +
          JSON.stringify(error.response.data)
        );
      }

      console.error(
        "Other receipt error:",
        error?.response?.data ||
        error.message
      );
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
