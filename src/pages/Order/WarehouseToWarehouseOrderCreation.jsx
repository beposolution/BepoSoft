import React, { useState, useEffect } from "react";
import {
  Card, CardBody, Col, Row, CardTitle, Form, Label, Input, Button,
  Table, FormFeedback
} from "reactstrap";
import axios from "axios";
import { useFormik } from "formik";
import * as Yup from "yup";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import AddProduct from "./Add-product";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const WarehouseToWarehouseOrderCreation = () => {
  document.title = "Order: Warehouse to Warehouse | Beposoft";

  const token = localStorage.getItem("token");

  // ---- State ----
  const [companies, setCompanies] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [staffs, setStaffs] = useState([]);
  const [cartProducts, setCartProducts] = useState([]);
  const [cartTotalAmount, setCartTotalAmount] = useState(0);
  const [cartTotalDiscount, setCartTotalDiscount] = useState(0);
  const [finalAmount, setFinalAmount] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const toggleModal = () => setModalOpen(!modalOpen);

  // ==================== Dropdown Data ====================
  useEffect(() => {
    if (!token) return;
    const fetchData = async () => {
      try {
        const [cRes, wRes, sRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_APP_KEY}company/data/`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${import.meta.env.VITE_APP_KEY}warehouse/add/`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${import.meta.env.VITE_APP_KEY}staffs/`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setCompanies(cRes.data.data || []);
        setWarehouses(wRes.data || []);
        setStaffs(sRes.data.data || []);
      } catch {
        toast.error("Failed to load dropdown data");
      }
    };
    fetchData();
  }, [token]);

  // ==================== Formik ====================
  const formik = useFormik({
    initialValues: {
      company: "",
      from_warehouse: "",
      to_warehouse: "",
      status: "",
      manage_staff: "",
      order_date: new Date().toISOString().slice(0, 10),
    },
    validationSchema: Yup.object({
      company: Yup.string().required("Required"),
      from_warehouse: Yup.string().required("Required"),
      to_warehouse: Yup.string().required("Required"),
      status: Yup.string().required("Required"),
      manage_staff: Yup.string().required("Required"),
    }),
    onSubmit: async (values, { resetForm }) => {
      if (cartProducts.length === 0) {
        toast.error("Please add at least one product");
        return;
      }
      setIsLoading(true);
      try {
        // --- IMPORTANT: match Django model field names ---
        const payload = {
          company: values.company,
          warehouses: values.from_warehouse,          // ✅ from_warehouse -> warehouses
          receiiver_warehouse: values.to_warehouse,  // ✅ to_warehouse -> receiiver_warehouse (model typo)
          status: values.status,
          manage_staff: values.manage_staff,
          order_date: values.order_date,
        };

        await axios.post(
          `${import.meta.env.VITE_APP_KEY}warehouse/order/create/`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        toast.success("Purchase request created!");
        setCartProducts([]);
        setCartTotalAmount(0);
        setCartTotalDiscount(0);
        setFinalAmount(0);
        resetForm();
      } catch (err) {
        console.error("Create request error:", err?.response?.data);
        toast.error(
          err?.response?.data?.message ||
          "Failed to create request"
        );
      } finally {
        setIsLoading(false);
      }
    },
  });

  // ==================== Cart Logic ====================
  const fetchCartProducts = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_APP_KEY}cart/products/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCartProducts(res.data.data || []);
    } catch {
      toast.error("Failed to fetch cart products");
    }
  };

  useEffect(() => {
    if (token) fetchCartProducts();
  }, [token]);

  const updateCartProduct = async (id, fields) => {
    try {
      await axios.put(
        `${import.meta.env.VITE_APP_KEY}cart/update/${id}/`,
        fields,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch {
      toast.error("Failed to update cart item");
    }
  };

  const handleProductSelect = (product) => {
    setCartProducts((prev) => {
      const idx = prev.findIndex((p) => p.id === product.id);
      if (idx > -1) {
        const copy = [...prev];
        copy[idx].quantity += 1;
        updateCartProduct(copy[idx].id, { quantity: copy[idx].quantity });
        return copy;
      }
      return [
        ...prev,
        {
          ...product,
          quantity: 1,
          price: product.selling_price || 0,
          discount: 0,
          note: "",
        },
      ];
    });
  };

  const handleQuantityChange = (i, val) => {
    const qty = Math.max(1, parseInt(val) || 1);
    const copy = [...cartProducts];
    copy[i].quantity = qty;
    setCartProducts(copy);
    updateCartProduct(copy[i].id, { quantity: qty });
  };

  const removeProduct = async (id) => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_APP_KEY}cart/update/${id}/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCartProducts((prev) => prev.filter((p) => p.id !== id));
    } catch {
      toast.error("Failed to remove product");
    }
  };

  // totals
  useEffect(() => {
    if (!cartProducts.length) {
      setCartTotalAmount(0);
      setCartTotalDiscount(0);
      setFinalAmount(0);
      return;
    }
    const total = cartProducts.reduce((a, p) => a + p.price * p.quantity, 0);
    const disc = cartProducts.reduce(
      (a, p) => a + (p.discount || 0) * p.quantity,
      0
    );
    setCartTotalAmount(total);
    setCartTotalDiscount(disc);
    setFinalAmount(total - disc);
  }, [cartProducts]);

  // ==================== UI ====================
  return (
    <React.Fragment>
      <div className="page-content">
        <div className="container-fluid">
          <Breadcrumbs title="Form" breadcrumbItem="PURCHASE REQUEST" />
          <Row>
            <Col xl={12}>
              <Card>
                <CardBody>
                  <CardTitle className="mb-4">
                    CREATE NEW PURCHASE REQUEST
                  </CardTitle>

                  <Form onSubmit={formik.handleSubmit}>
                    <Row>
                      <Col md={4}>
                        <Label>Company</Label>
                        <Input
                          type="select"
                          {...formik.getFieldProps("company")}
                          invalid={
                            formik.touched.company && !!formik.errors.company
                          }
                        >
                          <option value="">Select</option>
                          {companies.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </Input>
                        <FormFeedback>{formik.errors.company}</FormFeedback>
                      </Col>
                      <Col md={4}>
                        <Label>From Warehouse</Label>
                        <Input
                          type="select"
                          {...formik.getFieldProps("to_warehouse")}
                          invalid={
                            formik.touched.to_warehouse &&
                            !!formik.errors.to_warehouse
                          }
                        >
                          <option value="">Select</option>
                          {warehouses.map((w) => (
                            <option key={w.id} value={w.id}>
                              {w.name}
                            </option>
                          ))}
                        </Input>
                        <FormFeedback>
                          {formik.errors.from_warehouse}
                        </FormFeedback>
                      </Col>
                      <Col md={4}>
                        <Label>Request To</Label>
                        <Input
                          type="select"
                          {...formik.getFieldProps("from_warehouse")}
                          invalid={
                            formik.touched.from_warehouse &&
                            !!formik.errors.from_warehouse
                          }
                        >
                          <option value="">Select</option>
                          {warehouses.map((w) => (
                            <option key={w.id} value={w.id}>
                              {w.name}
                            </option>
                          ))}
                        </Input>
                        <FormFeedback>{formik.errors.to_warehouse}</FormFeedback>
                      </Col>
                    </Row>

                    <Row className="mt-3">
                      <Col md={4}>
                        <Label>Order Mode</Label>
                        <Input
                          type="select"
                          {...formik.getFieldProps("status")}
                          invalid={
                            formik.touched.status && !!formik.errors.status
                          }
                        >
                          <option value="">Select</option>
                          <option value="Created">Created</option>
                        </Input>
                        <FormFeedback>{formik.errors.status}</FormFeedback>
                      </Col>
                      <Col md={4}>
                        <Label>Staff</Label>
                        <Input
                          type="select"
                          {...formik.getFieldProps("manage_staff")}
                          invalid={
                            formik.touched.manage_staff &&
                            !!formik.errors.manage_staff
                          }
                        >
                          <option value="">Select</option>
                          {staffs.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </Input>
                        <FormFeedback>{formik.errors.manage_staff}</FormFeedback>
                      </Col>
                      <Col md={4}>
                        <Label>Date</Label>
                        <Input
                          type="date"
                          {...formik.getFieldProps("order_date")}
                        />
                      </Col>
                    </Row>

                    <div className="my-4">
                      <Button color="primary" onClick={toggleModal}>
                        ADD PRODUCTS
                      </Button>
                    </div>

                    {/* Cart Table */}
                    <div className="table-responsive">
                      <Table bordered hover className="table-custom mb-0">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Image</th>
                            <th>Name</th>
                            <th>Quantity</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cartProducts.length ? (
                            cartProducts.map((p, i) => (
                              <tr key={p.id}>
                                <td>{i + 1}</td>
                                <td>
                                  <img
                                    src={`${import.meta.env.VITE_APP_IMAGE}${p.image}`}
                                    alt=""
                                    style={{ width: 50, height: 50 }}
                                  />
                                </td>
                                <td>{p.name}</td>
                                <td>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={p.quantity}
                                    onChange={(e) =>
                                      handleQuantityChange(i, e.target.value)
                                    }
                                  />
                                </td>
                                <td>
                                  <Button
                                    color="danger"
                                    size="sm"
                                    onClick={() => removeProduct(p.id)}
                                  >
                                    Remove
                                  </Button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="5" className="text-center">
                                No products added
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </Table>
                    </div>

                    <Button
                      color="primary"
                      type="submit"
                      className="mt-4"
                      disabled={isLoading}
                    >
                      {isLoading ? "Submitting..." : "Create Request"}
                    </Button>
                  </Form>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </div>
      </div>

      {/* Product modal */}
      <AddProduct
        isOpen={modalOpen}
        toggle={toggleModal}
        ProductsFetch={fetchCartProducts}
        onSelectProduct={handleProductSelect}
        warehouseId={formik.values.from_warehouse}
      />
      <ToastContainer />
    </React.Fragment>
  );
};

export default WarehouseToWarehouseOrderCreation;
