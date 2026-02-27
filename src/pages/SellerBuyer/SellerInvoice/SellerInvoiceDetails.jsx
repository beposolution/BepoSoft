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
    const currencySymbol = invoiceData?.currency_name || "";
    const [loading, setLoading] = useState(true);
    const [companies, setCompanies] = useState([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState("");
    const [sellers, setSellers] = useState([]);
    const [selectedSellerId, setSelectedSellerId] = useState("");
    const [editableItems, setEditableItems] = useState([]);
    const [products, setProducts] = useState([]);
    const [currencyList, setCurrencyList] = useState([]);
    const [selectedCurrencyId, setSelectedCurrencyId] = useState("");
    const [currencyRate, setCurrencyRate] = useState("");
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
        fetchCurrency();
    }, [invoiceId]);


    const fetchCurrency = async () => {
        try {
            const baseUrl = import.meta.env.VITE_APP_KEY;

            const res = await axios.get(`${baseUrl}currency/add/`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setCurrencyList(res.data.data || []);
        } catch (err) {
            console.log("Currency fetch error:", err);
        }
    };

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
            setSelectedCurrencyId(response.data.data.currency || "");
            setCurrencyRate(response.data.data.currency_rate || "");


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

    const updateCurrency = async () => {
        try {
            const baseUrl = import.meta.env.VITE_APP_KEY;

            const payload = {
                currency: selectedCurrencyId,
                currency_rate: parseFloat(currencyRate),
            };

            await axios.put(
                `${baseUrl}product/seller/invoice/${invoiceId}/`,
                payload,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            toast.success("Currency Updated Successfully");
            fetchInvoiceDetails();

        } catch (error) {
            toast.error("Failed to update currency");
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
                            <Card className="shadow-sm border-0">
                                <CardBody>

                                    {/* HEADER */}
                                    <div className="d-flex justify-content-between align-items-center mb-4">
                                        <div>
                                            {/* <h4 className="mb-0">Invoice Details</h4> */}
                                            <h4 className="text-primary"><strong>{invoiceData.invoice_no}</strong></h4>
                                        </div>

                                        <div className="d-flex gap-2">
                                            <Button color="success" onClick={downloadInvoice}>
                                                Download Invoice
                                            </Button>
                                            <Link to="/seller-invoices">
                                                <Button color="secondary">Back</Button>
                                            </Link>
                                        </div>
                                    </div>

                                    <Row className="g-4">

                                        {/* LEFT */}
                                        <Col md={6}>
                                            <Card className="border shadow-sm h-100">
                                                <CardBody>
                                                    <h5 className="mb-3">INVOICE INFO</h5>

                                                    <div className="mb-2">
                                                        <small className="text-muted">Invoice Date</small>
                                                        <div>{invoiceData.invoice_date}</div>
                                                    </div>

                                                    <div className="mb-2">
                                                        <small className="text-muted">Total Amount</small>
                                                        <h5 className="text-success">
                                                            {currencySymbol} {invoiceData.total_amount}
                                                        </h5>
                                                    </div>

                                                    <div className="mb-3">
                                                        <small className="text-muted">Note</small>
                                                        <div>{invoiceData.note || "-"}</div>
                                                    </div>

                                                    <hr />

                                                    <h6 className="mb-3">Currency Settings</h6>

                                                    <div className="mb-2">
                                                        <select
                                                            className="form-control"
                                                            value={selectedCurrencyId}
                                                            onChange={(e) => setSelectedCurrencyId(e.target.value)}
                                                        >
                                                            <option value="">Select Currency</option>
                                                            {currencyList.map((c) => (
                                                                <option key={c.id} value={c.id}>
                                                                    {c.country_name} ({c.currency})
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    <div className="mb-2">
                                                        <input
                                                            type="number"
                                                            className="form-control"
                                                            placeholder="Currency Rate"
                                                            value={currencyRate}
                                                            onChange={(e) => setCurrencyRate(e.target.value)}
                                                        />
                                                    </div>

                                                    <Button
                                                        color="primary"
                                                        className="w-100"
                                                        onClick={updateCurrency}
                                                        disabled={!selectedCurrencyId || !currencyRate}
                                                    >
                                                        Save Currency
                                                    </Button>
                                                </CardBody>
                                            </Card>
                                        </Col>

                                        {/* RIGHT */}
                                        <Col md={6}>
                                            <Card className="border shadow-sm h-100">
                                                <CardBody>
                                                    <h5 className="mb-3">SELLER INFO</h5>

                                                    {/* SELLER */}
                                                    <div className="mb-3">
                                                        <label className="form-label">Seller</label>
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
                                                            color="primary"
                                                            size="sm"
                                                            className="mt-2 w-100"
                                                            onClick={updateInvoiceSeller}
                                                        >
                                                            Save Seller
                                                        </Button>
                                                    </div>

                                                    <hr />

                                                    {/* COMPANY */}
                                                    <div className="mb-3">
                                                        <label className="form-label">Company</label>
                                                        <div className="mb-2 fw-bold">
                                                            {invoiceData.company_name || "-"}
                                                        </div>

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
                                                            color="primary"
                                                            size="sm"
                                                            className="mt-2 w-100"
                                                            onClick={updateInvoiceCompany}
                                                        >
                                                            Save Company
                                                        </Button>
                                                    </div>

                                                    <hr />

                                                    {/* DETAILS */}
                                                    <div>
                                                        <p><b>GSTIN:</b> {invoiceData.gstin || "-"}</p>
                                                        <p><b>Phone:</b> {invoiceData.phone || "-"}</p>
                                                        <p><b>Email:</b> {invoiceData.email || "-"}</p>
                                                        <p><b>Address:</b> {invoiceData.address || "-"}</p>
                                                    </div>

                                                </CardBody>
                                            </Card>
                                        </Col>

                                    </Row>

                                    {/* ================= ADD PRODUCT ================= */}
                                    <Card className="border shadow-sm mt-4">
                                        <CardBody>
                                            <h5 className="mb-3">Add Product</h5>

                                            <Row className="g-2">
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
                                                    <Button color="success" className="w-100" onClick={addNewItem}>
                                                        Add
                                                    </Button>
                                                </Col>
                                            </Row>
                                        </CardBody>
                                    </Card>

                                    {/* ================= TABLE ================= */}
                                    <Card className="border shadow-sm mt-4">
                                        <CardBody>
                                            <h5 className="mb-3">Invoice Items</h5>

                                            <div className="table-responsive">
                                                <Table bordered hover className="align-middle text-center">
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
                                                            const total =
                                                                (item.quantity * item.price) - item.discount;

                                                            return (
                                                                <tr key={item.id}>
                                                                    <td>{index + 1}</td>

                                                                    <td>
                                                                        {item.image ? (
                                                                            <img
                                                                                src={item.image}
                                                                                style={{ width: 50, height: 50, borderRadius: 6 }}
                                                                            />
                                                                        ) : "No Image"}
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

                                                                    <td>
                                                                        <b>{currencySymbol} {total.toFixed(2)}</b>
                                                                    </td>

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
                                                        Save Changes
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="text-end mt-4">
                                                <h4 className="fw-bold text-success">
                                                    Total: {currencySymbol} {invoiceData.total_amount}
                                                </h4>
                                            </div>

                                        </CardBody>
                                    </Card>

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
