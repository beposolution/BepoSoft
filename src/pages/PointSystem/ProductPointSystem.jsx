import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
    Table,
    Row,
    Col,
    Card,
    CardBody,
    CardTitle,
    Button,
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Form,
    FormGroup,
    Label,
    Input,
    Spinner
} from "reactstrap";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Paginations from "../../components/Common/Pagination";

const ProductPointSystem = () => {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [pointSystems, setPointSystems] = useState([]);

    const [modalOpen, setModalOpen] = useState(false);
    const [editLoading, setEditLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [editData, setEditData] = useState({
        id: null,
        point_type: "",
        point_type_name: "",
        product: "",
        product_name: "",
        quantity: "",
        point: ""
    });

    const [searchTerm, setSearchTerm] = useState("");
    const [pointTypeFilter, setPointTypeFilter] = useState("");

    const [currentPage, setCurrentPage] = useState(1);
    const [perPageData] = useState(10);

    const pointTypeOptions = [
        { value: "product", label: "Product" },
        { value: "md", label: "MD" },
        { value: "sd", label: "SD" },
        { value: "new_conversions", label: "New Conversions" },
        { value: "new_customers", label: "New Customers" },
        { value: "new_lead", label: "New Lead" }
    ];

    document.title = "beposoft | product point system";

    // =========================================================
    // COMMON UNAUTHORIZED HANDLER
    // =========================================================
    const handleUnauthorized = (err) => {
        if (err?.response?.status === 401) {
            localStorage.removeItem("token");
            alert("Your session has expired. Please log in again.");
            navigate("/login");
            return true;
        }

        return false;
    };

    // =========================================================
    // EXTRACT LIST FROM API RESPONSE
    //
    // Supports:
    // response.data.data
    // response.data.results.data
    // response.data.results
    // =========================================================
    const extractPointSystemList = (responseData) => {
        if (Array.isArray(responseData?.data)) {
            return responseData.data;
        }

        if (Array.isArray(responseData?.results?.data)) {
            return responseData.results.data;
        }

        if (Array.isArray(responseData?.results)) {
            return responseData.results;
        }

        return [];
    };

    // =========================================================
    // FETCH ALL PRODUCT POINT SYSTEM DATA
    // GET: api/product/point/system/
    // =========================================================
    const fetchPointSystems = async () => {
        try {
            setLoading(true);
            setError(null);

            const token = localStorage.getItem("token");

            const response = await axios.get(
                `${import.meta.env.VITE_APP_KEY}product/point/system/`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const list = extractPointSystemList(response.data);

            setPointSystems(list);
        } catch (err) {
            if (handleUnauthorized(err)) {
                return;
            }

            console.error("Failed to fetch product point systems:", err);

            setError(err);

            toast.error(
                err?.response?.data?.message ||
                "Failed to load product point systems"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPointSystems();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // =========================================================
    // OPEN EDIT MODAL
    //
    // First fetch the selected row from detail API.
    // GET: api/product/point/system/edit/<id>/
    // =========================================================
    const handleEdit = async (pointSystem) => {
        try {
            setEditLoading(true);
            setModalOpen(true);

            const token = localStorage.getItem("token");

            const response = await axios.get(
                `${import.meta.env.VITE_APP_KEY}product/point/system/edit/${pointSystem.id}/`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = response?.data?.data || {};

            setEditData({
                id: data.id ?? pointSystem.id,
                point_type: data.point_type || "",
                point_type_name: data.point_type_name || "",
                product: data.product ?? "",
                product_name: data.product_name || "",
                quantity: data.quantity ?? "",
                point: data.point ?? ""
            });
        } catch (err) {
            if (handleUnauthorized(err)) {
                return;
            }

            console.error("Failed to fetch point system details:", err);

            toast.error(
                err?.response?.data?.message ||
                "Failed to load point system details"
            );

            setModalOpen(false);
        } finally {
            setEditLoading(false);
        }
    };

    // =========================================================
    // SAVE / UPDATE
    // PUT: api/product/point/system/edit/<id>/
    // =========================================================
    const handleSave = async () => {
        if (!editData.id) {
            toast.error("Point system ID is missing");
            return;
        }

        if (!editData.point_type) {
            toast.error("Please select point type");
            return;
        }

        if (
            editData.point === "" ||
            editData.point === null ||
            editData.point === undefined
        ) {
            toast.error("Please enter point");
            return;
        }

        const numericPoint = Number(editData.point);

        if (Number.isNaN(numericPoint) || numericPoint < 0) {
            toast.error("Point cannot be negative");
            return;
        }

        if (editData.point_type === "product") {
            if (
                editData.product === "" ||
                editData.product === null ||
                editData.product === undefined
            ) {
                toast.error("Product ID is required for Product point type");
                return;
            }

            if (
                editData.quantity === "" ||
                editData.quantity === null ||
                editData.quantity === undefined ||
                Number(editData.quantity) <= 0
            ) {
                toast.error("Quantity must be greater than 0");
                return;
            }
        }

        try {
            setSaving(true);

            const token = localStorage.getItem("token");

            const payload = {
                point_type: editData.point_type,
                point: editData.point
            };

            if (editData.point_type === "product") {
                payload.product = editData.product;
                payload.quantity = editData.quantity;
            } else {
                payload.product = null;
                payload.quantity = null;
            }

            const response = await axios.put(
                `${import.meta.env.VITE_APP_KEY}product/point/system/edit/${editData.id}/`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                }
            );

            const updatedData = response?.data?.data;

            toast.success(
                response?.data?.message ||
                "Point system updated successfully!"
            );

            if (updatedData) {
                setPointSystems((prev) =>
                    prev.map((item) =>
                        item.id === updatedData.id ? updatedData : item
                    )
                );
            } else {
                await fetchPointSystems();
            }

            setModalOpen(false);
        } catch (err) {
            if (handleUnauthorized(err)) {
                return;
            }

            console.error("Failed to update point system:", err);

            const responseErrors = err?.response?.data?.errors;

            if (responseErrors && typeof responseErrors === "object") {
                const firstErrorKey = Object.keys(responseErrors)[0];

                const firstError = responseErrors[firstErrorKey];

                if (Array.isArray(firstError)) {
                    toast.error(firstError[0]);
                } else {
                    toast.error(String(firstError));
                }
            } else {
                toast.error(
                    err?.response?.data?.message ||
                    "Failed to update point system"
                );
            }
        } finally {
            setSaving(false);
        }
    };

    // =========================================================
    // RESET TO PAGE 1 WHEN SEARCH / FILTER CHANGES
    // =========================================================
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, pointTypeFilter]);

    // =========================================================
    // FRONTEND SEARCH + POINT TYPE FILTER
    //
    // Backend API also supports:
    // ?search=
    // ?point_type=
    //
    // This keeps pagination behavior similar to your old page.
    // =========================================================
    const filteredPointSystems = pointSystems.filter((item) => {
        const search = searchTerm.toLowerCase().trim();

        const matchesSearch =
            !search ||
            String(item.point_type_name || "")
                .toLowerCase()
                .includes(search) ||
            String(item.point_type || "")
                .toLowerCase()
                .includes(search) ||
            String(item.product_name || "")
                .toLowerCase()
                .includes(search) ||
            String(item.quantity ?? "")
                .toLowerCase()
                .includes(search) ||
            String(item.point ?? "")
                .toLowerCase()
                .includes(search);

        const matchesPointType =
            !pointTypeFilter ||
            item.point_type === pointTypeFilter;

        return matchesSearch && matchesPointType;
    });

    const indexOfLastItem = currentPage * perPageData;
    const indexOfFirstItem = indexOfLastItem - perPageData;

    const currentPageData = filteredPointSystems.slice(
        indexOfFirstItem,
        indexOfLastItem
    );

    // =========================================================
    // DATE FORMAT
    // =========================================================
    const formatDateTime = (value) => {
        if (!value) {
            return "-";
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return value;
        }

        return date.toLocaleString();
    };

    // =========================================================
    // LOADING / ERROR
    // =========================================================
    if (loading) {
        return (
            <div
                className="page-content d-flex justify-content-center align-items-center"
                style={{ minHeight: "60vh" }}
            >
                <div className="text-center">
                    <Spinner color="primary" />
                    <div className="mt-2">Loading...</div>
                </div>
            </div>
        );
    }

    if (error && pointSystems.length === 0) {
        return (
            <div className="page-content">
                <div className="container-fluid">
                    <div className="text-center mt-5">
                        <h5>Unable to load Product Point System</h5>

                        <p className="text-muted">
                            {error?.response?.data?.message ||
                                error?.message ||
                                "Something went wrong"}
                        </p>

                        <Button
                            color="primary"
                            onClick={fetchPointSystems}
                        >
                            Retry
                        </Button>
                    </div>
                </div>

                <ToastContainer
                    position="top-right"
                    autoClose={3000}
                />
            </div>
        );
    }

    return (
        <React.Fragment>
            {/* =================================================
                EDIT MODAL
            ================================================= */}
            <Modal
                isOpen={modalOpen}
                toggle={() => {
                    if (!saving) {
                        setModalOpen(!modalOpen);
                    }
                }}
            >
                <ModalHeader
                    toggle={() => {
                        if (!saving) {
                            setModalOpen(false);
                        }
                    }}
                >
                    Edit Product Point System
                </ModalHeader>

                <ModalBody>
                    {editLoading ? (
                        <div className="text-center py-4">
                            <Spinner color="primary" />
                            <div className="mt-2">
                                Loading point system...
                            </div>
                        </div>
                    ) : (
                        <Form>
                            {/* POINT TYPE */}
                            <FormGroup>
                                <Label>Point Type</Label>

                                <Input
                                    type="select"
                                    value={editData.point_type || ""}
                                    onChange={(e) => {
                                        const value = e.target.value;

                                        setEditData((prev) => ({
                                            ...prev,
                                            point_type: value,

                                            // Clear product fields when type
                                            // is changed away from product.
                                            product:
                                                value === "product"
                                                    ? prev.product
                                                    : "",

                                            product_name:
                                                value === "product"
                                                    ? prev.product_name
                                                    : "",

                                            quantity:
                                                value === "product"
                                                    ? prev.quantity
                                                    : ""
                                        }));
                                    }}
                                >
                                    <option value="">
                                        Select Point Type
                                    </option>

                                    {pointTypeOptions.map((type) => (
                                        <option
                                            key={type.value}
                                            value={type.value}
                                        >
                                            {type.label}
                                        </option>
                                    ))}
                                </Input>
                            </FormGroup>

                            {/* PRODUCT FIELDS - ONLY FOR PRODUCT TYPE */}
                            {editData.point_type === "product" && (
                                <>
                                    <FormGroup>
                                        <Label>Current Product</Label>

                                        <Input
                                            type="text"
                                            value={
                                                editData.product_name ||
                                                "-"
                                            }
                                            disabled
                                        />
                                    </FormGroup>

                                    <FormGroup>
                                        <Label>Product ID</Label>

                                        <Input
                                            type="number"
                                            min="1"
                                            value={editData.product ?? ""}
                                            onChange={(e) =>
                                                setEditData({
                                                    ...editData,
                                                    product: e.target.value
                                                })
                                            }
                                            placeholder="Enter Product ID"
                                        />

                                        <small className="text-muted">
                                            The API serializer expects the
                                            product primary key here.
                                        </small>
                                    </FormGroup>

                                    <FormGroup>
                                        <Label>Quantity</Label>

                                        <Input
                                            type="number"
                                            min="1"
                                            value={editData.quantity ?? ""}
                                            onChange={(e) =>
                                                setEditData({
                                                    ...editData,
                                                    quantity: e.target.value
                                                })
                                            }
                                            placeholder="Enter Quantity"
                                        />
                                    </FormGroup>
                                </>
                            )}

                            {/* POINT */}
                            <FormGroup>
                                <Label>Point</Label>

                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={editData.point ?? ""}
                                    onChange={(e) =>
                                        setEditData({
                                            ...editData,
                                            point: e.target.value
                                        })
                                    }
                                    placeholder="Enter Point"
                                />
                            </FormGroup>
                        </Form>
                    )}
                </ModalBody>

                <ModalFooter>
                    <Button
                        color="primary"
                        onClick={handleSave}
                        disabled={editLoading || saving}
                    >
                        {saving ? (
                            <>
                                <Spinner
                                    size="sm"
                                    className="me-2"
                                />
                                Saving...
                            </>
                        ) : (
                            "Save"
                        )}
                    </Button>

                    <Button
                        color="secondary"
                        onClick={() => setModalOpen(false)}
                        disabled={saving}
                    >
                        Cancel
                    </Button>
                </ModalFooter>
            </Modal>

            {/* =================================================
                PAGE CONTENT
            ================================================= */}
            <div className="page-content">
                <div className="container-fluid d-flex justify-content-center">
                    <Row className="w-100">
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <CardTitle className="h4 text-center font-weight-bold text-decoration-underline">
                                        PRODUCT POINT SYSTEM
                                    </CardTitle>

                                    {/* SEARCH + FILTER */}
                                    <Row className="mb-3">
                                        <Col
                                            lg={8}
                                            md={7}
                                            sm={12}
                                            className="mb-2 mb-md-0"
                                        >
                                            <Input
                                                type="text"
                                                placeholder="Search by point type, product, quantity or point"
                                                value={searchTerm}
                                                onChange={(e) =>
                                                    setSearchTerm(
                                                        e.target.value
                                                    )
                                                }
                                            />
                                        </Col>

                                        <Col
                                            lg={4}
                                            md={5}
                                            sm={12}
                                        >
                                            <Input
                                                type="select"
                                                value={pointTypeFilter}
                                                onChange={(e) =>
                                                    setPointTypeFilter(
                                                        e.target.value
                                                    )
                                                }
                                            >
                                                <option value="">
                                                    All Point Types
                                                </option>

                                                {pointTypeOptions.map(
                                                    (type) => (
                                                        <option
                                                            key={type.value}
                                                            value={type.value}
                                                        >
                                                            {type.label}
                                                        </option>
                                                    )
                                                )}
                                            </Input>
                                        </Col>
                                    </Row>

                                    <div className="table-responsive">
                                        <Table className="table table-hover mb-0 text-center align-middle">
                                            <thead>
                                                <tr>
                                                    <th>#</th>
                                                    <th>Point Type</th>
                                                    <th>Product</th>
                                                    <th>Quantity</th>
                                                    <th>Point</th>
                                                    <th>Created By</th>
                                                    <th>Created At</th>
                                                    <th>Updated At</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {currentPageData.length > 0 ? (
                                                    currentPageData.map(
                                                        (item, index) => (
                                                            <tr key={item.id}>
                                                                <th scope="row">
                                                                    {indexOfFirstItem +
                                                                        index +
                                                                        1}
                                                                </th>

                                                                <td>
                                                                    {item.point_type_name ||
                                                                        item.point_type ||
                                                                        "-"}
                                                                </td>

                                                                <td>
                                                                    {item.product_name ||
                                                                        "-"}
                                                                </td>

                                                                <td>
                                                                    {item.quantity ??
                                                                        "-"}
                                                                </td>

                                                                <td
                                                                    style={{
                                                                        fontWeight:
                                                                            "bold"
                                                                    }}
                                                                >
                                                                    {item.point ??
                                                                        "0"}
                                                                </td>

                                                                <td>
                                                                    {item.created_by_name ||
                                                                        "-"}
                                                                </td>

                                                                <td>
                                                                    {formatDateTime(
                                                                        item.created_at
                                                                    )}
                                                                </td>

                                                                <td>
                                                                    {formatDateTime(
                                                                        item.updated_at
                                                                    )}
                                                                </td>

                                                                <td>
                                                                    <Button
                                                                        color="primary"
                                                                        size="sm"
                                                                        onClick={() =>
                                                                            handleEdit(
                                                                                item
                                                                            )
                                                                        }
                                                                    >
                                                                        Edit
                                                                    </Button>
                                                                </td>
                                                            </tr>
                                                        )
                                                    )
                                                ) : (
                                                    <tr>
                                                        <td
                                                            colSpan="9"
                                                            className="py-4 text-muted"
                                                        >
                                                            No Product Point
                                                            System data found.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </Table>

                                        {filteredPointSystems.length >
                                            perPageData && (
                                                <Paginations
                                                    perPageData={perPageData}
                                                    data={filteredPointSystems}
                                                    currentPage={currentPage}
                                                    setCurrentPage={
                                                        setCurrentPage
                                                    }
                                                    isShowingPageLength={true}
                                                    paginationDiv="mt-3 d-flex justify-content-center"
                                                    paginationClass="pagination pagination-rounded"
                                                    indexOfFirstItem={
                                                        indexOfFirstItem
                                                    }
                                                    indexOfLastItem={
                                                        indexOfLastItem
                                                    }
                                                />
                                            )}
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </div>

                <ToastContainer
                    position="top-right"
                    autoClose={3000}
                />
            </div>
        </React.Fragment>
    );
};

export default ProductPointSystem;
