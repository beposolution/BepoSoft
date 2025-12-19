import React, { useEffect, useState } from "react";
import axios from "axios";
import {
    Row,
    Col,
    Card,
    CardBody,
    Container,
    FormGroup,
    Label,
    Input,
    Button,
} from "reactstrap";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const BoxCount = ({ orderId, initialBoxCount }) => {
    const [boxCount, setBoxCount] = useState("");
    const [loading, setLoading] = useState(false);

    const writeBoxCountLog = async (newBoxCount) => {
        const token = localStorage.getItem("token");
        try {
            await axios.post(
                `${import.meta.env.VITE_APP_KEY}datalog/create/`,
                {
                    order: Number(orderId),
                    before_data: {
                        box_count: initialBoxCount ?? null,
                    },
                    after_data: {
                        action: "Box count updated (COD split)",
                        box_count: newBoxCount,
                    },
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
        } catch (err) {
            console.warn(
                "BoxCount DataLog failed:",
                err?.response?.data || err.message
            );
        }
    };

    useEffect(() => {
        if (initialBoxCount !== null && initialBoxCount !== undefined) {
            setBoxCount(initialBoxCount);
        }
    }, [initialBoxCount]);

    const handleUpdate = async () => {
        if (!boxCount || Number(boxCount) <= 0) {
            toast.error("Box count must be greater than zero");
            return;
        }

        const token = localStorage.getItem("token");
        setLoading(true);

        try {
            await axios.patch(
                `${import.meta.env.VITE_APP_KEY}order/box/count/${orderId}/cod/split/`,
                { box_count: Number(boxCount) },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            toast.success("Box count updated successfully");
            await writeBoxCountLog(Number(boxCount));

        } catch (error) {
            console.error(
                "Box count update failed:",
                error.response?.data || error.message
            );
            toast.error("Failed to update box count");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-content">
            <Container fluid>
                <Row>
                    <Col xs={12}>
                        <Card>
                            <CardBody>
                                <h6 className="mb-4 card-title">BOX COUNT (COD SPLIT)</h6>
                                <Row>
                                    <Col md={6} lg={4}>
                                        <FormGroup>
                                            <Label>Box Count</Label>
                                            <Input
                                                type="number"
                                                min="1"
                                                value={boxCount}
                                                onChange={(e) => setBoxCount(e.target.value)}
                                                placeholder="Enter box count"
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col
                                        md={6}
                                        lg={4}
                                        className="d-flex align-items-end"
                                    >
                                        <Button
                                            color="primary"
                                            onClick={handleUpdate}
                                            disabled={loading}
                                        >
                                            {loading ? "Updating..." : "Update Box Count"}
                                        </Button>
                                    </Col>
                                </Row>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </Container>
            <ToastContainer position="top-right" autoClose={3000} />
        </div>
    );
};

export default BoxCount;
