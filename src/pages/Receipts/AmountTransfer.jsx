import React, { useState } from 'react';
import axios from 'axios';
import Breadcrumbs from "../../components/Common/Breadcrumb";
import {
    Card,
    Col,
    Container,
    Row,
    CardBody,
    CardTitle,
    Label,
    Input,
    Button,
    Spinner
} from "reactstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AsyncSelect from "react-select/async";
import { createAuditLog } from "../../services/auditService";

const AmountTransfer = () => {
    const token = localStorage.getItem("token");

    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        send_from: null,
        send_to: null,
        amount: "",
        date: "",
        note: "",
        images: [],
    });

    const loadCustomerOptions = async (inputValue) => {
        try {
            const res = await axios.get(
                `${import.meta.env.VITE_APP_KEY}customers/`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                    params: {
                        search: inputValue || ""
                    }
                }
            );

            const options = (res.data?.results || []).map((c) => ({
                value: c.id,
                label: c.name,
                phone: c.phone,
                email: c.email,
            }));

            return options;
        } catch (error) {
            console.error("Customer search failed:", error);
            return [];
        }
    };

    const handleFileChange = (e) => {
        setFormData((prev) => ({
            ...prev,
            images: Array.from(e.target.files),
        }));
    };

    const createAmountTransferDataLog = async (
        transferData,
        responseData = null
    ) => {
        try {
            const afterData = {
                transfer_id:
                    responseData?.id ??
                    "",

                reference_no:
                    responseData?.id
                        ? `TRANSFER-${responseData.id}`
                        : "",

                send_from:
                    responseData?.send_from_name ??
                    transferData?.send_from?.label ??
                    "",

                send_from_id:
                    responseData?.send_from ??
                    transferData?.send_from?.value ??
                    "",

                send_to:
                    responseData?.send_to_name ??
                    transferData?.send_to?.label ??
                    "",

                send_to_id:
                    responseData?.send_to ??
                    transferData?.send_to?.value ??
                    "",

                amount:
                    responseData?.amount ??
                    Number(transferData?.amount || 0),

                date:
                    responseData?.date ??
                    transferData?.date ??
                    "",

                note:
                    responseData?.note ??
                    transferData?.note ??
                    "",

                image_count:
                    transferData?.images?.length ?? 0,
            };

            const auditCreated = await createAuditLog({
                action: "advance_amount_transfer_created_website",
                beforeData: {},
                afterData: afterData,
            });

            if (!auditCreated) {
                console.error(
                    "Advance amount transfer created successfully, but DataLog creation failed."
                );

                return false;
            }

            return true;
        } catch (error) {
            console.error(
                "Advance Amount Transfer DataLog creation error:",
                error
            );

            return false;
        }
    };

    const handleSubmit = async () => {
        // Prevent duplicate submission
        if (loading) {
            return;
        }

        // ============================================================
        // VALIDATION
        // ============================================================

        if (
            !formData.send_from ||
            !formData.send_to ||
            !formData.amount ||
            !formData.date
        ) {
            toast.error("Please fill all required fields");
            return;
        }

        if (
            formData.send_from.value ===
            formData.send_to.value
        ) {
            toast.error(
                "Send From and Send To cannot be the same customer"
            );
            return;
        }

        setLoading(true);

        try {
            // KEEP SUBMITTED DATA FOR AUDIT LOG

            const submittedData = {
                send_from: formData.send_from
                    ? { ...formData.send_from }
                    : null,

                send_to: formData.send_to
                    ? { ...formData.send_to }
                    : null,

                amount: formData.amount,
                date: formData.date,
                note: formData.note,

                images: [...formData.images],
            };

            // CREATE MULTIPART PAYLOAD

            const payload = new FormData();

            payload.append(
                "send_from",
                submittedData.send_from.value
            );

            payload.append(
                "send_to",
                submittedData.send_to.value
            );

            payload.append(
                "amount",
                submittedData.amount
            );

            payload.append(
                "date",
                submittedData.date
            );

            payload.append(
                "note",
                submittedData.note || ""
            );

            submittedData.images.forEach((img) => {
                payload.append("images", img);
            });

            // CREATE ADVANCE AMOUNT TRANSFER

            const res = await axios.post(
                `${import.meta.env.VITE_APP_KEY}advance/transfer/create/`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            // TRANSFER CREATED SUCCESSFULLY

            if (
                res.status === 201 ||
                res.status === 200
            ) {
                toast.success(
                    "Advance amount transfer created successfully"
                );

                // Backend-created transfer
                const createdTransfer =
                    res?.data?.data ??
                    res?.data ??
                    null;

                // CREATE AUDIT / DATA LOG

                const auditCreated =
                    await createAmountTransferDataLog(
                        submittedData,
                        createdTransfer
                    );

                // Transfer remains successful even if audit logging fails
                if (!auditCreated) {
                    console.error(
                        "Advance amount transfer created successfully, but DataLog creation failed."
                    );

                    toast.warn(
                        "Advance amount transfer saved, but logging to DataLog failed."
                    );
                }

                // RESET FORM

                setFormData({
                    send_from: null,
                    send_to: null,
                    amount: "",
                    date: "",
                    note: "",
                    images: [],
                });
            }
        } catch (error) {
            // TRANSFER CREATION FAILED

            toast.error(
                "Failed to create transfer"
            );

            if (error.response?.data) {
                toast.error(
                    "Details: " +
                    JSON.stringify(
                        error.response.data
                    )
                );
            }

            console.error(
                "Advance amount transfer error:",
                error?.response?.data ||
                error?.message ||
                error
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <Breadcrumbs title="TABLES" breadcrumbItem="ADVANCE AMOUNT TRANSFER" />

                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <CardTitle className="mb-4">ADVANCE AMOUNT TRANSFER</CardTitle>

                                    <Row>
                                        <Col md={4}>
                                            <Label>Product Send From *</Label>
                                            <AsyncSelect
                                                cacheOptions
                                                defaultOptions
                                                loadOptions={loadCustomerOptions}
                                                value={formData.send_from}
                                                onChange={(val) =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        send_from: val,
                                                    }))
                                                }
                                                placeholder="Search customer by name / phone / email"
                                                isClearable
                                            />
                                        </Col>

                                        <Col md={4}>
                                            <Label>Product Send To *</Label>
                                            <AsyncSelect
                                                cacheOptions
                                                defaultOptions
                                                loadOptions={loadCustomerOptions}
                                                value={formData.send_to}
                                                onChange={(val) =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        send_to: val,
                                                    }))
                                                }
                                                placeholder="Search customer by name / phone / email"
                                                isClearable
                                            />
                                        </Col>

                                        <Col md={4}>
                                            <Label>Date *</Label>
                                            <Input
                                                type="date"
                                                value={formData.date}
                                                onChange={(e) =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        date: e.target.value,
                                                    }))
                                                }
                                            />
                                        </Col>
                                    </Row>

                                    <Row className="mt-3">
                                        <Col md={4}>
                                            <Label>Amount *</Label>
                                            <Input
                                                type="number"
                                                value={formData.amount}
                                                onChange={(e) =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        amount: e.target.value,
                                                    }))
                                                }
                                            />
                                        </Col>

                                        <Col md={4}>
                                            <Label>Note</Label>
                                            <Input
                                                value={formData.note}
                                                onChange={(e) =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        note: e.target.value,
                                                    }))
                                                }
                                            />
                                        </Col>

                                        <Col md={4}>
                                            <Label>Upload Images</Label>
                                            <Input type="file" multiple onChange={handleFileChange} />
                                        </Col>
                                    </Row>

                                    <Row className="mt-4">
                                        <Col>
                                            <Button color="primary" onClick={handleSubmit} disabled={loading}>
                                                {loading ? <Spinner size="sm" /> : "Submit"}
                                            </Button>
                                        </Col>
                                    </Row>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </Container>
                <ToastContainer />
            </div>
        </React.Fragment>
    );
};

export default AmountTransfer;