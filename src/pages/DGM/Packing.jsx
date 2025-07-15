import React, { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import axios from "axios"
import PackingInformation from "./Packing-Information"
import ShippingInformation from "./Shipping-Information"
import { useNavigate } from "react-router-dom";
import {
    Card,
    Col,
    Container,
    Row,
    CardBody,
    CardTitle,
    Label,
    Input,
    Table,
    Button,
    Dropdown,
    DropdownToggle,
    DropdownMenu,
    DropdownItem,
    Form,
} from "reactstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import AddImages from "../Order/AddImages";

const FormLayouts = () => {
    document.title = "Form Layouts | Skote - Vite React Admin & Dashboard Template";

    const { id } = useParams();
    const [orderData, setOrderData] = useState(null);
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem('token');
    const navigate = useNavigate();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState("");



    const downloadShippingAddress = () => {
        window.open(`${import.meta.env.VITE_APP_IMAGE}/shippinglabel/${id}/`, "_blank");
    };

    const downloadDeliveryNote = () => {
        window.open(`${import.meta.env.VITE_APP_IMAGE}/deliverynote/${id}/`, "_blank");
    };

    const toggleDropdown = () => setDropdownOpen(prevState => !prevState);


    const handleStatusChange = (newStatus) => {
        setSelectedStatus(newStatus);
    };
    const [status, setStatus] = useState([
        "Packing under progress",
        "Ready to ship",
    ]);

    useEffect(() => {
        const fetchOrderData = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_APP_KEY}order/${id}/items/`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                setOrderData(response.data.order);
                console.log("sdfhghsf", response.data.order)
                setSelectedStatus(response.data.order?.status || "");
            } catch (error) {
                toast.error("Error fetching order data:");
            } finally {
                setLoading(false);
            }
        };

        fetchOrderData();
    }, [id]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        try {
            await axios.put(`${import.meta.env.VITE_APP_KEY}shipping/${id}/order/`, {
                status: selectedStatus,
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            alert("Status updated successfully");
        } catch (error) {
            alert("Failed to update status");
        }
    };


    if (loading) {
        return <div>Loading...</div>;
    }

    const billingAddress = orderData?.customer;
    const shippingAddress = orderData?.billing_address;
    const warehouseData = orderData?.warehouse;

    const handleCancel = async () => {
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_APP_KEY}orders/unlock/${id}/`,
                {}, // You can send an empty body if not required
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            toast.success("Order unlocked successfully");
            navigate("/delivery/notes/"); // or wherever you want to redirect
        } catch (error) {
            toast.error("Failed to unlock order");
            console.error("Unlock error:", error);
        }
    };

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid={true}>
                    <Breadcrumbs title="Forms" breadcrumbItem="View Order Details" />
                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <CardTitle className="mb-4 text-center heading-with-underline">ORDER BASIC INFORMATION</CardTitle>
                                    <Row>
                                        <Col md={6} lg={3}>
                                            <div className="mb-3">
                                                <Label htmlFor="formrow-invoice-Input">Invoice</Label>
                                                <Input
                                                    type="text"
                                                    name="invoice"
                                                    className="form-control"
                                                    id="formrow-invoice-Input"
                                                    value={orderData?.invoice || ""}
                                                    readOnly
                                                />
                                            </div>
                                        </Col>
                                        <Col md={6} lg={3}>
                                            <div className="mb-3">
                                                <Label htmlFor="formrow-order_date-Input">Order Date</Label>
                                                <Input
                                                    type="text"
                                                    name="order_date"
                                                    className="form-control"
                                                    id="formrow-order_date-Input"
                                                    value={orderData?.order_date || ""}
                                                    readOnly
                                                />
                                            </div>
                                        </Col>

                                        <Col md={6} lg={3}>
                                            <div className="mb-3">
                                                <Label htmlFor="formrow-status-Input">Status</Label>
                                                <Input
                                                    type="text"
                                                    name="status"
                                                    className="form-control"
                                                    id="formrow-status-Input"
                                                    value={orderData?.status || ""}
                                                    readOnly
                                                />
                                            </div>
                                        </Col>
                                        <Col md={6} lg={3}>
                                            <div className="mb-3">
                                                <Label htmlFor="formrow-manage_staff-Input">Manage Staff</Label>
                                                <Input
                                                    type="text"
                                                    name="manage_staff"
                                                    className="form-control"
                                                    id="formrow-manage_staff-Input"
                                                    value={orderData?.manage_staff || ""}
                                                    readOnly
                                                />
                                            </div>
                                        </Col>
                                        {/* <Col md={6} lg={3}>
                                            <div className="mb-3">
                                                <Label htmlFor="formrow-status-Input">Current Status</Label>
                                                <Input
                                                    type="text"
                                                    name="status"
                                                    className="form-control"
                                                    id="formrow-status-Input"
                                                    value={selectedStatus}
                                                    readOnly
                                                />
                                            </div>
                                        </Col> */}
                                        <Col md={6} lg={3} className="d-flex align-items-end">
                                            <Form onSubmit={handleSubmit} className="w-100">
                                                <div className="d-flex">
                                                    <Dropdown isOpen={dropdownOpen} toggle={toggleDropdown} className="me-3 flex-grow-1">
                                                        <DropdownToggle caret className="w-100">
                                                            {selectedStatus || "Select Status"}
                                                        </DropdownToggle>
                                                        <DropdownMenu className="w-100">
                                                            {status.map((stat, index) => (
                                                                <DropdownItem key={index} onClick={() => handleStatusChange(stat)}>
                                                                    {stat}
                                                                </DropdownItem>
                                                            ))}
                                                        </DropdownMenu>
                                                    </Dropdown>
                                                    <Button type="submit" color="primary">
                                                        Update
                                                    </Button>
                                                </div>
                                            </Form>
                                            <Button className="ms-3" color="danger" onClick={handleCancel}>
                                                Unlock
                                            </Button>
                                        </Col>

                                    </Row>
                                </CardBody>
                                <CardBody>
                                    <CardTitle className="mb-4 text-center heading-with-underline">INVOICE - INFORMATION</CardTitle>
                                    <Row>
                                        <Col sm={12} md={6}>
                                            <address>
                                                <strong>Billed To:</strong>
                                                <br />
                                                {billingAddress ? Object.entries(billingAddress)
                                                    .filter(([key]) => key !== "id") // Exclude 'id' from being displayed
                                                    .map(([key, value], index) => (
                                                        <React.Fragment key={index}>
                                                            <span>{key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " ")}: {value}</span>
                                                            <br />
                                                        </React.Fragment>
                                                    ))
                                                    : "No Billing Address Available"}
                                            </address>
                                        </Col>


                                        <Col sm={12} md={6} className="text-sm-end">
                                            <address>
                                                <strong>Shipped To:</strong>
                                                <br />
                                                {shippingAddress ? Object.entries(shippingAddress)
                                                    .filter(([key]) => key !== "id") // Exclude 'id' from being displayed
                                                    .map(([key, value], index) => (
                                                        <React.Fragment key={index}>
                                                            <span>{key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " ")}: {value}</span>
                                                            <br />
                                                        </React.Fragment>
                                                    ))
                                                    : "No Billing Address Available"}
                                            </address>
                                        </Col>
                                    </Row>
                                </CardBody>

                                <CardBody>
                                    <CardTitle className="mb-4 text-center heading-with-underline">PRODUCTS</CardTitle>
                                    <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                        <Table className="table table-striped mb-0">
                                            <thead>
                                                <tr>
                                                    <th>#</th>
                                                    <th>Image</th>
                                                    <th>Product Name</th>
                                                    <th>Description</th>
                                                    <th>Quantity</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {orderData?.items?.map((item, index) => (
                                                    <tr key={item.id}>
                                                        <td>{index + 1}</td>
                                                        <td>
                                                            <img
                                                                src={`${import.meta.env.VITE_APP_IMAGE}${item.image}` || 'No images'}
                                                                alt={item.name}
                                                                style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                                            />
                                                        </td>
                                                        <td>{item.name}</td>
                                                        <td>{item.description}</td>
                                                        <td>{item.quantity}</td>
                                                    </tr>
                                                ))}
                                                <tr>
                                                    <td colSpan="4" className="text-end"><strong>Total Quantity:</strong></td>
                                                    <td>
                                                        {orderData?.items?.reduce((total, item) => total + item.quantity, 0)}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </Table>
                                    </div>
                                </CardBody>
                                <AddImages orderId={orderData?.id} />
                                <PackingInformation />
                                <ShippingInformation warehouseData={warehouseData} />

                                <CardBody className="text-center">
                                    <Button color="primary" className="me-3" onClick={downloadShippingAddress}>
                                         Download Shipping Address
                                    </Button>
                                    <Button color="success" onClick={downloadDeliveryNote}>
                                         Download Delivery Note
                                    </Button>
                                </CardBody>


                            </Card>
                        </Col>
                    </Row>
                </Container>

                <style jsx>{`
                    .heading-with-underline {
                        text-decoration: underline;
                        padding-bottom: 10px;
                        font-weight: bold;
                        font-size: 1.5rem;
                    }

                    .address-section {
                        border: 1px solid #ddd;
                        padding: 20px;
                        border-radius: 5px;
                        margin-bottom: 20px;
                    }

                    .address-title {
                        font-size: 1.2rem;
                        font-weight: bold;
                        color: #333;
                        margin-bottom: 10px;
                    }

                    .address-content p {
                        margin: 5px 0;
                    }

                    .form-control {
                        border-radius: 5px;
                    }

                    .mb-3 {
                        margin-bottom: 15px;
                    }

                    .table th, .table td {
                        border: 1px solid #ddd; /* Add border to table cells */
                    }
                `}</style>
            </div>
        </React.Fragment>
    );
};

export default FormLayouts;
