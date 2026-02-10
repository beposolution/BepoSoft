import React, { useEffect, useState } from "react";
import axios from "axios";
import Select from "react-select";
import { Row, Col, Card, CardBody, Button, Input, FormGroup, Label, Table } from "reactstrap";
import Breadcrumbs from "../../../components/Common/Breadcrumb";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const CreateInvoice = () => {
    const token = localStorage.getItem("token");
    const navigate = useNavigate();
    const baseUrl = import.meta.env.VITE_APP_KEY;

    const [loading, setLoading] = useState(false);

    const [sellers, setSellers] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [products, setProducts] = useState([]);

    const [cartItems, setCartItems] = useState([]);

    const [sellerId, setSellerId] = useState("");
    const [companyId, setCompanyId] = useState("");
    const [invoiceDate, setInvoiceDate] = useState("");
    const [note, setNote] = useState("");

    // product form
    const [selectedProductId, setSelectedProductId] = useState("");
    const [quantity, setQuantity] = useState(1);
    const [price, setPrice] = useState("");
    const [discount, setDiscount] = useState("");

    document.title = "Create Seller Invoice | Beposoft";

    useEffect(() => {
        fetchSellers();
        fetchCompanies();
        fetchProducts();
        fetchCartItems();

        const today = new Date().toISOString().split("T")[0];
        setInvoiceDate(today);
    }, []);

    const fetchSellers = async () => {
        try {
            const response = await axios.get(`${baseUrl}product/sellers/details/add/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setSellers(response.data.data || []);
        } catch (error) {
            console.error("Seller fetch error:", error);
        }
    };

    const fetchCompanies = async () => {
        try {
            const response = await axios.get(`${baseUrl}company/data/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setCompanies(response.data.data || []);
        } catch (error) {
            console.error("Company fetch error:", error);
        }
    };

    const fetchProducts = async () => {
        try {
            const response = await axios.get(`${baseUrl}products/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setProducts(response.data.data || []);
        } catch (error) {
            console.error("Products fetch error:", error);
        }
    };

    const fetchCartItems = async () => {
        try {
            const response = await axios.get(`${baseUrl}product/seller/cart/`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setCartItems(response.data.data || []);
        } catch (error) {
            console.error("Cart fetch error:", error);
        }
    };

    const addToCart = async () => {
        try {
            if (!selectedProductId) {
                toast.error("Please select product");
                return;
            }

            if (!quantity || quantity <= 0) {
                toast.error("Enter valid quantity");
                return;
            }

            const payload = {
                product_id: selectedProductId,
                quantity: quantity,
                price: price || null,
                discount: discount || 0,
            };

            await axios.post(`${baseUrl}product/seller/cart/`, payload, {
                headers: { Authorization: `Bearer ${token}` },
            });

            toast.success("Product added to cart");
            setSelectedProductId("");
            setQuantity(1);
            setPrice("");
            setDiscount("");

            fetchCartItems();
        } catch (error) {
            toast.error("Failed to add cart item");
        }
    };

    const deleteCartItem = async (cartId) => {
        try {
            await axios.delete(`${baseUrl}product/seller/cart/delete/${cartId}/`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            toast.success("Cart item removed");
            fetchCartItems();
        } catch (error) {
            toast.error("Failed to delete cart item");
        }
    };

    const createInvoice = async () => {
        try {
            if (!sellerId) {
                toast.error("Please select seller");
                return;
            }

            if (!companyId) {
                toast.error("Please select company");
                return;
            }

            if (!invoiceDate) {
                toast.error("Please select invoice date");
                return;
            }

            if (cartItems.length === 0) {
                toast.error("Cart is empty. Add products first.");
                return;
            }

            setLoading(true);

            const payload = {
                seller_id: sellerId,
                company: companyId,
                invoice_date: invoiceDate,
                note: note,
            };

            const response = await axios.post(
                `${baseUrl}product/seller/invoice/create/`,
                payload,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            toast.success("Invoice Created Successfully");

            const invoiceCreatedId = response.data.data.id;
            navigate(`/seller/invoice/${invoiceCreatedId}/`);

        } catch (error) {

            if (error.response?.data?.message) {
                toast.error(error.response.data.message);
            } else {
                toast.error("Failed to create invoice");
            }
        } finally {
            setLoading(false);
        }
    };

    const getCartTotal = () => {
        let total = 0;

        cartItems.forEach((item) => {
            const qty = parseFloat(item.quantity || 0);
            const price = parseFloat(item.price || 0);
            const discount = parseFloat(item.discount || 0);

            total += (qty * price) - discount;
        });

        return total.toFixed(2);
    };

    return (
        <React.Fragment>
            <div className="page-content">
                <div className="container-fluid">
                    <Breadcrumbs title="Invoice" breadcrumbItem="CREATE SELLER INVOICE" />

                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <h4>Create Seller Invoice</h4>

                                    {/* Invoice Form */}
                                    <Row className="mt-4">
                                        <Col md={6}>
                                            <FormGroup>
                                                <Label>Select Seller</Label>
                                                <Select
                                                    options={sellers.map((s) => ({
                                                        value: s.id,
                                                        label: `${s.name} (${s.company_name})`,
                                                    }))}
                                                    value={
                                                        sellerId
                                                            ? {
                                                                value: sellerId,
                                                                label: sellers.find((s) => s.id == sellerId)?.name,
                                                            }
                                                            : null
                                                    }
                                                    onChange={(selected) => setSellerId(selected.value)}
                                                    placeholder="Search Seller..."
                                                    isSearchable={true}
                                                />
                                            </FormGroup>
                                        </Col>

                                        <Col md={6}>
                                            <FormGroup>
                                                <Label>Select Company</Label>
                                                <Select
                                                    options={companies.map((c) => ({
                                                        value: c.id,
                                                        label: c.name,
                                                    }))}
                                                    value={
                                                        companyId
                                                            ? {
                                                                value: companyId,
                                                                label: companies.find((c) => c.id == companyId)?.name,
                                                            }
                                                            : null
                                                    }
                                                    onChange={(selected) => setCompanyId(selected.value)}
                                                    placeholder="Search Company..."
                                                    isSearchable={true}
                                                />
                                            </FormGroup>
                                        </Col>
                                    </Row>

                                    <Row>
                                        <Col md={6}>
                                            <FormGroup>
                                                <Label>Invoice Date</Label>
                                                <Input
                                                    type="date"
                                                    value={invoiceDate}
                                                    onChange={(e) => setInvoiceDate(e.target.value)}
                                                />
                                            </FormGroup>
                                        </Col>

                                        <Col md={6}>
                                            <FormGroup>
                                                <Label>Note</Label>
                                                <Input
                                                    type="text"
                                                    placeholder="Enter note"
                                                    value={note}
                                                    onChange={(e) => setNote(e.target.value)}
                                                />
                                            </FormGroup>
                                        </Col>
                                    </Row>

                                    <hr />

                                    {/* Add Product to Cart */}
                                    <h5>Add Products to Cart</h5>

                                    <Row className="mt-3">
                                        <Col md={4}>
                                            <FormGroup>
                                                <Label>Select Product</Label>
                                                <Select
                                                    options={products.map((p) => ({
                                                        value: p.id,
                                                        label: p.name,
                                                    }))}
                                                    value={
                                                        selectedProductId
                                                            ? {
                                                                value: selectedProductId,
                                                                label: products.find((p) => p.id == selectedProductId)?.name,
                                                            }
                                                            : null
                                                    }
                                                    onChange={(selected) => setSelectedProductId(selected.value)}
                                                    placeholder="Search Product..."
                                                    isSearchable={true}
                                                />
                                            </FormGroup>
                                        </Col>

                                        <Col md={2}>
                                            <FormGroup>
                                                <Label>Qty</Label>
                                                <Input
                                                    type="number"
                                                    value={quantity}
                                                    onChange={(e) => setQuantity(e.target.value)}
                                                />
                                            </FormGroup>
                                        </Col>

                                        <Col md={2}>
                                            <FormGroup>
                                                <Label>Price</Label>
                                                <Input
                                                    type="number"
                                                    value={price}
                                                    onChange={(e) => setPrice(e.target.value)}
                                                />
                                            </FormGroup>
                                        </Col>

                                        <Col md={2}>
                                            <FormGroup>
                                                <Label>Discount</Label>
                                                <Input
                                                    type="number"
                                                    value={discount}
                                                    onChange={(e) => setDiscount(e.target.value)}
                                                />
                                            </FormGroup>
                                        </Col>

                                        <Col md={2} className="d-flex align-items-end">
                                            <Button color="success" onClick={addToCart}>
                                                Add
                                            </Button>
                                        </Col>
                                    </Row>

                                    <hr />

                                    {/* Cart Items Table */}
                                    <h5>Cart Items</h5>

                                    <div className="table-responsive">
                                        <Table bordered className="text-center">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>#</th>
                                                    <th>Product</th>
                                                    <th>Qty</th>
                                                    <th>Price</th>
                                                    <th>Discount</th>
                                                    <th>Total</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {cartItems.length > 0 ? (
                                                    cartItems.map((item, index) => {
                                                        const total =
                                                            (parseFloat(item.quantity || 0) * parseFloat(item.price || 0)) -
                                                            parseFloat(item.discount || 0);

                                                        return (
                                                            <tr key={item.id}>
                                                                <td>{index + 1}</td>
                                                                <td>{item.product_name}</td>
                                                                <td>{item.quantity}</td>
                                                                <td>₹ {item.price}</td>
                                                                <td>₹ {item.discount}</td>
                                                                <td>₹ {total.toFixed(2)}</td>
                                                                <td>
                                                                    <Button
                                                                        color="danger"
                                                                        size="sm"
                                                                        onClick={() => deleteCartItem(item.id)}
                                                                    >
                                                                        Remove
                                                                    </Button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                ) : (
                                                    <tr>
                                                        <td colSpan="7">No cart items</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </Table>
                                    </div>

                                    <div className="text-end mt-3">
                                        <h5>Total Cart Amount: ₹ {getCartTotal()}</h5>
                                    </div>

                                    <div className="text-end mt-4">
                                        <Button
                                            color="primary"
                                            onClick={createInvoice}
                                            disabled={loading}
                                        >
                                            {loading ? "Creating..." : "Create Invoice"}
                                        </Button>
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

export default CreateInvoice;
