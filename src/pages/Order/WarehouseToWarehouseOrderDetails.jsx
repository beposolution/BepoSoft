import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import {
    Table,
    Row,
    Col,
    CardBody,
    Card,
    CardTitle,
    Container,
    Button,
} from "reactstrap";
import Breadcrumbs from "../../components/Common/Breadcrumb";

const WarehouseOrderDetails = () => {
    const { invoice } = useParams();
    const [orderDetails, setOrderDetails] = useState(null);
    console.log("Order Details:", orderDetails);
    const token = localStorage.getItem("token");

    useEffect(() => {
        const fetchOrderDetails = async () => {
            try {
                const res = await axios.get(
                    `${import.meta.env.VITE_APP_KEY}warehouse/order/view/${invoice}/`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setOrderDetails(res.data.data || null);
            } catch (err) {
                toast.error("Failed to fetch order details");
            }
        };
        fetchOrderDetails();
    }, [invoice]);

    if (!orderDetails) return <p className="p-3">Loading…</p>;

    const { items = [] } = orderDetails;

    const totalQty = items.reduce((sum, it) => sum + (it.quantity || 0), 0);

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <Breadcrumbs title="Forms" breadcrumbItem="WAREHOUSE ORDER" />

                    <Row className="mb-3 align-items-center">
                        <Col xs="4" className="text-start">
                            
                        </Col>

                        <Col xs="4" className="text-center">
                            <h4 className="mb-0 text-primary">{orderDetails.invoice}</h4>
                        </Col>

                        <Col xs="4" className="text-end">
                            <Button
                                color="secondary"
                                className="mb-2"
                                onClick={() => window.history.back()}
                            >
                                Back
                            </Button>
                        </Col>
                    </Row>

                    <Row>
                        <Col xl={12}>
                            <Card className="bordered-card">
                                <CardBody>
                                    <CardTitle className="h4 mb-4">Order Information</CardTitle>
                                    <div
                                        style={{
                                            display: "flex",
                                            flexWrap: "wrap",
                                            gap: "20px",
                                            backgroundColor: "#f5f5f5",
                                            padding: "20px",
                                            borderRadius: "12px",
                                        }}
                                    >
                                        {/* Requesting Warehouse */}
                                        <div
                                            style={{
                                                flex: "1",
                                                minWidth: "280px",
                                                backgroundColor: "#fff",
                                                borderRadius: "12px",
                                                boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                                                padding: "20px",
                                            }}
                                        >
                                            <h5
                                                style={{
                                                    borderBottom: "1px solid #e0e0e0",
                                                    paddingBottom: "8px",
                                                }}
                                            >
                                                Requesting Warehouse
                                            </h5>
                                            <p className="mt-3 mb-1">
                                                <strong>Name:</strong> {orderDetails.warehouses_name}
                                            </p>
                                            <p className="mb-1">
                                                <strong>Managed By:</strong> {orderDetails.manage_staff}
                                            </p>
                                            <p className="mb-1">
                                                <strong>Order Date:</strong> {orderDetails.order_date}
                                            </p>
                                            <p className="mb-1">
                                                <strong>Status:</strong> {orderDetails.status}
                                            </p>
                                        </div>

                                        {/* Receiving Warehouse */}
                                        <div
                                            style={{
                                                flex: "1",
                                                minWidth: "280px",
                                                backgroundColor: "#fff",
                                                borderRadius: "12px",
                                                boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                                                padding: "20px",
                                            }}
                                        >
                                            <h5
                                                style={{
                                                    borderBottom: "1px solid #e0e0e0",
                                                    paddingBottom: "8px",
                                                }}
                                            >
                                                Receiving Warehouse
                                            </h5>
                                            <p className="mt-3 mb-1">
                                                <strong>Name:</strong>{" "}
                                                {orderDetails.receiiver_warehouse_name}
                                            </p>
                                            <p className="mb-1">
                                                <strong>Company:</strong> {orderDetails.company_name}
                                            </p>
                                            <p className="mb-1">
                                                <strong>Shipping Charge:</strong> ₹
                                                {orderDetails.shipping_charge}
                                            </p>
                                            <p className="mb-1">
                                                <strong>Updated At:</strong>{" "}
                                                {new Date(orderDetails.updated_at).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>

                    {/* Items Table */}
                    <Row className="mt-4">
                        <Col xl={12}>
                            <Card className="bordered-card">
                                <CardBody>
                                    <CardTitle className="h4 mb-3">Products</CardTitle>
                                    <div className="table-responsive">
                                        <Table className="table table-bordered table-striped mb-0">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>#</th>
                                                    <th>Image</th>
                                                    <th>Name</th>
                                                    <th>Quantity</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {items.map((it, idx) => (
                                                    <tr key={it.id}>
                                                        <td>{idx + 1}</td>
                                                        <td className="text-center">
                                                            {it.product_image ? (
                                                                <img
                                                                    src={`${import.meta.env.VITE_APP_IMAGE}${it.product_image}`}
                                                                    alt={it.product_name}
                                                                    style={{
                                                                        width: "50px",
                                                                        height: "50px",
                                                                        objectFit: "cover",
                                                                        borderRadius: "5px",
                                                                    }}
                                                                />
                                                            ) : (
                                                                <span className="text-muted">No image</span>
                                                            )}
                                                        </td>
                                                        <td>{it.product_name}</td>
                                                        <td>{it.quantity}</td>
                                                    </tr>
                                                ))}
                                                {items.length === 0 && (
                                                    <tr>
                                                        <td colSpan="6" className="text-center">
                                                            No products in this order.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                            {items.length > 0 && (
                                                <tfoot>
                                                    <tr className="table-light">
                                                        <th colSpan="3" className="text-end">
                                                            Total
                                                        </th>
                                                        <th>{totalQty}</th>
                                                    </tr>
                                                </tfoot>
                                            )}
                                        </Table>
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>

                    <ToastContainer />
                </Container>
            </div>

            {/* inline styles to match OrderProducts look */}
            <style jsx>{`
        .bordered-card {
          border-radius: 8px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        .table-light {
          background-color: #f8f9fa;
          font-weight: 600;
        }
        .table tr:hover {
          background-color: #f1f1f1;
        }
      `}</style>
        </React.Fragment>
    );
};

export default WarehouseOrderDetails;
