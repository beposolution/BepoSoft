import React, { useEffect, useState } from "react";
import axios from "axios";
import {
    Card,
    CardBody,
    Table,
    Button,
    Container,
    Row,
    Col
} from "reactstrap";
import { Link } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


const MyLPO = () => {
    const token = localStorage.getItem("token");
    const baseUrl = import.meta.env.VITE_APP_KEY;
    const [lpos, setLpos] = useState([]);

    const fetchLPO = async () => {
        try {
            const res = await axios.get(
                `${baseUrl}lpo/`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

            console.log(
                "LPO RESPONSE",
                res.data
            );
            setLpos(
                res.data.results?.data || []
            );

        } catch (error) {
            console.log(
                error.response?.data || error
            );
        }
    };

    useEffect(() => {
        fetchLPO();
    }, []);

    return (

        <React.Fragment>
            <div
                className="page-content"
                style={{
                    background: "#f5f7fb",
                    minHeight: "100vh"
                }}
            >
                <ToastContainer />
                <Container fluid>
                    {/* HEADER */}

                    <div
                        className="card border-0 mb-4"
                        style={{
                            borderRadius: "22px",
                            background:
                                "linear-gradient(135deg,#1f2937 0%,#334155 45%,#0f172a 100%)",
                            boxShadow:
                                "0 12px 35px rgba(15,23,42,.18)",
                            overflow: "hidden"
                        }}
                    >
                        <div className="card-body p-4">
                            <Row className="align-items-center">
                                <Col lg="8">
                                    <div className="d-flex align-items-center gap-3">
                                        <div
                                            style={{
                                                width: "58px",
                                                height: "58px",
                                                borderRadius: "18px",
                                                background:
                                                    "rgba(255,255,255,.12)",

                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                color: "#fff",
                                                fontSize: "26px"
                                            }}
                                        >
                                            <i className="bx bx-file"></i>
                                        </div>

                                        <div>
                                            <h4 className="mb-1 text-white fw-bold">
                                                My LPO List
                                            </h4>
                                            <p
                                                className="mb-0"
                                                style={{
                                                    color:
                                                        "rgba(255,255,255,.72)"
                                                }}
                                            >
                                                View and manage your created local purchase orders.
                                            </p>
                                        </div>
                                    </div>
                                </Col>
                                <Col lg="4"
                                    className="mt-3 mt-lg-0"
                                >
                                    <div className="d-flex justify-content-lg-end">
                                        <span
                                            className="badge"
                                            style={{
                                                background:
                                                    "rgba(59,130,246,.18)",
                                                color: "#bfdbfe",
                                                padding:
                                                    "10px 14px",
                                                borderRadius:
                                                    "999px",
                                                fontSize:
                                                    "13px"
                                            }}
                                        >
                                            Total LPO : {lpos.length}
                                        </span>
                                    </div>
                                </Col>
                            </Row>
                        </div>
                    </div>

                    {/* TABLE CARD */}

                    <Card
                        className="border-0"
                        style={{
                            borderRadius: "22px",
                            boxShadow:
                                "0 10px 35px rgba(15,23,42,.08)",
                            overflow: "hidden"
                        }}
                    >
                        <div
                            className="card-header border-0"
                            style={{
                                background: "#fff",
                                padding:
                                    "22px 24px"
                            }}
                        >
                            <h5 className="mb-1 fw-bold text-dark">
                                Local Purchase Orders
                            </h5>
                            <p className="text-muted mb-0">
                                List of all created purchase orders.
                            </p>
                        </div>
                        <CardBody className="p-3">
                            {
                                lpos.length === 0 ?
                                    (
                                        <div
                                            className="text-center"
                                            style={{
                                                padding:
                                                    "70px 20px"
                                            }}
                                        >
                                            <i
                                                className="bx bx-file"
                                                style={{
                                                    fontSize: "45px",
                                                    color: "#94a3b8"
                                                }}
                                            ></i>
                                            <h5 className="fw-bold mt-3">
                                                No LPO Found
                                            </h5>
                                            <p className="text-muted">
                                                There are no purchase orders available.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="table-responsive">
                                            <Table
                                                className="align-middle mb-0"
                                            >
                                                <thead>
                                                    <tr>
                                                        <th>Invoice</th>
                                                        <th>Date</th>
                                                        <th>Company</th>
                                                        <th> Products </th>
                                                        <th> Quantity</th>
                                                        <th>Requested By</th>
                                                        <th className="text-end">
                                                            Action
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {
                                                        lpos.map((lpo) => (
                                                            <tr key={lpo.id}>
                                                                <td>
                                                                    <span className="fw-bold text-dark">
                                                                        {lpo.invoice}
                                                                    </span>
                                                                </td>
                                                                <td>
                                                                    {lpo.date}
                                                                </td>
                                                                <td>
                                                                    {lpo.company_name || "-"}
                                                                </td>
                                                                <td>
                                                                    {
                                                                        lpo.items?.map(
                                                                            (item, index) => (
                                                                                <div
                                                                                    key={index}
                                                                                    className="mb-1"
                                                                                >
                                                                                    <span
                                                                                        className="badge"
                                                                                        style={{
                                                                                            background:
                                                                                                "#e0f2fe",
                                                                                            color:
                                                                                                "#0369a1",
                                                                                            borderRadius:
                                                                                                "999px",
                                                                                            padding:
                                                                                                "6px 10px"
                                                                                        }}
                                                                                    >
                                                                                        {item.product}
                                                                                    </span>
                                                                                </div>
                                                                            )
                                                                        )
                                                                    }
                                                                </td>
                                                                <td>
                                                                    <span
                                                                        className="fw-semibold"
                                                                    >
                                                                        {
                                                                            lpo.items?.reduce(
                                                                                (total, item) =>
                                                                                    total +
                                                                                    Number(
                                                                                        item.quantity || 0
                                                                                    ),
                                                                                0
                                                                            )
                                                                        }
                                                                    </span>
                                                                </td>
                                                                <td>
                                                                    {lpo.requested_by_name || "-"}
                                                                </td>
                                                                <td className="text-end">
                                                                    <Link
                                                                        to={`/lpo/edit/${lpo.id}`}
                                                                    >
                                                                        <Button
                                                                            color="primary"
                                                                            size="sm"
                                                                            style={{
                                                                                borderRadius:
                                                                                    "10px",
                                                                                padding:
                                                                                    "8px 16px",
                                                                                fontWeight:
                                                                                    600
                                                                            }}
                                                                        >
                                                                            <i className="bx bx-show me-1"></i>
                                                                            View
                                                                        </Button>
                                                                    </Link>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    }
                                                </tbody>
                                            </Table>
                                        </div>
                                    )
                            }
                        </CardBody>
                    </Card>
                </Container>
            </div>
        </React.Fragment>
    );
};

export default MyLPO;