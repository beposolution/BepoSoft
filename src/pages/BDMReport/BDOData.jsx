import React, { useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import {
    Card,
    CardBody,
    Col,
    Row,
    CardTitle,
    Form,
    Label,
    Button,
} from "reactstrap";
import "react-toastify/dist/ReactToastify.css";

const BDOData = () => {
    const [activeBDO, setActiveBDO] = useState("");
    const [nonActiveBDO, setNonActiveBDO] = useState("");
    const [loading, setLoading] = useState(false);

    const token = localStorage.getItem("token");
    const BASE_URL = import.meta.env.VITE_APP_KEY || "/api/";

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (activeBDO === "" || nonActiveBDO === "") {
            toast.error("Please enter all values");
            return;
        }

        if (Number(activeBDO) < 0 || Number(nonActiveBDO) < 0) {
            toast.error("Values cannot be negative");
            return;
        }

        try {
            setLoading(true);

            const payload = {
                active_bdo: Number(activeBDO),
                non_active_bdo: Number(nonActiveBDO),
            };


            await axios.post(
                `${BASE_URL}bdm/order/analysis/add/`, 
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            toast.success("BDM Report Submitted Successfully");

            setActiveBDO("");
            setNonActiveBDO("");
        } catch (error) {
            console.error(error);

            const msg =
                error?.response?.data?.message ||
                JSON.stringify(error?.response?.data) ||
                "Failed to submit";

            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <React.Fragment>
            <ToastContainer />
            <div className="page-content">
                <Breadcrumbs
                    title="Daily Sales Report"
                    breadcrumbItem="BDM Report"
                />

                <Row>
                    <Col lg={12}>
                        <Card>
                            <CardBody>
                                <CardTitle className="h4 mb-4">
                                    BDM REPORT
                                </CardTitle>

                                <Form onSubmit={handleSubmit}>
                                    <Row>
                                        <Col md={6}>
                                            <div className="mb-3">
                                                <Label>Active BDO</Label>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    value={activeBDO}
                                                    onChange={(e) =>
                                                        setActiveBDO(e.target.value)
                                                    }
                                                    min="0"
                                                />
                                            </div>
                                        </Col>

                                        <Col md={6}>
                                            <div className="mb-3">
                                                <Label>Non Active BDO</Label>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    value={nonActiveBDO}
                                                    onChange={(e) =>
                                                        setNonActiveBDO(e.target.value)
                                                    }
                                                    min="0"
                                                />
                                            </div>
                                        </Col>
                                    </Row>

                                    <Button
                                        color="primary"
                                        type="submit"
                                        disabled={loading}
                                    >
                                        {loading ? "Saving..." : "Submit"}
                                    </Button>
                                </Form>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </div>
        </React.Fragment>
    );
};

export default BDOData;