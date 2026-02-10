import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, Link } from "react-router-dom";
import { Row, Col, Card, CardBody, Table, Button } from "reactstrap";
import Breadcrumbs from "../../../components/Common/Breadcrumb";
import { toast } from "react-toastify";

const SellerInvoiceDetails = () => {
    const { invoiceId } = useParams();
    const token = localStorage.getItem("token");
    const [invoiceData, setInvoiceData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [companies, setCompanies] = useState([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState("");
    const [sellers, setSellers] = useState([]);
    const [selectedSellerId, setSelectedSellerId] = useState("");
    const [editableItems, setEditableItems] = useState([]);

    document.title = "Seller Invoice Details | Beposoft";

    useEffect(() => {
        fetchInvoiceDetails();
        fetchCompanies();
        fetchSellers();
    }, [invoiceId]);

    const fetchInvoiceDetails = async () => {
        try {
            setLoading(true);

            const baseUrl = import.meta.env.VITE_APP_KEY;

            const response = await axios.get(
                `${baseUrl}product/seller/invoice/${invoiceId}/`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            setInvoiceData(response.data.data);

            // set selected values
            setSelectedCompanyId(response.data.data.company_id || "");
            setSelectedSellerId(response.data.data.seller_id || "");
            setEditableItems(response.data.data.items || []);


        } catch (error) {
            console.error("Invoice fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCompanies = async () => {
        try {
            const baseUrl = import.meta.env.VITE_APP_KEY;

            const response = await axios.get(`${baseUrl}company/data/`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setCompanies(response.data.data || []);

        } catch (error) {
            console.error("Company fetch error:", error);
        }
    };

    const fetchSellers = async () => {
        try {
            const baseUrl = import.meta.env.VITE_APP_KEY;

            const response = await axios.get(`${baseUrl}product/sellers/details/add/`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setSellers(response.data.data || []);

        } catch (error) {
            console.error("Seller fetch error:", error);
        }
    };

    const handleItemChange = (index, field, value) => {
        const updatedItems = [...editableItems];
        updatedItems[index][field] = value;
        setEditableItems(updatedItems);
    };

    // Update Company Only
    const updateInvoiceCompany = async () => {
        try {
            const baseUrl = import.meta.env.VITE_APP_KEY;

            const payload = {
                company_id: selectedCompanyId,
            };

            const response = await axios.put(
                `${baseUrl}product/seller/invoice/${invoiceId}/`,
                payload,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            toast.success("Company Updated Successfully");
            fetchInvoiceDetails();

        } catch (error) {
            toast.error("Failed to update company");
        }
    };

    // Update Seller Only
    const updateInvoiceSeller = async () => {
        try {
            const baseUrl = import.meta.env.VITE_APP_KEY;

            const payload = {
                seller_id: selectedSellerId,
            };

            const response = await axios.put(
                `${baseUrl}product/seller/invoice/${invoiceId}/`,
                payload,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            toast.success("Seller Updated Successfully");
            fetchInvoiceDetails();


        } catch (error) {
            toast.error("Failed to update seller");
        }
    };

    const updateInvoiceItems = async () => {
        try {
            const baseUrl = import.meta.env.VITE_APP_KEY;

            const payload = {
                items: editableItems.map((item) => ({
                    id: item.id,
                    quantity: parseInt(item.quantity || 0),
                    price: parseFloat(item.price || 0),
                    discount: parseFloat(item.discount || 0),
                    tax: parseFloat(item.tax || 0),
                }))
            };

            await axios.put(`${baseUrl}product/seller/invoice/${invoiceId}/`, payload, {
                headers: { Authorization: `Bearer ${token}` },
            });

            toast.success("Invoice Items Updated Successfully");
            fetchInvoiceDetails();

        } catch (error) {
            toast.error("Failed to update invoice items");
        }
    };

    const downloadInvoice = () => {
        const baseUrl = import.meta.env.VITE_APP_KEY;
        const url = `${baseUrl}product/seller/invoice/print/${invoiceId}/`;

        window.open(url, "_blank");
    };

    if (loading) return <div className="page-content p-4">Loading...</div>;

    if (!invoiceData)
        return <div className="page-content p-4 text-danger">Invoice Not Found</div>;

    return (
        <React.Fragment>
            <div className="page-content">
                <div className="container-fluid">
                    <Breadcrumbs title="Invoice" breadcrumbItem="SELLER INVOICE DETAILS" />

                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <h4>Invoice Details</h4>

                                        <div className="d-flex gap-2">
                                            <Button color="success" onClick={downloadInvoice}>
                                                Download Invoice
                                            </Button>

                                            <Link to="/seller-invoices">
                                                <Button color="secondary">Back</Button>
                                            </Link>
                                        </div>
                                    </div>

                                    {/* Invoice Summary */}
                                    <Row className="mb-4">
                                        <Col md={6}>
                                            <h5>Invoice Info</h5>
                                            <p><b>Invoice No:</b> {invoiceData.invoice_no}</p>
                                            <p><b>Invoice Date:</b> {invoiceData.invoice_date}</p>
                                            <p><b>Total Amount:</b> ₹ {invoiceData.total_amount}</p>
                                            <p><b>Note:</b> {invoiceData.note || "-"}</p>
                                        </Col>

                                        <Col md={6}>
                                            <h5>Seller Info</h5>

                                            {/* Seller Dropdown */}
                                            <p><b>Seller:</b></p>
                                            <select
                                                className="form-control"
                                                value={selectedSellerId}
                                                onChange={(e) => setSelectedSellerId(e.target.value)}
                                            >
                                                <option value="">Select Seller</option>
                                                {sellers.map((s) => (
                                                    <option key={s.id} value={s.id}>
                                                        {s.name} ({s.company_name})
                                                    </option>
                                                ))}
                                            </select>

                                            <Button
                                                className="mt-2"
                                                color="primary"
                                                onClick={updateInvoiceSeller}
                                                disabled={!selectedSellerId}
                                            >
                                                Save Seller Changes
                                            </Button>

                                            <hr />

                                            {/* Company Dropdown */}
                                            <p><b>Company:</b></p>
                                            <select
                                                className="form-control"
                                                value={selectedCompanyId}
                                                onChange={(e) => setSelectedCompanyId(e.target.value)}
                                            >
                                                <option value="">Select Company</option>
                                                {companies.map((c) => (
                                                    <option key={c.id} value={c.id}>
                                                        {c.name}
                                                    </option>
                                                ))}
                                            </select>

                                            <Button
                                                className="mt-2"
                                                color="primary"
                                                onClick={updateInvoiceCompany}
                                                disabled={!selectedCompanyId}
                                            >
                                                Save Company Changes
                                            </Button>

                                            <hr />

                                            <p className="mt-2"><b>GSTIN:</b> {invoiceData.gstin}</p>
                                            <p><b>Phone:</b> {invoiceData.phone}</p>
                                            <p><b>Email:</b> {invoiceData.email}</p>
                                            <p><b>Address:</b> {invoiceData.address}</p>
                                        </Col>
                                    </Row>

                                    {/* Items Table */}
                                    <h5>Invoice Items</h5>
                                    <div className="table-responsive">
                                        <Table bordered className="text-center">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>#</th>
                                                    <th>Image</th>
                                                    <th>Product</th>
                                                    <th>Qty</th>
                                                    <th>Price</th>
                                                    <th>Discount</th>
                                                    <th>Tax</th>
                                                    <th>Total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {editableItems?.map((item, index) => {
                                                    const calculatedTotal =
                                                        (parseFloat(item.quantity || 0) * parseFloat(item.price || 0)) -
                                                        parseFloat(item.discount || 0);

                                                    return (
                                                        <tr key={item.id}>
                                                            <td>{index + 1}</td>

                                                            <td>
                                                                {item.image ? (
                                                                    <img
                                                                        src={item.image}
                                                                        alt="product"
                                                                        style={{
                                                                            width: "50px",
                                                                            height: "50px",
                                                                            borderRadius: "6px",
                                                                            objectFit: "cover",
                                                                        }}
                                                                    />
                                                                ) : (
                                                                    "No Image"
                                                                )}
                                                            </td>

                                                            <td>{item.product_name}</td>

                                                            <td>
                                                                <input
                                                                    type="number"
                                                                    className="form-control"
                                                                    value={item.quantity}
                                                                    onChange={(e) =>
                                                                        handleItemChange(index, "quantity", e.target.value)
                                                                    }
                                                                />
                                                            </td>

                                                            <td>
                                                                <input
                                                                    type="number"
                                                                    className="form-control"
                                                                    value={item.price}
                                                                    onChange={(e) =>
                                                                        handleItemChange(index, "price", e.target.value)
                                                                    }
                                                                />
                                                            </td>

                                                            <td>
                                                                <input
                                                                    type="number"
                                                                    className="form-control"
                                                                    value={item.discount}
                                                                    onChange={(e) =>
                                                                        handleItemChange(index, "discount", e.target.value)
                                                                    }
                                                                />
                                                            </td>

                                                            <td>
                                                                <input
                                                                    type="number"
                                                                    className="form-control"
                                                                    value={item.tax}
                                                                    onChange={(e) =>
                                                                        handleItemChange(index, "tax", e.target.value)
                                                                    }
                                                                />
                                                            </td>

                                                            <td>₹ {calculatedTotal.toFixed(2)}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </Table>
                                        <div className="text-end mt-3">
                                            <Button color="primary" onClick={updateInvoiceItems}>
                                                Save Item Changes
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="text-end mt-3">
                                        <h5>Total Amount: ₹ {invoiceData.total_amount}</h5>
                                    </div>

                                </CardBody>
                            </Card>
                        </Col>
                    </Row>

                </div>
            </div>
        </React.Fragment>
    );
};

export default SellerInvoiceDetails;
