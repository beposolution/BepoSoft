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
    Spinner,
    Modal, ModalHeader, ModalBody, ModalFooter
} from "reactstrap";
import Breadcrumbs from "../../components/Common/Breadcrumb";

const WarehouseOrderDetails = () => {
    const { invoice } = useParams();
    const [orderDetails, setOrderDetails] = useState(null);
    console.log("orderDetails", orderDetails);
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem("token");
    const [rackModalOpen, setRackModalOpen] = useState(false);
    const [selectedRackDetails, setSelectedRackDetails] = useState([]);
    const [selectedItemId, setSelectedItemId] = useState(null);
    const [rackEdits, setRackEdits] = useState([]);

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
            } finally {
                setLoading(false);
            }
        };
        fetchOrderDetails();
    }, [invoice, token]);

    const updateStatus = async (orderId, newStatus) => {
        try {
            await axios.put(
                `${import.meta.env.VITE_APP_KEY}warehouse/order/update/${orderId}/`,
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success("Status updated successfully");
            setOrderDetails((prev) => ({ ...prev, status: newStatus }));
        } catch (err) {
            console.error(err);
            toast.error("Failed to update status");
        }
    };

    const parseRackDetails = (rackStr) => {
        if (!rackStr) return [];
        try {
            // convert single quotes to double for valid JSON
            return JSON.parse(rackStr.replace(/'/g, '"'));
        } catch (e) {
            console.error("Invalid rack JSON", e);
            return [];
        }
    };

    const handleRackSave = async () => {
        try {
            await axios.put(
                `${import.meta.env.VITE_APP_KEY}warehouse/order/item/update/${selectedItemId}/`,
                { rack_details: rackEdits },                 // send the edited array
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success("Rack details updated");
            setRackModalOpen(false);
        } catch (err) {
            console.error(err);
            toast.error("Failed to update rack details");
        }
    };

    if (loading) {
        return (
            <div className="page-content">
                <Container className="text-center my-5">
                    <Spinner color="primary" style={{ width: "3rem", height: "3rem" }} />
                    <p className="mt-2">Loading order details…</p>
                </Container>
            </div>
        );
    }

    if (!orderDetails) {
        return (
            <div className="page-content">
                <Container className="p-3 text-center">
                    <p>No data found.</p>
                </Container>
            </div>
        );
    }

    const { items = [] } = orderDetails;
    const totalQty = items.reduce((sum, it) => sum + (it.quantity || 0), 0);

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <Breadcrumbs title="Forms" breadcrumbItem="WAREHOUSE ORDER" />

                    <Row className="mb-3 align-items-center">
                        <Col xs="4" />
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
                                            <h5 style={{ borderBottom: "1px solid #e0e0e0", paddingBottom: "8px" }}>
                                                Requesting Warehouse
                                            </h5>
                                            <p><strong>Name:</strong> {orderDetails.warehouses_name}</p>
                                            <p><strong>Managed By:</strong> {orderDetails.manage_staff}</p>
                                            <p><strong>Order Date:</strong> {orderDetails.order_date}</p>
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
                                            <h5 style={{ borderBottom: "1px solid #e0e0e0", paddingBottom: "8px" }}>
                                                Receiving Warehouse
                                            </h5>
                                            <p><strong>Name:</strong> {orderDetails.receiiver_warehouse_name}</p>
                                            <p><strong>Company:</strong> {orderDetails.company_name}</p>
                                            <p><strong>Status:</strong> {orderDetails.status}</p>
                                            {/* <p><strong>Shipping Charge:</strong> ₹{orderDetails.shipping_charge}</p> */}
                                            {/* <p><strong>Updated At:</strong> {new Date(orderDetails.updated_at).toLocaleString()}</p> */}
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>

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
                                                    <th>Rack Details</th>
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
                                                        <td>
                                                            <Button
                                                                color="info"
                                                                size="sm"
                                                                onClick={() => {
                                                                    const parsed = parseRackDetails(it.product_rack).map(r => ({
                                                                        ...r,
                                                                        qty: r.rack_lock || r.locked_qty || 0,   // pre-fill current locked qty
                                                                    }));
                                                                    setSelectedItemId(it.id);
                                                                    setRackEdits(parsed);
                                                                    setRackModalOpen(true);
                                                                }}
                                                            >
                                                                Edit
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {items.length === 0 && (
                                                    <tr>
                                                        <td colSpan="4" className="text-center">
                                                            No products in this order.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                            {items.length > 0 && (
                                                <tfoot>
                                                    <tr className="table-light">
                                                        <th colSpan="3" className="text-end">Total</th>
                                                        <th>{totalQty}</th>
                                                        <th></th>
                                                    </tr>
                                                </tfoot>
                                            )}
                                        </Table>
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>

                    <Row className="mt-4">
                        <Col xl={12}>
                            <Card className="bordered-card">
                                <CardBody>
                                    <CardTitle className="h4 mb-3">Update Order Status</CardTitle>

                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "15px",
                                            flexWrap: "wrap",
                                        }}
                                    >
                                        <strong>Current Status:</strong>
                                        <span
                                            style={{
                                                padding: "6px 12px",
                                                backgroundColor: "#f1f1f1",
                                                borderRadius: "8px",
                                                fontWeight: "600",
                                            }}
                                        >
                                            {orderDetails.status}
                                        </span>

                                        <select
                                            className="form-select"
                                            style={{ maxWidth: "220px" }}
                                            value={orderDetails.status}
                                            onChange={(e) => updateStatus(orderDetails.id, e.target.value)}
                                        >
                                            {["Created", "Approved", "Completed", "Received", "Rejected", "Cancelled"].map((opt) => (
                                                <option key={opt} value={opt}>
                                                    {opt}
                                                </option>
                                            ))}
                                        </select>

                                        <Button
                                            color="primary"
                                            onClick={() => updateStatus(orderDetails.id, orderDetails.status)}
                                        >
                                            Save
                                        </Button>
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>

                    <ToastContainer />
                </Container>
            </div>

            <Modal isOpen={rackModalOpen} toggle={() => setRackModalOpen(false)} size="lg">
                <ModalHeader toggle={() => setRackModalOpen(false)}>Rack Details</ModalHeader>
                <ModalBody>
                    {rackEdits.length === 0 ? (
                        <p className="text-center m-0">No rack details available.</p>
                    ) : (
                        <Table bordered responsive>
                            <thead className="table-light">
                                <tr>
                                    <th>#</th>
                                    <th>Rack Name</th>
                                    <th>Column</th>
                                    <th>Usability</th>
                                    <th>Rack Stock</th>
                                    <th>Locked Qty</th>
                                    <th>Qty</th> {/* new editable column */}
                                </tr>
                            </thead>
                            <tbody>
                                {rackEdits.map((rack, i) => {
                                    const maxQty = (rack.rack_stock || 0) - (rack.rack_lock || rack.locked_qty || 0);
                                    return (
                                        <tr key={i}>
                                            <td>{i + 1}</td>
                                            <td>{rack.rack_name}</td>
                                            <td>{rack.column_name}</td>
                                            <td>{rack.usability}</td>
                                            <td>{rack.rack_stock}</td>
                                            <td>{rack.rack_lock ?? rack.locked_qty ?? 0}</td> {/* read-only */}
                                            <td>
                                                <input
                                                    type="number"
                                                    className="form-control form-control-sm"
                                                    min={0}
                                                    max={maxQty}
                                                    value={rack.qty ?? 0}
                                                    onChange={e => {
                                                        const value = Math.min(
                                                            maxQty,
                                                            Math.max(0, parseInt(e.target.value || 0, 10))
                                                        );
                                                        setRackEdits(prev =>
                                                            prev.map((r, idx) =>
                                                                idx === i ? { ...r, qty: value } : r
                                                            )
                                                        );
                                                    }}
                                                />
                                                <small className="text-muted">max {maxQty}</small>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </Table>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button color="primary" onClick={handleRackSave}>Save</Button>
                    <Button color="secondary" onClick={() => setRackModalOpen(false)}>Close</Button>
                </ModalFooter>
            </Modal>

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
