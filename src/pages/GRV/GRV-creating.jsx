import React, { useEffect, useState } from "react";
import {
    Card,
    Col,
    Container,
    Row,
    CardBody,
    CardTitle,
    Label,
    Form,
    Input,
    FormFeedback,
    Table,
    Button,
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
} from "reactstrap";
import { useFormik } from "formik";
import axios from "axios";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const token = localStorage.getItem("token");

const FormLayouts = () => {
    document.title = "New GRV | Beposoft";

    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [modal, setModal] = useState(false);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [orderProducts, setOrderProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [orderid, setOrderId] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const date = new Date();
    const status = "Shipped";
    const [rackModal, setRackModal] = useState({
        open: false,
        productUniqueId: null,
        racks: [],          // parsed racks for the product
        allocations: {},    // { `${rack_id}|${column_name}`: qty }
        maxQty: 1,          // product.rowQuantity (each row is 1 in your UI)
        productName: "",
    });
    const [invoiceModal, setInvoiceModal] = useState({
        open: false,
        productName: "",
        rackDetails: [], // parsed from product.products into rack_details
    });
    const [rackDetailsModal, setRackDetailsModal] = useState({
        open: false,
        productUniqueId: null,
        racks: [],           // parsed racks for the product
        allocations: {},     // { `${rack_id}|${column_name}`: qty }
        maxQty: 1,           // rowQuantity of that line
        productName: "",
    });

    // Parse the `products` field which may be a JSON-like string with single quotes
    const parseRacks = (raw) => {
        try {
            if (!raw) return [];
            if (Array.isArray(raw)) return raw;
            // many backends send single-quoted pseudo-JSON
            const normalized = raw.replaceAll("'", '"');
            const parsed = JSON.parse(normalized);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    };

    // Compute usable stock (optional: subtract locked quantity if present)
    const rackUsable = (rack) => {
        const stock = Number(rack?.rack_stock ?? 0);
        const locked = Number(rack?.rack_lock ?? 0);
        return Math.max(stock - locked, 0);
    };

    // Validate that every selected product has non-empty selected_racks
    const allRowsHaveRacks = (rows) => rows.length > 0 && rows.every(r => Array.isArray(r.selected_racks) && r.selected_racks.length > 0);

    const openRackSelector = (row) => {
        const racks = parseRacks(row.products)
            .map(r => ({
                rack_id: r.rack_id,
                rack_name: r.rack_name,
                column_name: r.column_name,
                usability: r.usability,
                rack_stock: Number(r.rack_stock ?? 0),
                rack_lock: Number(r.rack_lock ?? 0),
                usable: rackUsable(r),
            }))
            // show usable racks first
            .sort((a, b) => b.usable - a.usable);

        // Prefill allocations if user already picked
        const allocations = {};
        if (Array.isArray(row.selected_racks)) {
            row.selected_racks.forEach(sel => {
                const key = `${sel.rack_id}|${sel.column_name}`;
                allocations[key] = Number(sel.quantity || 0);
            });
        }

        setRackModal({
            open: true,
            productUniqueId: row.uniqueId,
            racks,
            allocations,
            maxQty: Number(row.rowQuantity ?? 1),
            productName: row.name,
        });
    };

    const saveRackAllocations = () => {
        const { allocations, racks, productUniqueId, maxQty } = rackModal;

        // Build array and validate
        const picked = Object.entries(allocations)
            .map(([key, qty]) => {
                const q = Number(qty || 0);
                if (q <= 0) return null;
                const [rack_id_str, column_name] = key.split("|");
                const rack_id = Number(rack_id_str);
                const meta = racks.find(r => r.rack_id === rack_id && r.column_name === column_name) || {};
                return {
                    rack_id,
                    column_name,
                    rack_name: meta.rack_name,
                    usability: meta.usability,
                    quantity: q,
                };
            })
            .filter(Boolean);

        const total = picked.reduce((s, r) => s + Number(r.quantity || 0), 0);

        if (total === 0) {
            toast.error("Please allocate at least 1 unit.");
            return;
        }
        if (total > maxQty) {
            toast.error(`Allocated ${total}, but row quantity is ${maxQty}. Reduce allocation.`);
            return;
        }

        // Optional: verify each pick doesn't exceed usable
        for (const p of picked) {
            const meta = rackModal.racks.find(r => r.rack_id === p.rack_id && r.column_name === p.column_name);
            if (!meta) continue;
            if (Number(p.quantity) > Number(meta.usable)) {
                toast.error(`Rack ${meta.rack_name}-${meta.column_name} only has ${meta.usable} usable units.`);
                return;
            }
        }

        setSelectedProducts(prev =>
            prev.map(row =>
                row.uniqueId === productUniqueId
                    ? { ...row, selected_racks: picked }
                    : row
            )
        );

        setRackModal(m => ({ ...m, open: false }));
    };

    const toInvoice = (row) => {
        // Parse from the product's `products` field and compute usable qty
        const racks = parseRacks(row.products).map(r => ({
            rack_id: r.rack_id,
            rack_name: r.rack_name,
            column_name: r.column_name,
            usability: r.usability,
            rack_stock: Number(r.rack_stock ?? 0),
            rack_lock: Number(r.rack_lock ?? 0),
            usable: rackUsable(r),
        }));

        // Save rack_details onto this product row
        setSelectedProducts(prev =>
            prev.map(p =>
                p.uniqueId === row.uniqueId ? { ...p, rack_details: racks } : p
            )
        );

        // Show modal
        setInvoiceModal({
            open: true,
            productName: row.name,
            rackDetails: racks,
        });
    };

    const openRackDetailsSelector = (row) => {
        const racks = parseRacks(row.products)
            .map(r => ({
                rack_id: r.rack_id,
                rack_name: r.rack_name,
                column_name: r.column_name,
                usability: r.usability,
                rack_stock: Number(r.rack_stock ?? 0),
                rack_lock: Number(r.rack_lock ?? 0),
                usable: rackUsable(r),
            }))
            .sort((a, b) => b.usable - a.usable);

        // Prefill from existing rack_details if any
        const allocations = {};
        if (Array.isArray(row.rack_details)) {
            row.rack_details.forEach(sel => {
                const key = `${sel.rack_id}|${sel.column_name}`;
                allocations[key] = Number(sel.quantity || 0);
            });
        }

        setRackDetailsModal({
            open: true,
            productUniqueId: row.uniqueId,
            racks,
            allocations,
            maxQty: Number(row.rowQuantity ?? 1),
            productName: row.name,
        });
    };

    const saveRackDetailsAllocations = () => {
        const { allocations, racks, productUniqueId, maxQty } = rackDetailsModal;

        // Build array from allocations
        const picked = Object.entries(allocations)
            .map(([key, qty]) => {
                const q = Number(qty || 0);
                if (q <= 0) return null;
                const [rack_id_str, column_name] = key.split("|");
                const rack_id = Number(rack_id_str);
                const meta = racks.find(r => r.rack_id === rack_id && r.column_name === column_name) || {};
                return {
                    rack_id,
                    column_name,
                    rack_name: meta.rack_name,
                    usability: meta.usability,
                    quantity: q,
                };
            })
            .filter(Boolean);

        const total = picked.reduce((s, r) => s + Number(r.quantity || 0), 0);

        if (total === 0) {
            toast.error("Please allocate at least 1 unit.");
            return;
        }
        if (total > maxQty) {
            toast.error(`Allocated ${total}, but row quantity is ${maxQty}. Reduce allocation.`);
            return;
        }

        // Guard against exceeding usable per rack
        for (const p of picked) {
            const meta = rackDetailsModal.racks.find(r => r.rack_id === p.rack_id && r.column_name === p.column_name);
            if (!meta) continue;
            if (Number(p.quantity) > Number(meta.usable)) {
                toast.error(`Rack ${meta.rack_name}-${meta.column_name} only has ${meta.usable} usable units.`);
                return;
            }
        }

        // Save into rack_details on that row
        setSelectedProducts(prev =>
            prev.map(row =>
                row.uniqueId === productUniqueId
                    ? { ...row, rack_details: picked }
                    : row
            )
        );

        setRackDetailsModal(m => ({ ...m, open: false }));
    };

    const currentDate = date.toISOString().split('T')[0]; // This will give you the date in "YYYY-MM-DD" format

    // Format the current time as HH:mm:ss
    const currentTime = date.toTimeString().split(' ')[0];

    // Fetch orders on component mount
    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const endpoint = `${import.meta.env.VITE_APP_KEY}orders/${status}/`;
                const response = await axios.get(endpoint, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setOrders(response.data?.results);
            } catch (error) {
                toast.error(error.response?.data || error.message);
            }
        };

        fetchOrders();
    }, [status]);

    const handleOrderChange = async (e) => {
        const selectedId = parseInt(e.target.value, 10);
        const order = orders.find((o) => o.id === selectedId);
        setSelectedOrder(order || null);

        if (order) {
            formik.setValues({
                order: selectedId,
                invoice: order.invoice || "",
                order_date: order.order_date || "",
                billing_address: order.billing_address?.address || "",
                manage_staff: order.manage_staff || "",
            });
        } else {
            formik.resetForm();
        }
    };

    const FetchReturnProducts = async (id) => {

        toggleModal();

        try {
            const response = await axios.get(`${import.meta.env.VITE_APP_KEY}order/${id}/items/`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            });
            if (response.status === 200) {
                setOrderProducts(response.data?.items);
            }
        } catch (error) {
            toast.error("error fetching products");
        }
    }

    const toggleModal = () => setModal(!modal);

    const handleProductSelect = (product, quantity) => {
        if (quantity > 0) {
            const newProducts = Array.from({ length: quantity }, () => ({
                ...product,
                uniqueId: `${product.id}-${Math.random()}`, // Ensure unique row
                rowQuantity: 1,
                remark: "",
            }));
            setSelectedProducts((prev) => [...prev, ...newProducts]);
        }
        toggleModal();
    };

    const handleSaveInvoice = async () => {
        const dataToSave = selectedProducts.map((product) => ({
            order: selectedOrder.id,
            product: product.name,
            returnreason: product.returnReason || "usable",
            price: product.rate,
            quantity: product.rowQuantity,
            remark: product.remark || "",
            cod_amount: product.cod_amount || null,
            status: "Waiting For Approval",
            note: product.note || "",
            date: currentDate,
            time: currentTime,
            product_id: product.product,
            selected_racks: product.selected_racks || [],
            rack_details: product.rack_details || [],
        }));

        // Optional: hard guard to ensure every row has racks
        if (!allRowsHaveRacks(selectedProducts)) {
            toast.error("Please select racks for all products before generating the invoice.");
            return;
        }

        setLoading(true);
        try {
            const endpoint = `${import.meta.env.VITE_APP_KEY}grv/data/`;
            await axios.post(endpoint, dataToSave, {
                headers: { Authorization: `Bearer ${token}` },
            });
            alert("Invoice saved successfully!");
            setSelectedProducts([]);
        } catch (error) {
            alert("Error saving invoice. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const formik = useFormik({
        initialValues: {
            order: "",
            invoice: "",
            manage_staff: "",
            billing_address: "",
            order_date: "",
        },
        onSubmit: (values) => {
        },
    });

    const filteredOrders = orders.filter((order) => {
        const term = searchTerm.toLowerCase();
        const invoice = order.invoice?.toLowerCase() || "";
        const staff = order.manage_staff?.toLowerCase() || "";
        const amount = String(order.total_amount || "").toLowerCase();

        return (
            invoice.includes(term) ||
            staff.includes(term) ||
            amount.includes(term)
        );
    });

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid={true}>
                    <Breadcrumbs title="Forms" breadcrumbItem="NEW GRV" />
                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <CardTitle className="mb-4">Invoice Form</CardTitle>
                                    <Form onSubmit={formik.handleSubmit}>
                                        <Row>
                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Label htmlFor="order">Select Order</Label>
                                                    <input
                                                        type="text"
                                                        placeholder="Search Orders..."
                                                        value={searchTerm}
                                                        onChange={(e) => setSearchTerm(e.target.value)}
                                                        className="form-control"
                                                    />

                                                    {searchTerm && filteredOrders.length > 0 && (
                                                        <ul
                                                            className="order-dropdown"
                                                            style={{
                                                                border: '1px solid #ccc',
                                                                maxHeight: '150px',
                                                                overflowY: 'auto',
                                                                marginTop: 0,
                                                                paddingLeft: 0,
                                                                backgroundColor: 'white',
                                                                position: 'absolute',
                                                                zIndex: 1000,
                                                                width: '100%',
                                                            }}
                                                        >
                                                            {filteredOrders.map(order => (
                                                                <li
                                                                    key={order.id}
                                                                    style={{ listStyle: 'none', padding: '8px', cursor: 'pointer' }}
                                                                    onClick={() => {
                                                                        setSearchTerm(`Order #${order.invoice || "N/A"}`);
                                                                        setSelectedOrder(order);
                                                                        formik.setFieldValue("order", order.id);

                                                                        formik.setValues({
                                                                            order: order.id,
                                                                            invoice: order.invoice || "",
                                                                            order_date: order.order_date || "",
                                                                            billing_address: order.billing_address?.address || "",
                                                                            manage_staff: order.manage_staff || "",
                                                                        });
                                                                    }}
                                                                >
                                                                    {`Order #${order.invoice || "N/A"} - ${order.manage_staff || "No Staff"} - ₹${order.total_amount || "No Amount"}`}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}

                                                    <Input
                                                        type="select"
                                                        name="order"
                                                        className="form-control mt-2"
                                                        id="order"
                                                        value={formik.values.order}
                                                        onChange={handleOrderChange}
                                                        onBlur={formik.handleBlur}
                                                    >
                                                        <option value="">Choose Order</option>
                                                        {orders.map(order => (
                                                            <option key={order.id} value={order.id}>
                                                                {`Order #${order.invoice || "N/A"} - ${order.manage_staff || "No Staff"} - ₹${order.total_amount || "No Amount"}`}
                                                            </option>
                                                        ))}
                                                    </Input>

                                                    {formik.touched.order && formik.errors.order && (
                                                        <FormFeedback type="invalid">
                                                            {formik.errors.order}
                                                        </FormFeedback>
                                                    )}
                                                </div>
                                            </Col>
                                            <Col md={3}>
                                                <div className="mb-3">
                                                    <Label htmlFor="invoice">Invoice</Label>
                                                    <Input
                                                        type="text"
                                                        name="invoice"
                                                        id="invoice"
                                                        placeholder="Enter Invoice"
                                                        value={formik.values.invoice}
                                                        readOnly
                                                    />
                                                </div>
                                            </Col>
                                            <Col md={3}>
                                                <div className="mb-3">
                                                    <Label htmlFor="manage_staff">User Management</Label>
                                                    <Input
                                                        type="text"
                                                        name="manage_staff"
                                                        id="manage_staff"
                                                        value={formik.values.manage_staff}
                                                        readOnly
                                                    />
                                                </div>
                                            </Col>
                                            <Col md={2}>
                                                <div className="mb-3">
                                                    <Label htmlFor="order_date">Invoice Date</Label>
                                                    <Input
                                                        type="date"
                                                        name="order_date"
                                                        id="order_date"
                                                        value={formik.values.order_date}
                                                        readOnly
                                                    />
                                                </div>
                                            </Col>
                                        </Row>
                                        <Row>
                                            <Col md={12}>
                                                <div className="mb-3">
                                                    <Label htmlFor="billing_address">
                                                        Bill to Address
                                                    </Label>
                                                    <Input
                                                        type="textarea"
                                                        name="billing_address"
                                                        id="billing_address"
                                                        value={formik.values.billing_address}
                                                        readOnly
                                                    />
                                                </div>
                                            </Col>
                                        </Row>
                                    </Form>
                                    <Button color="primary" onClick={() => {
                                        if (selectedOrder) {
                                            FetchReturnProducts(selectedOrder.id);
                                        } else {
                                            return alert("Please select an order first");
                                        }
                                    }}>
                                        Add Products
                                    </Button>
                                </CardBody>
                            </Card>
                        </Col>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <div className="table-responsive">
                                        <Table className="table table-hover mb-0">
                                            <thead>
                                                <tr>
                                                    <th>#</th>
                                                    <th>Image</th>
                                                    <th>Product Name</th>
                                                    <th>Price</th>
                                                    <th>Quantity</th>
                                                    <th>Return Reason</th>
                                                    <th>Remark</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedProducts.map((product, index) => (
                                                    <tr key={product.uniqueId}>
                                                        <td>{index + 1}</td>
                                                        <td>
                                                            <img
                                                                src={`${import.meta.env.VITE_APP_IMAGE}${product.image}`}
                                                                alt={product.name}
                                                                style={{
                                                                    width: "50px",
                                                                    height: "50px",
                                                                    objectFit: "cover",
                                                                    borderRadius: "5px",
                                                                }}
                                                            />
                                                        </td>
                                                        {/* <td>{product.name}</td> */}
                                                        <td>
                                                            {product.name}
                                                            {Array.isArray(product.selected_racks) &&
                                                                product.selected_racks.length > 0 && (
                                                                    <div className="mt-1">
                                                                        <small className="badge bg-light text-dark">
                                                                            {product.selected_racks
                                                                                .map(
                                                                                    (r) =>
                                                                                        `${r.rack_name}-${r.column_name} (${r.usability}):${r.quantity}`
                                                                                )
                                                                                .join(", ")}
                                                                        </small>
                                                                    </div>
                                                                )}
                                                        </td>
                                                        <td>₹{product.rate ? product.rate : "0.00"}</td> {/* Fixed here */}
                                                        {/* <td>1</td> */}
                                                        <td style={{ maxWidth: 120 }}>
                                                            <Input
                                                                type="number"
                                                                min="1"
                                                                value={product.rowQuantity ?? 1}
                                                                onChange={(e) => {
                                                                    const q = Math.max(1, Number(e.target.value || 1));
                                                                    setSelectedProducts(prev =>
                                                                        prev.map(p =>
                                                                            p.uniqueId === product.uniqueId
                                                                                ? { ...p, rowQuantity: q }
                                                                                : p
                                                                        )
                                                                    );
                                                                }}
                                                            />
                                                        </td>
                                                        <td>
                                                            <select
                                                                className="form-select"
                                                                value={product.returnReason || ""}
                                                                onChange={(e) => {
                                                                    const selectedReason = e.target.value;
                                                                    setSelectedProducts((prev) =>
                                                                        prev.map((p) =>
                                                                            p.uniqueId === product.uniqueId
                                                                                ? { ...p, returnReason: selectedReason }
                                                                                : p
                                                                        )
                                                                    );
                                                                }}
                                                            >
                                                                <option value="">Select Reason</option>
                                                                <option value="damaged">Damaged</option>
                                                                <option value="partially_damaged">Partially Damaged</option>
                                                                <option value="usable">Usable</option>
                                                            </select>
                                                            <Input
                                                                type="text"
                                                                name="note"
                                                                value={product.note || ""}
                                                                onChange={(e) => {
                                                                    const value = e.target.value;
                                                                    setSelectedProducts((prev) =>
                                                                        prev.map((p) =>
                                                                            p.uniqueId === product.uniqueId
                                                                                ? { ...p, note: value }
                                                                                : p
                                                                        )
                                                                    );
                                                                }}
                                                                placeholder="Add Description"
                                                                className="mt-1"
                                                            />
                                                        </td>
                                                        {/* <td>
                                                            <select
                                                                className="form-select"
                                                                value={product.remark || ""}
                                                                onChange={(e) => {
                                                                    const value = e.target.value;
                                                                    setSelectedProducts((prev) =>
                                                                        prev.map((p) =>
                                                                            p.uniqueId === product.uniqueId ? { ...p, remark: value } : p
                                                                        )
                                                                    );
                                                                }}
                                                            >
                                                                <option value="">Select Remark</option>
                                                                <option value="return">Return</option>
                                                                <option value="cod_return">COD Return</option>
                                                                <option value="refund">Refund</option>
                                                                <option value="exchange">Exchange</option>
                                                            </select>
                                                        </td> */}
                                                        <td>
                                                            <select
                                                                className="form-select"
                                                                value={product.remark || ""}
                                                                onChange={(e) => {
                                                                    const value = e.target.value;
                                                                    setSelectedProducts((prev) =>
                                                                        prev.map((p) =>
                                                                            p.uniqueId === product.uniqueId ? { ...p, remark: value } : p
                                                                        )
                                                                    );
                                                                }}
                                                            >
                                                                <option value="">Select Remark</option>
                                                                <option value="return">Return</option>
                                                                <option value="cod_return">COD Return</option>
                                                                <option value="refund">Refund</option>
                                                                <option value="exchange">Exchange</option>
                                                            </select>

                                                            {product.remark === "cod_return" && (
                                                                <Input
                                                                    type="number"
                                                                    min="0"
                                                                    step="0.01"
                                                                    placeholder="COD Amount"
                                                                    className="mt-1"
                                                                    value={product.cod_amount || ""}
                                                                    onChange={(e) => {
                                                                        const val = e.target.value;
                                                                        setSelectedProducts((prev) =>
                                                                            prev.map((p) =>
                                                                                p.uniqueId === product.uniqueId
                                                                                    ? { ...p, cod_amount: val }
                                                                                    : p
                                                                            )
                                                                        );
                                                                    }}
                                                                />
                                                            )}
                                                        </td>
                                                        {/* <td>
                                                            <Button
                                                                color="danger"
                                                                onClick={() =>
                                                                    setSelectedProducts((prev) =>
                                                                        prev.filter((p) => p.uniqueId !== product.uniqueId)
                                                                    )
                                                                }
                                                            >
                                                                Remove
                                                            </Button>
                                                        </td> */}
                                                        <td className="d-flex gap-2">
                                                            <Button
                                                                color={product.selected_racks?.length ? "secondary" : "primary"}
                                                                onClick={() => openRackSelector(product)}
                                                            >
                                                                {product.selected_racks?.length ? "Edit To Invoice" : "To Invoice"}
                                                            </Button>

                                                            <Button
                                                                color="info"
                                                                onClick={() => openRackDetailsSelector(product)}
                                                            >
                                                                To Racks
                                                            </Button>

                                                            <Button
                                                                color="danger"
                                                                onClick={() =>
                                                                    setSelectedProducts(prev => prev.filter(p => p.uniqueId !== product.uniqueId))
                                                                }
                                                            >
                                                                Remove
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>

                                        </Table>
                                        <Modal isOpen={rackModal.open} toggle={() => setRackModal(m => ({ ...m, open: !m.open }))} size="lg">
                                            <ModalHeader toggle={() => setRackModal(m => ({ ...m, open: !m.open }))}>
                                                Select Racks — {rackModal.productName}
                                            </ModalHeader>
                                            <ModalBody>
                                                {rackModal.racks.length ? (
                                                    <Table bordered responsive>
                                                        <thead>
                                                            <tr>
                                                                <th>#</th>
                                                                <th>Rack</th>
                                                                <th>Column</th>
                                                                <th>Usability</th>
                                                                {/* <th>Usable Qty</th> */}
                                                                <th>Allocate</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {rackModal.racks.map((r, idx) => {
                                                                const key = `${r.rack_id}|${r.column_name}`;
                                                                const value = rackModal.allocations[key] ?? "";
                                                                return (
                                                                    <tr key={key}>
                                                                        <td>{idx + 1}</td>
                                                                        <td>{r.rack_name}</td>
                                                                        <td>{r.column_name}</td>
                                                                        <td>{r.usability}</td>
                                                                        {/* <td>{r.usable}</td> */}
                                                                        <td style={{ maxWidth: 140 }}>
                                                                            <Input
                                                                                type="number"
                                                                                min="0"
                                                                                max={r.usable}
                                                                                value={value}
                                                                                onChange={(e) => {
                                                                                    const val = e.target.value ? Math.max(0, Math.min(Number(e.target.value), r.usable)) : "";
                                                                                    setRackModal(m => ({
                                                                                        ...m,
                                                                                        allocations: { ...m.allocations, [key]: val }
                                                                                    }));
                                                                                }}
                                                                            />
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </Table>
                                                ) : (
                                                    <p className="mb-0">No rack info found for this product.</p>
                                                )}
                                                <div className="text-muted mt-2">
                                                    Row Qty: <strong>{rackModal.maxQty}</strong> • Total Allocated:&nbsp;
                                                    <strong>
                                                        {Object.values(rackModal.allocations).reduce((s, v) => s + (Number(v) || 0), 0)}
                                                    </strong>
                                                </div>
                                            </ModalBody>
                                            <ModalFooter>
                                                <Button color="primary" onClick={saveRackAllocations}>Save</Button>
                                                <Button color="secondary" onClick={() => setRackModal(m => ({ ...m, open: false }))}>Cancel</Button>
                                            </ModalFooter>
                                        </Modal>
                                        <Modal
                                            isOpen={rackDetailsModal.open}
                                            toggle={() => setRackDetailsModal(m => ({ ...m, open: !m.open }))}
                                            size="lg"
                                        >
                                            <ModalHeader toggle={() => setRackDetailsModal(m => ({ ...m, open: !m.open }))}>
                                                Select Racks (To Invoice) — {rackDetailsModal.productName}
                                            </ModalHeader>
                                            <ModalBody>
                                                {rackDetailsModal.racks.length ? (
                                                    <Table bordered responsive>
                                                        <thead>
                                                            <tr>
                                                                <th>#</th>
                                                                <th>Rack</th>
                                                                <th>Column</th>
                                                                <th>Usability</th>
                                                                <th>Usable</th>
                                                                <th>Allocate</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {rackDetailsModal.racks.map((r, idx) => {
                                                                const key = `${r.rack_id}|${r.column_name}`;
                                                                const value = rackDetailsModal.allocations[key] ?? "";
                                                                return (
                                                                    <tr key={key}>
                                                                        <td>{idx + 1}</td>
                                                                        <td>{r.rack_name}</td>
                                                                        <td>{r.column_name}</td>
                                                                        <td>{r.usability}</td>
                                                                        <td>{r.usable}</td>
                                                                        <td style={{ maxWidth: 140 }}>
                                                                            <Input
                                                                                type="number"
                                                                                min="0"
                                                                                max={r.usable}
                                                                                value={value}
                                                                                onChange={(e) => {
                                                                                    const val = e.target.value
                                                                                        ? Math.max(0, Math.min(Number(e.target.value), r.usable))
                                                                                        : "";
                                                                                    setRackDetailsModal(m => ({
                                                                                        ...m,
                                                                                        allocations: { ...m.allocations, [key]: val }
                                                                                    }));
                                                                                }}
                                                                            />
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </Table>
                                                ) : (
                                                    <p className="mb-0">No rack info found for this product.</p>
                                                )}
                                                <div className="text-muted mt-2">
                                                    Row Qty: <strong>{rackDetailsModal.maxQty}</strong> • Total Allocated:&nbsp;
                                                    <strong>
                                                        {Object.values(rackDetailsModal.allocations).reduce((s, v) => s + (Number(v) || 0), 0)}
                                                    </strong>
                                                </div>
                                            </ModalBody>
                                            <ModalFooter>
                                                <Button color="primary" onClick={saveRackDetailsAllocations}>Save</Button>
                                                <Button color="secondary" onClick={() => setRackDetailsModal(m => ({ ...m, open: false }))}>Cancel</Button>
                                            </ModalFooter>
                                        </Modal>
                                    </div>
                                </CardBody>
                                <Button
                                    color="success"
                                    onClick={handleSaveInvoice}
                                    disabled={loading || selectedProducts.length === 0 || !allRowsHaveRacks(selectedProducts)}
                                >
                                    {loading ? "Generating Invoice..." : "Generate Invoice"}
                                </Button>

                            </Card>
                        </Col>

                    </Row>
                </Container>

                <Modal isOpen={modal} toggle={toggleModal} size="lg">
                    <ModalHeader toggle={toggleModal}>Order Products</ModalHeader>
                    <ModalBody>
                        {orderProducts.length > 0 ? (
                            <Table bordered>
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Name</th>
                                        <th>Image</th>
                                        <th>Price</th>
                                        <th>Quantity</th>
                                        <th>Return Quantity</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orderProducts.map((product, index) => {
                                        let quantity = 1; // Default quantity
                                        return (
                                            <tr key={product.id}>
                                                <td>{index + 1}</td>
                                                <td>{product.name} </td>
                                                <td>
                                                    <img
                                                        src={`${import.meta.env.VITE_APP_IMAGE}${product.image}`}
                                                        alt={product.name}
                                                        style={{
                                                            width: "50px",
                                                            height: "50px",
                                                            objectFit: "cover",
                                                            borderRadius: "5px",
                                                        }}
                                                    />
                                                </td>
                                                <td>₹{product?.rate}</td>
                                                <td>{product.quantity}</td>
                                                <td>
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        defaultValue="1"
                                                        onChange={(e) =>
                                                            (quantity = parseInt(e.target.value, 10) || 1)
                                                        }
                                                    />
                                                </td>
                                                <td>
                                                    <Button
                                                        color="primary"
                                                        onClick={() =>
                                                            handleProductSelect(product, quantity)
                                                        }
                                                    >
                                                        Add
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </Table>
                        ) : (
                            <p>No products found for the selected order.</p>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button color="secondary" onClick={toggleModal}>
                            Close
                        </Button>
                    </ModalFooter>
                </Modal>
            </div>
        </React.Fragment>
    );
};

export default FormLayouts;
