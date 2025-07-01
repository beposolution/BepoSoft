import axios from "axios";
import React, { useState, useEffect } from "react";
import { Card, Col, Container, Table, Button, Row, CardBody, CardTitle, Label, Form, Input, FormFeedback } from "reactstrap";
import * as Yup from 'yup';
import { useFormik } from "formik";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import AddProduct from "./Add-product";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Link } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const FormLayouts = () => {
    // Meta title
    document.title = "New Order | Beposoft";

    const token = localStorage.getItem("token");
    const [states, setStates] = useState([]); // All states
    const [staffs, setStaffs] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [allocatedStates, setAllocatedStates] = useState([]);
    const [loggedUser, setLoggedUser] = useState(null);
    const [familys, setFamilys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState({});
    const [paymentStatus, setPaymentStatus] = useState("");
    const [bankName, setBankName] = useState("");
    const [transactionId, setTransactionId] = useState("");
    const [cartProducts, setCartProducts] = useState([]);
    const [customerAddresses, setCustomerAddresses] = useState([]); // State for customer addresses
    const [searchTerm, setSearchTerm] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [banks, setBank] = useState([]);
    const [companys, setCompany] = useState([]);
    const [customerDetails, setCustomerDetails] = useState([]);
    const [userData, setUserData] = useState("");
    const [role, setRole] = useState(null);

    const [cartTotalAmount, setCartTotalAmount] = useState(0);
    const [cartTotalDiscount, setCartTotalDiscount] = useState(0);
    const [finalAmount, setFinalAmount] = useState(0);

    const toggleModal = () => setModalOpen(!modalOpen);

    // Formik setup
    const formik = useFormik({
        initialValues: {
            state: "",
            company: "",
            family: "",
            customer: "",
            manage_staff: "",
            billing_address: "",
            payment_status: "",
            payment_method: "",
            bank: "",
            total_amount: 0,
            order_date: new Date().toISOString().substring(0, 10),
        },
        validationSchema: Yup.object({
            state: Yup.string().required("This field is required"),
            company: Yup.string().required("Company selection is required"),
            family: Yup.string().required("This field is required"),
            customer: Yup.string().required("This field is required"),
            manage_staff: Yup.string().required("This field is required"),
            billing_address: Yup.string().required("Shipping address selection is required"),
            payment_status: Yup.string().required("Payment status is required"),
            payment_method: Yup.string().required("Payment method is required"),
            bank: Yup.string().required("Bank selection is required"),
        }),
        onSubmit: async (values) => {
            const payload = {
                ...values,
                total_amount: finalAmount, // Override with the current value
            };

            try {
                const response = await axios.post(
                    `${import.meta.env.VITE_APP_KEY}order/create/`,
                    payload,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                if (response.status === 201) {
                    toast.success("order created successfully");
                    formik.resetForm();
                } else {
                    toast.error("Failed to create order");
                }
            } catch (error) {
                toast.error("Error saving data");
                setError((prevError) => ({
                    ...prevError,
                    submitError: "Failed to save data",
                }));
            }
        },

    });

    const generateInvoice = async () => {
        const doc = new jsPDF();
        const invoiceElement = document.getElementById("invoice-content");

        await html2canvas(invoiceElement).then((canvas) => {
            const imgData = canvas.toDataURL("image/png");
            const imgWidth = 190; // PDF page width in jsPDF
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            doc.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
            doc.save("invoice.pdf");
        });
    };

    useEffect(() => {
        const role = localStorage.getItem("active");
        setRole(role);
    }, []);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_APP_KEY}profile/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUserData(response?.data?.data?.family_name);
            } catch (error) {
                toast.error('Error fetching user data');
            }
        };
        fetchUserData();
    }, []);

    const matchedCustomers = customerDetails.filter(
        (customer) => customer.family && customer.family === userData
    );

    useEffect(() => {
        const fetchData = async () => {
            if (token) {
                setLoading(true);
                try {
                    const [
                        statesResponse,
                        ManagedResponse,
                        familyResponse,
                        StaffResponse,
                        staffcustomersResponse,
                        bankResponse,
                        companyResponse,
                        allCustomersResponse
                    ] = await Promise.all([
                        axios.get(`${import.meta.env.VITE_APP_KEY}states/`, { headers: { Authorization: `Bearer ${token}` } }),
                        axios.get(`${import.meta.env.VITE_APP_KEY}staffs/`, { headers: { Authorization: `Bearer ${token}` } }),
                        axios.get(`${import.meta.env.VITE_APP_KEY}familys/`, { headers: { Authorization: `Bearer ${token}` } }),
                        axios.get(`${import.meta.env.VITE_APP_KEY}profile/`, { headers: { Authorization: `Bearer ${token}` } }),
                        axios.get(`${import.meta.env.VITE_APP_KEY}staff/customers/`, { headers: { Authorization: `Bearer ${token}` } }),
                        axios.get(`${import.meta.env.VITE_APP_KEY}banks/`, { headers: { Authorization: `Bearer ${token}` } }),
                        axios.get(`${import.meta.env.VITE_APP_KEY}company/data/`, { headers: { Authorization: `Bearer ${token}` } }),
                        axios.get(`${import.meta.env.VITE_APP_KEY}customers/`, { headers: { Authorization: `Bearer ${token}` } }),
                    ]);

                    // Set all fetched data
                    setStates(statesResponse.data.data || []);
                    setFamilys(familyResponse.data.data || []);
                    setStaffs(ManagedResponse.data.data || []);
                    setCustomers(staffcustomersResponse.data.data || []);
                    setCompany(companyResponse.data.data || []);
                    setBank(bankResponse.data.data || []);
                    setCustomerDetails(allCustomersResponse.data.data || []);

                    if (StaffResponse.status === 200) {
                        const user = StaffResponse.data.data;
                        setLoggedUser(user);
                        formik.setFieldValue("manage_staff", user.id || "");
                        formik.setFieldValue("family", user.family || "");

                        // Handle allocated states after states have been set
                        if (statesResponse.data.data && user.allocated_states) {
                            const allocatedStates = user.allocated_states || [];
                            const filteredStates = statesResponse.data.data.filter(state => allocatedStates.includes(state.id));
                            setAllocatedStates(filteredStates);
                        }
                    }
                } catch (error) {
                    setError(prevError => ({ ...prevError, fetchData: error.message || "Failed to fetch data" }));
                } finally {
                    setLoading(false);
                }
            } else {
                setError(prevError => ({ ...prevError, token: "Token not found" }));
                setLoading(false);
            }
        };

        fetchData();
    }, [token]);


    // Search and select customer
    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };

    const handleCustomerChange = async (event) => {
        const selectedCustomerId = event.target.value;
        formik.setFieldValue("customer", selectedCustomerId);

        try {
            const response = await axios.get(`${import.meta.env.VITE_APP_KEY}add/customer/address/${selectedCustomerId}/`, { headers: { Authorization: `Bearer ${token}` } });
            if (response.status === 200) {
                setCustomerAddresses(response.data.data);
            } else {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
        } catch (error) {
            setError(prevError => ({ ...prevError, customerAddresses: "Failed to fetch customer addresses" }));
            setCustomerAddresses([]);
        }
    };

    // Filter customers based on search term
    const filteredCustomers = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const fetchCartProducts = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_APP_KEY}cart/products/`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setCartProducts(data.data);

                // Calculate the total amount based on the product price and quantity
                const totalAmount = data.data.reduce((acc, product) => {
                    return acc + (product.price * product.quantity);
                }, 0);

                const totalDiscount = data.data.reduce((acc, product) => {
                    return acc + ((product.discount || 0) * product.quantity);
                }, 0);

                const finalAmountAfterDiscount = totalAmount - totalDiscount;

                // Update the state for total amount, total discount, and final amount
                setCartTotalAmount(totalAmount);
                setCartTotalDiscount(totalDiscount);
                setFinalAmount(finalAmountAfterDiscount);


            } else {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
        } catch (error) {
            setError(prevError => ({ ...prevError, cartProducts: "Failed to fetch cart products" }));
        }
    };

    useEffect(() => {
        if (token) {
            fetchCartProducts();
        }
    }, [token, cartProducts]);

    // Function to update the cart product
    const updateCartProduct = async (productId, updatedFields) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_APP_KEY}cart/update/${productId}/`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedFields)
            });

            if (response.ok) {
                const updatedProduct = await response.json();
            } else {
                throw new Error(`Failed to update the product. Status: ${response.status}`);
            }
        } catch (error) {
            setError(prevError => ({ ...prevError, cartUpdate: "Failed to update the cart product" }));
        }
    };

    // Function to handle changes in description, discount, or quantity
    const handleDescriptionChange = (index, newDescription) => {
        const updatedCartProducts = [...cartProducts];
        updatedCartProducts[index].note = newDescription;
        setCartProducts(updatedCartProducts);
        updateCartProduct(updatedCartProducts[index].id, { note: newDescription });
    };

    const handleDiscountChange = (index, newDiscount) => {
        const updatedCartProducts = [...cartProducts];
        updatedCartProducts[index].discount = parseFloat(newDiscount);
        setCartProducts(updatedCartProducts);
        updateCartProduct(updatedCartProducts[index].id, { discount: newDiscount });
    };

    const handleQuantityChange = (index, newQuantity) => {
        const updatedCartProducts = [...cartProducts];
        updatedCartProducts[index].quantity = parseInt(newQuantity, 10);
        setCartProducts(updatedCartProducts);
        updateCartProduct(updatedCartProducts[index].id, { quantity: newQuantity });
    };

    const handleRemoveProduct = async (productId) => {
        try {
            const response = await axios.delete(`${import.meta.env.VITE_APP_KEY}cart/update/${productId}/`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.status === 204 || response.status === 200) {
                setCartProducts(prevCart => prevCart.filter(product => product.id !== productId));
            } else {
                throw new Error(`Failed to delete the product. Status: ${response.status}`);
            }
        } catch (error) {
            setError(prevError => ({ ...prevError, cartDelete: "Failed to remove the product from the cart" }));
        }
    };

    const handleProductSelect = (newProduct) => {
        const existingProductIndex = cartProducts.findIndex(product => product.id === newProduct.id);

        if (existingProductIndex !== -1) {
            const updatedCartProducts = [...cartProducts];
            updatedCartProducts[existingProductIndex].quantity += 1;
            setCartProducts(updatedCartProducts);
        } else {
            setCartProducts(prevCart => [...prevCart, { ...newProduct, quantity: 1 }]);
        }
    };

    const isInvalid = (name) => formik.touched[name] && formik.errors[name] ? true : false;

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid={true}>
                    <Breadcrumbs title="Forms" breadcrumbItem="CREATE NEW ORDER" />
                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <CardTitle className="mb-4">CREATE NEW ORDER</CardTitle>

                                    <Form onSubmit={formik.handleSubmit}>
                                        <Row>
                                            <Col md={6}>
                                                <div className="mb-3">
                                                    <Label htmlFor="company">Company</Label>
                                                    <Input
                                                        type="select"
                                                        name="company"
                                                        className="form-control"
                                                        id="company"
                                                        value={formik.values.company || (companys.length > 0 ? companys[0].id : '')}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.company && formik.errors.company ? true : false}
                                                    >
                                                        {/* Ensure the default option is selected if no company is provided */}
                                                        {companys.map((company, index) => (
                                                            <option key={index} value={company.id}>
                                                                {company.name}
                                                            </option>
                                                        ))}
                                                    </Input>
                                                    {formik.errors.company && formik.touched.company ? (
                                                        <FormFeedback type="invalid">{formik.errors.company}</FormFeedback>
                                                    ) : null}
                                                </div>
                                            </Col>


                                            <Col md={6}>
                                                <div className="mb-3">
                                                    <Label htmlFor="family">Family</Label>
                                                    <Input
                                                        type="select"
                                                        name="family"
                                                        className="form-control"
                                                        id="family"
                                                        value={formik.values.family}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.family && formik.errors.family ? true : false}
                                                    >
                                                        <option value="">Select a Family...</option>
                                                        {familys.map((fami) => (
                                                            <option key={fami.id} value={fami.id}>
                                                                {fami.name}
                                                            </option>
                                                        ))}
                                                    </Input>
                                                    {formik.errors.family && formik.touched.family ? (
                                                        <FormFeedback type="invalid">{formik.errors.family}</FormFeedback>
                                                    ) : null}
                                                </div>
                                            </Col>
                                        </Row>

                                        <Row>
                                            <Col md={8}>
                                                <div className="mb-3">
                                                    <Label htmlFor="customer">Customer</Label>
                                                    <Input
                                                        type="text"
                                                        placeholder="Search Customer..."
                                                        value={searchTerm}
                                                        onChange={handleSearchChange}
                                                        className="form-control"
                                                    />
                                                    <Input
                                                        type="select"
                                                        name="customer"
                                                        className="form-control mt-2"
                                                        id="customer"
                                                        value={formik.values.customer}
                                                        onChange={handleCustomerChange} // Use the new handler
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.customer && formik.errors.customer ? true : false}
                                                    >
                                                        <option value="">Select a Customer...</option>
                                                        {(role === "BDM" ? matchedCustomers : filteredCustomers).map((custo) => (
                                                            <option key={custo.id} value={custo.id}>
                                                                {custo.name}
                                                            </option>
                                                        ))}
                                                    </Input>
                                                    {formik.errors.customer && formik.touched.customer ? (
                                                        <FormFeedback type="invalid">{formik.errors.customer}</FormFeedback>
                                                    ) : null}
                                                </div>
                                            </Col>

                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Label htmlFor="manage_staff">Manage Staff</Label>
                                                    {/* Display the logged-in staff name */}
                                                    <Input
                                                        type="text"
                                                        id="manage_staff"
                                                        className="form-control"
                                                        value={loggedUser ? loggedUser.name : ""}
                                                        readOnly
                                                    />
                                                    {/* Hidden field to pass the staff id */}
                                                    <Input
                                                        type="hidden"
                                                        name="manage_staff"
                                                        value={formik.values.manage_staff}
                                                    />
                                                </div>
                                            </Col>

                                        </Row>

                                        <Row>
                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Label htmlFor="state">State</Label>
                                                    <Input
                                                        type="select"
                                                        name="state"
                                                        className="form-control"
                                                        id="state"
                                                        value={formik.values.state}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.state && formik.errors.state ? true : false}
                                                    >
                                                        <option value="">Select a State...</option>
                                                        {allocatedStates.map((stat) => (
                                                            <option key={stat.id} value={stat.id}>
                                                                {stat.name}
                                                            </option>
                                                        ))}
                                                    </Input>
                                                    {formik.errors.state && formik.touched.state ? (
                                                        <FormFeedback type="invalid">{formik.errors.state}</FormFeedback>
                                                    ) : null}
                                                </div>
                                            </Col>

                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Label htmlFor="billing_address">Shipping To</Label>
                                                    <Input
                                                        type="select"
                                                        name="billing_address"
                                                        className="form-control"
                                                        id="billing_address"
                                                        value={formik.values.billing_address}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.billing_address && formik.errors.billing_address ? true : false}
                                                    >
                                                        <option value="">Select a Shipping Address...</option>
                                                        {customerAddresses.map((address) => (
                                                            <option key={address.id} value={address.id}>
                                                                {address.name} - {address.address} - {address.city} - {address.zipcode} - {address.state} - {address.phone}
                                                            </option>
                                                        ))}
                                                    </Input>
                                                    {formik.errors.billing_address && formik.touched.billing_address ? (
                                                        <FormFeedback type="invalid">{formik.errors.billing_address}</FormFeedback>
                                                    ) : null}
                                                </div>
                                            </Col>

                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Label htmlFor="order_date">Current Date</Label>
                                                    <Input
                                                        type="date"
                                                        name="order_date"
                                                        className="form-control"
                                                        id="order_date"
                                                        value={formik.values.order_date}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                    />
                                                </div>
                                            </Col>
                                        </Row>


                                        <div className="mb-3">
                                            <Button color="primary" onClick={toggleModal}>
                                                ADD PRODUCTS
                                            </Button>
                                        </div>

                                        <div>
                                            <Row>
                                                <Col xl={12}>
                                                    <Card>
                                                        <CardBody>
                                                            <CardTitle className="h4">ORDER PRODUCTS</CardTitle>
                                                            <div className="table-responsive">
                                                                <Table className="table-custom mb-0 table-bordered table-hover">
                                                                    <thead>
                                                                        <tr>
                                                                            <th>#</th>
                                                                            <th>IMAGE</th>
                                                                            <th>NAME</th>
                                                                            <th>RATE</th>
                                                                            <th>TAX</th>

                                                                            <th>DESCRIPTION</th>
                                                                            <th>SIZE</th>
                                                                            <th>DISCOUNT</th>
                                                                            <th>PRICE</th>
                                                                            <th>QUANTITY</th>
                                                                            <th>TOTAL</th>
                                                                            <th>ACTION</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {cartProducts.length > 0 ? (
                                                                            cartProducts.map((product, index) => (
                                                                                <tr key={product.id || index}>
                                                                                    <td>{index + 1}</td>
                                                                                    <td>
                                                                                        <img
                                                                                            src={`${import.meta.env.VITE_APP_IMAGE}${product.image}`}
                                                                                            alt={product.name || "Product image"}
                                                                                            style={{ width: "50px", height: "50px" }}
                                                                                        />
                                                                                    </td>
                                                                                    <td>{product.name || "Unknown Product"}</td>
                                                                                    <td>₹ {Math.trunc(product.exclude_price) || 0}</td>
                                                                                    <td>{product.tax || 0} %</td>
                                                                                    <td>
                                                                                        <Input
                                                                                            type="text"
                                                                                            value={product.note || ""}
                                                                                            onChange={(e) => handleDescriptionChange(index, e.target.value)}
                                                                                            style={{ width: "100%" }}
                                                                                        />
                                                                                    </td>
                                                                                    <td>{product.size || "N/A"}</td>
                                                                                    <td>
                                                                                        <Input
                                                                                            type="number"
                                                                                            value={product.discount || 0}
                                                                                            min="0"
                                                                                            onChange={(e) => handleDiscountChange(index, e.target.value)}
                                                                                            className="input-sm"
                                                                                        />
                                                                                    </td>
                                                                                    <td>₹{(product.price || 0) - (product.discount || 0)}</td>
                                                                                    <td>
                                                                                        <Input
                                                                                            type="number"
                                                                                            value={product.quantity || 1}
                                                                                            onChange={(e) => handleQuantityChange(index, e.target.value)}
                                                                                            className="input-sm"
                                                                                        />
                                                                                    </td>
                                                                                    <td>₹{(((product.price || 0) * (product.quantity || 1)) - ((product.discount || 0) * (product.quantity || 1))).toFixed(2)}</td>
                                                                                    <td>
                                                                                        <Button
                                                                                            className="btn-remove"
                                                                                            onClick={() => handleRemoveProduct(product.id)}
                                                                                        >
                                                                                            Remove
                                                                                        </Button>
                                                                                    </td>
                                                                                </tr>
                                                                            ))
                                                                        ) : (
                                                                            <tr>
                                                                                <td colSpan="10" className="text-center">
                                                                                    No products selected.
                                                                                </td>
                                                                            </tr>
                                                                        )}
                                                                    </tbody>

                                                                </Table>
                                                            </div>

                                                            {/* AddProduct Modal */}
                                                            <AddProduct
                                                                isOpen={modalOpen}
                                                                toggle={toggleModal} 
                                                                ProductsFetch={fetchCartProducts}
                                                            />
                                                        </CardBody>
                                                    </Card>
                                                </Col>
                                            </Row>






                                            <Row className="mt-4">

                                                <Col md={6}>
                                                    <Card className="mb-3">
                                                        <CardBody>
                                                            <Label for="payment_status">Payment Status *</Label>
                                                            <Input
                                                                type="select"
                                                                name="payment_status"
                                                                id="payment_status"
                                                                value={formik.values.payment_status}
                                                                onChange={formik.handleChange}
                                                                onBlur={formik.handleBlur}
                                                                invalid={formik.touched.payment_status && formik.errors.payment_status ? true : false}
                                                            >
                                                                <option value="">Select</option>
                                                                <option value="paid">Paid</option>
                                                                <option value="COD">COD</option>
                                                                <option value="credit">Credit</option>
                                                            </Input>
                                                            {formik.errors.payment_status && formik.touched.payment_status ? (
                                                                <FormFeedback>{formik.errors.payment_status}</FormFeedback>
                                                            ) : null}

                                                            <Label for="bank" className="mt-3">Bank Name</Label>
                                                            <Input
                                                                type="select"
                                                                name="bank"
                                                                id="bank"
                                                                value={formik.values.bank}
                                                                onChange={formik.handleChange}
                                                                onBlur={formik.handleBlur}
                                                                invalid={formik.touched.bank && formik.errors.bank ? true : false}
                                                            >
                                                                <option value="">Select</option>
                                                                {banks.map((bank) => (
                                                                    <option key={bank.id} value={bank.id}>
                                                                        {bank.name}
                                                                    </option>
                                                                ))}
                                                            </Input>
                                                            {formik.errors.bank && formik.touched.bank ? (
                                                                <FormFeedback>{formik.errors.bank}</FormFeedback>
                                                            ) : null}

                                                            <Label for="payment_method" className="mt-3">Payment Method</Label>
                                                            <Input
                                                                type="select"
                                                                name="payment_method"
                                                                id="payment_method"
                                                                value={formik.values.payment_method}
                                                                onChange={formik.handleChange}
                                                                onBlur={formik.handleBlur}
                                                                invalid={formik.touched.payment_method && formik.errors.payment_method ? true : false}
                                                            >
                                                                <option value="">Select</option>
                                                                <option value="Credit Card">Credit Card</option>
                                                                <option value="Debit Card">Debit Card</option>
                                                                <option value="Net Banking">Net Banking</option>
                                                                <option value="PayPal">PayPal</option>
                                                                <option value="1 Razorpay">Razorpay</option>
                                                                <option value="Cash on Delivery (COD)">Cash on Delivery</option>
                                                                <option value="Bank Transfer">Bank Transfer</option>
                                                            </Input>
                                                            {formik.errors.payment_method && formik.touched.payment_method ? (
                                                                <FormFeedback>{formik.errors.payment_method}</FormFeedback>
                                                            ) : null}
                                                        </CardBody>
                                                    </Card>
                                                </Col>


                                                <Col md={6}>
                                                    <Card>
                                                        <CardBody>
                                                            <h6 className="border-bottom pb-2">Total: <span className="float-end">₹&nbsp;{cartTotalAmount.toFixed(2)}</span></h6>
                                                            <h6 className="border-bottom pb-2">Advance Paid: <span className="float-end">₹0.00</span></h6>
                                                            <h6 className="border-bottom pb-2">Total Discount: <span className="float-end">₹&nbsp;{cartTotalDiscount.toFixed(2)}</span></h6>
                                                            <h6 className="border-bottom pb-2">Shipping Charge: <span className="float-end">₹0.00</span></h6>
                                                            <h6 className="border-bottom pb-2">Total Cart Discount: <span className="float-end">₹0.00</span></h6>
                                                            <h6 className="font-weight-bold">Net Amount: <span className="float-end">₹&nbsp;{finalAmount.toFixed(2)}</span></h6>

                                                        </CardBody>
                                                    </Card>
                                                </Col>
                                            </Row>
                                        </div>



                                        <div className="w-5">
                                            <Button color="primary" type="submit" className="mt-4 w-100">
                                                create ordre
                                            </Button>
                                        </div>


                                    </Form>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                    <ToastContainer />
                </Container>
            </div>
        </React.Fragment>
    );
};

export default FormLayouts;
