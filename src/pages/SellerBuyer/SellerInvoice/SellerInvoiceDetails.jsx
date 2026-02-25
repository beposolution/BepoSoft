import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, Link } from "react-router-dom";
import { Row, Col, Card, CardBody, Table, Button } from "reactstrap";
import Breadcrumbs from "../../../components/Common/Breadcrumb";
import { toast } from "react-toastify";
import Select from "react-select";

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
    const [products, setProducts] = useState([]);
    const [newItem, setNewItem] = useState({
        product_id: "",
        quantity: "",
        price: "",
        discount: "",
        tax: "",
    });

    const productOptions = products.map((p) => ({
        value: p.id,
        label: p.name,
    }));

    document.title = "Seller Invoice Details | Beposoft";

    useEffect(() => {
        fetchInvoiceDetails();
        fetchCompanies();
        fetchSellers();
        fetchProducts();
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

    const fetchProducts = async () => {
        try {
            const baseUrl = import.meta.env.VITE_APP_KEY;

            const res = await axios.get(`${baseUrl}products/`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setProducts(res.data.data || []);

        } catch (err) {
            console.log(err);
        }
    };

    const addNewItem = async () => {
        try {
            const baseUrl = import.meta.env.VITE_APP_KEY;

            await axios.post(
                `${baseUrl}product/seller/invoice/item/add/`,
                {
                    invoice_id: invoiceId,
                    product_id: newItem.product_id,
                    quantity: parseInt(newItem.quantity || 1),
                    price: parseFloat(newItem.price || 0),
                    discount: parseFloat(newItem.discount || 0),
                    tax: parseFloat(newItem.tax || 0),
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            toast.success("Product added successfully");

            setNewItem({
                product_id: "",
                quantity: "",
                price: "",
                discount: "",
                tax: "",
            });

            fetchInvoiceDetails();

        } catch (error) {
            toast.error("Failed to add product");
        }
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

    const removeItem = async (itemId) => {
        try {
            const baseUrl = import.meta.env.VITE_APP_KEY;

            await axios.delete(
                `${baseUrl}product/seller/invoice/item/delete/${itemId}/`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            toast.success("Item removed successfully");
            fetchInvoiceDetails();

        } catch (error) {
            toast.error("Failed to remove item");
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

                                    <h5 className="mt-4">Add New Product</h5>

                                    <Row className="mb-3">
                                        <Col md={3}>
                                            <Select
                                                options={productOptions}
                                                value={productOptions.find(
                                                    (opt) => opt.value === newItem.product_id
                                                )}
                                                onChange={(selected) =>
                                                    setNewItem({
                                                        ...newItem,
                                                        product_id: selected ? selected.value : "",
                                                    })
                                                }
                                                placeholder="Search Product..."
                                                isClearable
                                            />
                                        </Col>

                                        <Col md={2}>
                                            <input
                                                type="number"
                                                placeholder="Qty"
                                                className="form-control"
                                                value={newItem.quantity}
                                                onChange={(e) =>
                                                    setNewItem({ ...newItem, quantity: e.target.value })
                                                }
                                            />
                                        </Col>

                                        <Col md={2}>
                                            <input
                                                type="number"
                                                placeholder="Price"
                                                className="form-control"
                                                value={newItem.price}
                                                onChange={(e) =>
                                                    setNewItem({ ...newItem, price: e.target.value })
                                                }
                                            />
                                        </Col>

                                        <Col md={2}>
                                            <input
                                                type="number"
                                                placeholder="Discount"
                                                className="form-control"
                                                value={newItem.discount}
                                                onChange={(e) =>
                                                    setNewItem({ ...newItem, discount: e.target.value })
                                                }
                                            />
                                        </Col>

                                        <Col md={2}>
                                            <input
                                                type="number"
                                                placeholder="Tax"
                                                className="form-control"
                                                value={newItem.tax}
                                                onChange={(e) =>
                                                    setNewItem({ ...newItem, tax: e.target.value })
                                                }
                                            />
                                        </Col>

                                        <Col md={1}>
                                            <Button color="success" onClick={addNewItem}>
                                                Add
                                            </Button>
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
                                                    <th>Action</th>
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
                                                            <td>
                                                                <Button
                                                                    color="danger"
                                                                    size="sm"
                                                                    onClick={() => removeItem(item.id)}
                                                                >
                                                                    Remove
                                                                </Button>
                                                            </td>
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
