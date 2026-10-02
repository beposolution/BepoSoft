import React, { useState, useEffect } from "react";
import axios from 'axios';
import { ToastContainer, toast } from "react-toastify";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { Card, CardBody, Col, Row, Label, CardTitle, Form, Input, Button } from "reactstrap";
import Select from 'react-select';
import { createAuditLog } from "../../services/auditService";

const InternalTransfer = () => {
  const [banks, setBanks] = useState([]);
  const token = localStorage.getItem("token");

  const [fromBank, setFromBank] = useState(null);
  const [toBank, setToBank] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    sender_bank: '',
    receiver_bank: '',
    amount: '',
    created_at: '',
    transactionID: '',
    description: ''
  });

  useEffect(() => {
    const fetchbanks = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_APP_KEY}banks/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.status === 200) {
          setBanks(response?.data?.data);
        }
      } catch (error) {
        toast.error('Error fetching bank data:');
      }
    };
    fetchbanks();
  }, []);

  const createInternalTransferDataLog = async (
    transferData,
    responseData = null,
    senderBank = null,
    receiverBank = null
  ) => {
    try {
      const afterData = {
        amount:
          responseData?.amount ??
          Number(transferData.amount || 0),

        sender_bank:
          responseData?.sender_bank_name ??
          senderBank?.label ??
          "",

        sender_bank_id:
          responseData?.sender_bank ??
          transferData.sender_bank ??
          "",

        receiver_bank:
          responseData?.receiver_bank_name ??
          receiverBank?.label ??
          "",

        receiver_bank_id:
          responseData?.receiver_bank ??
          transferData.receiver_bank ??
          "",

        transactionID:
          responseData?.transactionID ??
          transferData.transactionID ??
          "",

        created_at:
          responseData?.created_at ??
          transferData.created_at ??
          "",

        description:
          responseData?.description ??
          transferData.description ??
          "",
      };

      const auditCreated = await createAuditLog({
        action: "internal_bank_transfer_website",
        beforeData: {},
        afterData: afterData,
      });

      if (!auditCreated) {
        console.error(
          "Internal transfer successful, but DataLog creation failed."
        );

        return false;
      }

      return true;
    } catch (error) {
      console.error(
        "Internal Transfer DataLog creation error:",
        error
      );

      return false;
    }
  };

  const handleSubmit = async () => {
    try {
      // Keep a copy of the submitted data for DataLog
      const submittedData = {
        ...formData
      };

      const submittedFromBank = fromBank
        ? { ...fromBank }
        : null;

      const submittedToBank = toBank
        ? { ...toBank }
        : null;

      // Create internal bank transfer
      const response = await axios.post(
        `${import.meta.env.VITE_APP_KEY}internal/transfers/`,
        submittedData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      if (response.status === 201) {
        toast.success("Amount transferred successfully");

        // Get created transfer response
        const createdTransfer =
          response?.data?.data ??
          response?.data ??
          null;

        // Create DataLog
        const auditCreated =
          await createInternalTransferDataLog(
            submittedData,
            createdTransfer,
            submittedFromBank,
            submittedToBank
          );

        if (!auditCreated) {
          console.error(
            "Transfer successful, but DataLog creation failed."
          );

          toast.warn(
            "Transfer saved, but logging to DataLog failed."
          );
        }

        // Clear form only after transfer + audit processing
        setFormData({
          sender_bank: "",
          receiver_bank: "",
          amount: "",
          created_at: "",
          transactionID: "",
          description: ""
        });

        setFromBank(null);
        setToBank(null);
      }
    } catch (error) {
      console.error(
        "Internal transfer error:",
        error?.response?.data ||
        error?.message ||
        error
      );

      toast.error("Failed to transfer amount");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFromBankChange = (selected) => {
    setFromBank(selected);
    setFormData(prev => ({ ...prev, sender_bank: selected ? selected.value : '' }));
  };

  const handleToBankChange = (selected) => {
    setToBank(selected);
    setFormData(prev => ({ ...prev, receiver_bank: selected ? selected.value : '' }));
  };

  return (
    <React.Fragment>
      <div className="page-content">
        <div className="container-fluid">
          <Breadcrumbs title="TRANSFER" breadcrumbItem="INTERNAL BANK TRANSFER" />
          <Row>
            <Col xl={12}>
              <Card>
                <CardBody>
                  <CardTitle className="mb-4">INTERNAL BANK TRANSFER</CardTitle>
                  <Form onSubmit={(e) => e.preventDefault()}>
                    <Row>
                      <Col md={4}>
                        <div className="mb-3">
                          <Label>Sender Bank</Label>
                          <Select
                            value={fromBank}
                            onChange={handleFromBankChange}
                            options={banks.map(bank => ({ label: bank.name, value: bank.id }))}
                            isClearable
                            placeholder="Select Bank"
                          />
                        </div>
                      </Col>
                      <Col md={4}>
                        <div className="mb-3">
                          <Label>Receiver Bank</Label>
                          <Select
                            value={toBank}
                            onChange={handleToBankChange}
                            options={banks.map(bank => ({ label: bank.name, value: bank.id }))}
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
                    </Row>
                    <Row>
                      <Col md={4}>
                        <div className="mb-3">
                          <Label>Transfer Date</Label>
                          <Input type="date" name="created_at" value={formData.created_at} onChange={handleChange} />
                        </div>
                      </Col>
                      <Col md={4}>
                        <div className="mb-3">
                          <Label>Transaction ID</Label>
                          <Input type="text" name="transactionID" value={formData.transactionID} onChange={handleChange} />
                        </div>
                      </Col>
                      <Col md={4}>
                        <div className="mb-3">
                          <Label>Description</Label>
                          <Input type="text" name="description" value={formData.description} onChange={handleChange} />
                        </div>
                      </Col>
                    </Row>
                    <Row>
                      <Col>
                        <Button
                          color="primary"
                          onClick={handleSubmit}
                          disabled={
                            !formData.sender_bank ||
                            !formData.receiver_bank ||
                            !formData.amount ||
                            !formData.created_at
                          }
                        >
                          {isSubmitting ? "Transferring..." : "Transfer Amount"}
                        </Button>
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
  )
}

export default InternalTransfer;
