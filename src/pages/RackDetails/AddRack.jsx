import React, { useState, useEffect } from "react";
import {
    Card,
    CardBody,
    Col,
    Row,
    Label,
    Input,
    Button,
    Form,
    FormGroup,
    Table,
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Badge,
} from "reactstrap";
import axios from "axios";
import Select from "react-select";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Paginations from "../../components/Common/Pagination";

const AddRack = () => {
    const [warehouseDetails, setWarehouseDetails] = useState([]);
    const [rackList, setRackList] = useState([]);
    const [selectedWarehouse, setSelectedWarehouse] = useState("");
    const [rackName, setRackName] = useState("");
    const [numberOfColumns, setNumberOfColumns] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    const token = localStorage.getItem("token");

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRack, setEditingRack] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const perPageData = 25;

    document.title = "Rack Details | Beposoft";

    const axiosCfg = {
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    };

    const selectStyles = {
        control: (provided, state) => ({
            ...provided,
            minHeight: "48px",
            borderRadius: "10px",
            borderColor: state.isFocused ? "#1d4ed8" : "#b8c2d6",
            boxShadow: state.isFocused ? "0 0 0 1px #1d4ed8" : "none",
            fontSize: "14px",
            fontWeight: "600",
            backgroundColor: "#ffffff",
            color: "#111827",
            "&:hover": {
                borderColor: "#1d4ed8",
            },
        }),
        menu: (provided) => ({
            ...provided,
            backgroundColor: "#ffffff",
            zIndex: 9999,
            borderRadius: "10px",
            overflow: "hidden",
        }),
        menuPortal: (provided) => ({
            ...provided,
            zIndex: 99999,
        }),
        option: (provided, state) => ({
            ...provided,
            fontSize: "14px",
            fontWeight: "600",
            backgroundColor: state.isSelected
                ? "#1d4ed8"
                : state.isFocused
                    ? "#eaf0fb"
                    : "#ffffff",
            color: state.isSelected ? "#ffffff" : "#111827",
            cursor: "pointer",
        }),
        singleValue: (provided) => ({
            ...provided,
            color: "#111827",
            fontWeight: "700",
        }),
        placeholder: (provided) => ({
            ...provided,
            color: "#64748b",
            fontWeight: "600",
        }),
        input: (provided) => ({
            ...provided,
            color: "#111827",
            fontWeight: "600",
        }),
    };

    const warehouseOptions = warehouseDetails.map((warehouse) => ({
        value: warehouse.id,
        label: `${warehouse.name || "-"}${warehouse.unique_id ? ` (${warehouse.unique_id})` : ""
            }`,
    }));

    const selectedWarehouseOption =
        warehouseOptions.find(
            (option) => String(option.value) === String(selectedWarehouse)
        ) || null;

    const viewWarehouse = async () => {
        try {
            const res = await axios.get(
                `${import.meta.env.VITE_APP_KEY}warehouse/add/`,
                axiosCfg
            );
            setWarehouseDetails(Array.isArray(res?.data) ? res.data : []);
        } catch (error) {
            toast.error("Failed to load warehouses.");
        }
    };

    const viewRacks = async () => {
        try {
            const res = await axios.get(
                `${import.meta.env.VITE_APP_KEY}rack/add/`,
                axiosCfg
            );
            setRackList(Array.isArray(res?.data) ? res.data : []);
        } catch (error) {
            toast.error("Failed to load rack data.");
        }
    };

    const postDataLog = async (payload) => {
        try {
            await axios.post(
                `${import.meta.env.VITE_APP_KEY}datalog/create/`,
                payload,
                axiosCfg
            );
        } catch (err) {
            console.warn("DataLog create failed:", err?.response?.data || err?.message);
            toast.warn("Rack created, but logging failed.");
        }
    };

    const resetForm = () => {
        setRackName("");
        setNumberOfColumns("");
        setSelectedWarehouse("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedWarehouse) {
            toast.warning("Please select warehouse");
            return;
        }

        if (!rackName.trim()) {
            toast.warning("Please enter rack name");
            return;
        }

        if (!numberOfColumns || Number(numberOfColumns) <= 0) {
            toast.warning("Please enter valid number of columns");
            return;
        }

        try {
            const payload = {
                warehouse: Number(selectedWarehouse),
                rack_name: rackName.trim(),
                number_of_columns: Number(numberOfColumns),
            };

            const createRes = await axios.post(
                `${import.meta.env.VITE_APP_KEY}rack/add/`,
                payload,
                axiosCfg
            );

            const created = createRes?.data;

            const ORDER_ID_FOR_LOG = null;

            const afterSnapshot = {
                id: created?.id,
                warehouse: created?.warehouse ?? payload.warehouse,
                warehouse_name: created?.warehouse_name,
                rack_name: created?.rack_name ?? payload.rack_name,
                number_of_columns:
                    created?.number_of_columns ?? payload.number_of_columns,
                column_names: created?.column_names ?? [],
            };

            const datalogPayload = {
                ...(ORDER_ID_FOR_LOG ? { order: ORDER_ID_FOR_LOG } : {}),
                before_data: { Action: "New rack Adding" },
                after_data: { Data: afterSnapshot },
            };

            postDataLog(datalogPayload);

            toast.success("Rack added successfully");
            resetForm();
            viewRacks();
        } catch (error) {
            const msg =
                error?.response?.data?.detail ||
                error?.response?.data?.error ||
                error?.message ||
                "Failed to add rack";

            console.error("Rack create failed:", error?.response || error);
            toast.error(msg);
        }
    };

    useEffect(() => {
        viewWarehouse();
        viewRacks();
    }, []);

    const openModal = async (id) => {
        try {
            const res = await axios.get(
                `${import.meta.env.VITE_APP_KEY}rack/add/${id}/`,
                axiosCfg
            );
            setEditingRack(res.data);
            setIsModalOpen(true);
        } catch (error) {
            toast.error("Failed to fetch rack details");
        }
    };

    const handleEditChange = (field, value) => {
        setEditingRack((prev) => ({ ...prev, [field]: value }));
    };

    const handleUpdate = async () => {
        if (!editingRack) return;

        try {
            await axios.put(
                `${import.meta.env.VITE_APP_KEY}rack/add/${editingRack.id}/`,
                {
                    number_of_columns: editingRack.number_of_columns,
                },
                axiosCfg
            );

            toast.success("Rack updated successfully");
            setIsModalOpen(false);
            setEditingRack(null);
            viewRacks();
        } catch (error) {
            toast.error(error?.response?.data?.error || "Update failed");
        }
    };

    const filteredRackList = rackList.filter((rack) => {
        const search = searchTerm.toLowerCase();

        const warehouseName = rack?.warehouse_name?.toLowerCase() || "";
        const rackNameValue = rack?.rack_name?.toLowerCase() || "";
        const columnNames = rack?.column_names?.join(", ")?.toLowerCase() || "";
        const numberColumns = String(rack?.number_of_columns || "");

        return (
            warehouseName.includes(search) ||
            rackNameValue.includes(search) ||
            columnNames.includes(search) ||
            numberColumns.includes(search)
        );
    });

    const indexOfLastItem = currentPage * perPageData;
    const indexOfFirstItem = indexOfLastItem - perPageData;

    const currentRackList = filteredRackList.slice(
        indexOfFirstItem,
        indexOfLastItem
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    return (
        <React.Fragment>
            <ToastContainer />

            <div className="page-content" style={{ backgroundColor: "#f3f6fb" }}>
                <div className="container-fluid">
                    <Row>
                        <Col xl={12}>
                            <Card
                                className="border-0"
                                style={{
                                    borderRadius: "18px",
                                    boxShadow: "0 8px 25px rgba(15, 23, 42, 0.10)",
                                }}
                            >
                                <CardBody className="p-4">
                                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
                                        <div>
                                            <h4
                                                className="mb-1"
                                                style={{
                                                    fontWeight: "800",
                                                    color: "#111827",
                                                    fontSize: "22px",
                                                }}
                                            >
                                                Add New Rack
                                            </h4>

                                            <p
                                                className="mb-0"
                                                style={{
                                                    color: "#475569",
                                                    fontSize: "14px",
                                                    fontWeight: "500",
                                                }}
                                            >
                                                Create rack details for warehouse stock arrangement and
                                                column tracking.
                                            </p>
                                        </div>

                                        <div className="d-flex gap-2 flex-wrap">
                                            <Badge
                                                color="primary"
                                                pill
                                                className="px-3 py-2"
                                                style={{
                                                    fontSize: "13px",
                                                    fontWeight: "700",
                                                }}
                                            >
                                                Total Racks: {rackList.length}
                                            </Badge>

                                            <Badge
                                                color="info"
                                                pill
                                                className="px-3 py-2"
                                                style={{
                                                    fontSize: "13px",
                                                    fontWeight: "700",
                                                }}
                                            >
                                                Warehouses: {warehouseDetails.length}
                                            </Badge>
                                        </div>
                                    </div>

                                    <Form onSubmit={handleSubmit}>
                                        <Row className="g-3 align-items-end">
                                            <Col xl={4} md={6}>
                                                <Label
                                                    htmlFor="warehouse"
                                                    style={{
                                                        fontSize: "14px",
                                                        fontWeight: "800",
                                                        color: "#111827",
                                                        marginBottom: "8px",
                                                    }}
                                                >
                                                    Select Warehouse
                                                </Label>

                                                <Select
                                                    inputId="warehouse"
                                                    name="warehouse"
                                                    options={warehouseOptions}
                                                    value={selectedWarehouseOption}
                                                    onChange={(selected) =>
                                                        setSelectedWarehouse(selected ? selected.value : "")
                                                    }
                                                    isClearable
                                                    isSearchable
                                                    placeholder="Select Warehouse"
                                                    styles={selectStyles}
                                                    menuPortalTarget={document.body}
                                                    menuPosition="fixed"
                                                />
                                            </Col>

                                            <Col xl={3} md={6}>
                                                <Label
                                                    htmlFor="rack-name"
                                                    style={{
                                                        fontSize: "14px",
                                                        fontWeight: "800",
                                                        color: "#111827",
                                                        marginBottom: "8px",
                                                    }}
                                                >
                                                    Rack Name
                                                </Label>

                                                <Input
                                                    id="rack-name"
                                                    type="text"
                                                    value={rackName}
                                                    onChange={(e) => setRackName(e.target.value)}
                                                    placeholder="Example: A"
                                                    style={{
                                                        height: "48px",
                                                        borderRadius: "10px",
                                                        border: "1.5px solid #b8c2d6",
                                                        color: "#111827",
                                                        fontSize: "14px",
                                                        fontWeight: "600",
                                                        backgroundColor: "#ffffff",
                                                    }}
                                                />
                                            </Col>

                                            <Col xl={3} md={6}>
                                                <Label
                                                    htmlFor="number-of-columns"
                                                    style={{
                                                        fontSize: "14px",
                                                        fontWeight: "800",
                                                        color: "#111827",
                                                        marginBottom: "8px",
                                                    }}
                                                >
                                                    Number of Columns
                                                </Label>

                                                <Input
                                                    id="number-of-columns"
                                                    type="number"
                                                    min={1}
                                                    value={numberOfColumns}
                                                    onChange={(e) => setNumberOfColumns(e.target.value)}
                                                    placeholder="Example: 6"
                                                    style={{
                                                        height: "48px",
                                                        borderRadius: "10px",
                                                        border: "1.5px solid #b8c2d6",
                                                        color: "#111827",
                                                        fontSize: "14px",
                                                        fontWeight: "600",
                                                        backgroundColor: "#ffffff",
                                                    }}
                                                />
                                            </Col>

                                            <Col xl={2} md={6}>
                                                <Button
                                                    color="primary"
                                                    type="submit"
                                                    className="w-100"
                                                    style={{
                                                        height: "48px",
                                                        borderRadius: "10px",
                                                        fontSize: "14px",
                                                        fontWeight: "800",
                                                        backgroundColor: "#1d4ed8",
                                                        borderColor: "#1d4ed8",
                                                        boxShadow: "0 8px 18px rgba(29, 78, 216, 0.30)",
                                                    }}
                                                >
                                                    Add Rack
                                                </Button>
                                            </Col>
                                        </Row>
                                    </Form>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>

                    <Row>
                        <Col xl={12}>
                            <Card
                                className="border-0 mt-0"
                                style={{
                                    borderRadius: "18px",
                                    boxShadow: "0 8px 25px rgba(15, 23, 42, 0.10)",
                                }}
                            >
                                <CardBody className="p-4">
                                    <Row className="mb-4 align-items-center g-3">
                                        <Col md={6}>
                                            <h4
                                                className="mb-1"
                                                style={{
                                                    fontWeight: "800",
                                                    color: "#111827",
                                                    fontSize: "22px",
                                                }}
                                            >
                                                Rack List
                                            </h4>

                                            <p
                                                className="mb-0"
                                                style={{
                                                    color: "#475569",
                                                    fontSize: "14px",
                                                    fontWeight: "500",
                                                }}
                                            >
                                                Manage all warehouse rack records from one place.
                                            </p>
                                        </Col>

                                        <Col md={6}>
                                            <Input
                                                type="text"
                                                placeholder="Search by warehouse, rack name, columns..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                style={{
                                                    height: "48px",
                                                    borderRadius: "10px",
                                                    border: "1.5px solid #b8c2d6",
                                                    color: "#111827",
                                                    fontSize: "14px",
                                                    fontWeight: "600",
                                                    backgroundColor: "#ffffff",
                                                }}
                                            />
                                        </Col>
                                    </Row>

                                    <div
                                        className="table-responsive"
                                        style={{
                                            border: "1.5px solid #d7deea",
                                            borderRadius: "14px",
                                            overflow: "hidden",
                                            backgroundColor: "#ffffff",
                                        }}
                                    >
                                        <Table className="table mb-0 align-middle">
                                            <thead>
                                                <tr style={{ backgroundColor: "#eaf0fb" }}>
                                                    <th
                                                        style={{
                                                            width: "80px",
                                                            padding: "16px 14px",
                                                            color: "#1e293b",
                                                            fontSize: "13px",
                                                            fontWeight: "800",
                                                            borderBottom: "1.5px solid #cbd5e1",
                                                        }}
                                                    >
                                                        #
                                                    </th>

                                                    <th
                                                        style={{
                                                            padding: "16px 14px",
                                                            color: "#1e293b",
                                                            fontSize: "13px",
                                                            fontWeight: "800",
                                                            borderBottom: "1.5px solid #cbd5e1",
                                                        }}
                                                    >
                                                        Warehouse
                                                    </th>

                                                    <th
                                                        style={{
                                                            padding: "16px 14px",
                                                            color: "#1e293b",
                                                            fontSize: "13px",
                                                            fontWeight: "800",
                                                            borderBottom: "1.5px solid #cbd5e1",
                                                        }}
                                                    >
                                                        Rack Name
                                                    </th>

                                                    <th
                                                        style={{
                                                            padding: "16px 14px",
                                                            color: "#1e293b",
                                                            fontSize: "13px",
                                                            fontWeight: "800",
                                                            borderBottom: "1.5px solid #cbd5e1",
                                                        }}
                                                    >
                                                        No. of Columns
                                                    </th>

                                                    <th
                                                        style={{
                                                            padding: "16px 14px",
                                                            color: "#1e293b",
                                                            fontSize: "13px",
                                                            fontWeight: "800",
                                                            borderBottom: "1.5px solid #cbd5e1",
                                                        }}
                                                    >
                                                        Column Names
                                                    </th>

                                                    <th
                                                        className="text-end"
                                                        style={{
                                                            width: "160px",
                                                            padding: "16px 14px",
                                                            color: "#1e293b",
                                                            fontSize: "13px",
                                                            fontWeight: "800",
                                                            borderBottom: "1.5px solid #cbd5e1",
                                                        }}
                                                    >
                                                        Action
                                                    </th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {currentRackList.length > 0 ? (
                                                    currentRackList.map((rack, index) => (
                                                        <tr
                                                            key={rack.id}
                                                            style={{
                                                                borderBottom: "1px solid #dfe6f1",
                                                            }}
                                                        >
                                                            <td
                                                                style={{
                                                                    padding: "16px 14px",
                                                                    color: "#334155",
                                                                    fontSize: "14px",
                                                                    fontWeight: "700",
                                                                }}
                                                            >
                                                                {indexOfFirstItem + index + 1}
                                                            </td>

                                                            <td style={{ padding: "16px 14px" }}>
                                                                <div className="d-flex align-items-center gap-3">
                                                                    <div
                                                                        className="rounded-circle d-flex align-items-center justify-content-center"
                                                                        style={{
                                                                            width: "42px",
                                                                            height: "42px",
                                                                            backgroundColor: "#dbeafe",
                                                                            color: "#1d4ed8",
                                                                            fontWeight: "900",
                                                                            fontSize: "14px",
                                                                            border: "1px solid #bfdbfe",
                                                                        }}
                                                                    >
                                                                        {rack?.warehouse_name
                                                                            ? rack.warehouse_name
                                                                                .substring(0, 2)
                                                                                .toUpperCase()
                                                                            : "WH"}
                                                                    </div>

                                                                    <div>
                                                                        <h6
                                                                            className="mb-1"
                                                                            style={{
                                                                                fontSize: "14px",
                                                                                fontWeight: "900",
                                                                                color: "#0f172a",
                                                                                letterSpacing: "0.2px",
                                                                            }}
                                                                        >
                                                                            {rack.warehouse_name || "N/A"}
                                                                        </h6>

                                                                        <small
                                                                            style={{
                                                                                color: "#64748b",
                                                                                fontSize: "12px",
                                                                                fontWeight: "600",
                                                                            }}
                                                                        >
                                                                            Warehouse
                                                                        </small>
                                                                    </div>
                                                                </div>
                                                            </td>

                                                            <td
                                                                style={{
                                                                    padding: "16px 14px",
                                                                    minWidth: "140px",
                                                                }}
                                                            >
                                                                <div
                                                                    style={{
                                                                        display: "inline-block",
                                                                        minWidth: "100px",
                                                                        padding: "9px 14px",
                                                                        backgroundColor: "#f1f5f9",
                                                                        color: "#0f172a",
                                                                        border: "1px solid #cbd5e1",
                                                                        borderRadius: "8px",
                                                                        fontSize: "14px",
                                                                        fontWeight: "800",
                                                                        textAlign: "center",
                                                                        textTransform: "uppercase",
                                                                    }}
                                                                >
                                                                    {rack.rack_name || "-"}
                                                                </div>
                                                            </td>

                                                            <td
                                                                style={{
                                                                    padding: "16px 14px",
                                                                    color: "#334155",
                                                                    fontSize: "14px",
                                                                    fontWeight: "800",
                                                                }}
                                                            >
                                                                {rack.number_of_columns || "-"}
                                                            </td>

                                                            <td
                                                                style={{
                                                                    padding: "16px 14px",
                                                                    maxWidth: "560px",
                                                                }}
                                                            >
                                                                {rack.column_names?.length > 0 ? (
                                                                    <div
                                                                        style={{
                                                                            display: "flex",
                                                                            flexWrap: "wrap",
                                                                            gap: "8px",
                                                                            maxHeight: "130px",
                                                                            overflowY: "auto",
                                                                            padding: "4px 4px 4px 0",
                                                                        }}
                                                                    >
                                                                        {rack.column_names.map(
                                                                            (columnName, columnIndex) => (
                                                                                <span
                                                                                    key={columnIndex}
                                                                                    style={{
                                                                                        display: "inline-flex",
                                                                                        alignItems: "center",
                                                                                        justifyContent: "center",
                                                                                        padding: "7px 11px",
                                                                                        backgroundColor: "#eff6ff",
                                                                                        color: "#1d4ed8",
                                                                                        border: "1px solid #bfdbfe",
                                                                                        borderRadius: "999px",
                                                                                        fontSize: "12px",
                                                                                        fontWeight: "800",
                                                                                        lineHeight: "1",
                                                                                        whiteSpace: "nowrap",
                                                                                    }}
                                                                                >
                                                                                    {columnName}
                                                                                </span>
                                                                            )
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <span
                                                                        style={{
                                                                            color: "#64748b",
                                                                            fontSize: "13px",
                                                                            fontWeight: "700",
                                                                        }}
                                                                    >
                                                                        -
                                                                    </span>
                                                                )}
                                                            </td>

                                                            <td
                                                                className="text-end"
                                                                style={{ padding: "16px 14px" }}
                                                            >
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() => openModal(rack.id)}
                                                                    style={{
                                                                        backgroundColor: "#f59e0b",
                                                                        borderColor: "#f59e0b",
                                                                        color: "#111827",
                                                                        borderRadius: "8px",
                                                                        fontSize: "12px",
                                                                        fontWeight: "900",
                                                                        padding: "8px 18px",
                                                                    }}
                                                                >
                                                                    View
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="6">
                                                            <div className="text-center py-5">
                                                                <h5
                                                                    style={{
                                                                        fontWeight: "800",
                                                                        color: "#111827",
                                                                    }}
                                                                >
                                                                    No rack data found
                                                                </h5>

                                                                <p
                                                                    className="mb-0"
                                                                    style={{
                                                                        color: "#475569",
                                                                        fontWeight: "500",
                                                                    }}
                                                                >
                                                                    Try another search keyword or add a new rack.
                                                                </p>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </Table>
                                    </div>

                                    <div className="mt-3">
                                        <Paginations
                                            perPageData={perPageData}
                                            data={filteredRackList}
                                            currentPage={currentPage}
                                            setCurrentPage={setCurrentPage}
                                            isShowingPageLength={true}
                                            paginationDiv="col-auto"
                                            paginationClass="pagination-rounded"
                                            indexOfFirstItem={indexOfFirstItem}
                                            indexOfLastItem={indexOfLastItem}
                                        />
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </div>
            </div>

            <Modal
                isOpen={isModalOpen}
                toggle={() => setIsModalOpen(false)}
                centered
                size="lg"
            >
                <ModalHeader
                    toggle={() => setIsModalOpen(false)}
                    style={{
                        backgroundColor: "#eaf0fb",
                        borderBottom: "1.5px solid #cbd5e1",
                        color: "#111827",
                        fontWeight: "900",
                    }}
                >
                    View / Edit Rack
                </ModalHeader>

                <ModalBody style={{ backgroundColor: "#f8fafc" }}>
                    {editingRack && (
                        <>
                            <Row className="g-3">
                                <Col md={6}>
                                    <FormGroup>
                                        <Label
                                            style={{
                                                fontSize: "14px",
                                                fontWeight: "800",
                                                color: "#111827",
                                            }}
                                        >
                                            Warehouse
                                        </Label>
                                        <Input
                                            type="text"
                                            value={editingRack.warehouse_name || ""}
                                            readOnly
                                            style={{
                                                height: "48px",
                                                borderRadius: "10px",
                                                border: "1.5px solid #b8c2d6",
                                                color: "#111827",
                                                fontSize: "14px",
                                                fontWeight: "700",
                                                backgroundColor: "#e5e7eb",
                                            }}
                                        />
                                    </FormGroup>
                                </Col>

                                <Col md={6}>
                                    <FormGroup>
                                        <Label
                                            style={{
                                                fontSize: "14px",
                                                fontWeight: "800",
                                                color: "#111827",
                                            }}
                                        >
                                            Rack Name
                                        </Label>
                                        <Input
                                            type="text"
                                            value={editingRack.rack_name || ""}
                                            readOnly
                                            style={{
                                                height: "48px",
                                                borderRadius: "10px",
                                                border: "1.5px solid #b8c2d6",
                                                color: "#111827",
                                                fontSize: "14px",
                                                fontWeight: "700",
                                                backgroundColor: "#e5e7eb",
                                            }}
                                        />
                                    </FormGroup>
                                </Col>

                                <Col md={12}>
                                    <FormGroup>
                                        <Label
                                            style={{
                                                fontSize: "14px",
                                                fontWeight: "800",
                                                color: "#111827",
                                            }}
                                        >
                                            Number of Columns
                                        </Label>

                                        <Input
                                            type="number"
                                            min={editingRack?.column_names?.length || 1}
                                            value={editingRack.number_of_columns || ""}
                                            onChange={(e) => {
                                                const value = parseInt(e.target.value, 10);

                                                if (value >= editingRack.column_names.length) {
                                                    handleEditChange("number_of_columns", value);
                                                } else {
                                                    toast.warn("You cannot reduce the column count");
                                                }
                                            }}
                                            style={{
                                                height: "48px",
                                                borderRadius: "10px",
                                                border: "1.5px solid #b8c2d6",
                                                color: "#111827",
                                                fontSize: "14px",
                                                fontWeight: "700",
                                                backgroundColor: "#ffffff",
                                            }}
                                        />
                                    </FormGroup>
                                </Col>

                                <Col md={12}>
                                    <FormGroup>
                                        <Label
                                            style={{
                                                fontSize: "14px",
                                                fontWeight: "800",
                                                color: "#111827",
                                            }}
                                        >
                                            Column Names
                                        </Label>

                                        {editingRack.column_names?.length > 0 ? (
                                            <div
                                                style={{
                                                    display: "flex",
                                                    flexWrap: "wrap",
                                                    gap: "8px",
                                                    padding: "12px",
                                                    minHeight: "90px",
                                                    maxHeight: "180px",
                                                    overflowY: "auto",
                                                    borderRadius: "10px",
                                                    border: "1.5px solid #b8c2d6",
                                                    backgroundColor: "#e5e7eb",
                                                }}
                                            >
                                                {editingRack.column_names.map(
                                                    (columnName, columnIndex) => (
                                                        <span
                                                            key={columnIndex}
                                                            style={{
                                                                display: "inline-flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                padding: "7px 11px",
                                                                backgroundColor: "#ffffff",
                                                                color: "#1d4ed8",
                                                                border: "1px solid #bfdbfe",
                                                                borderRadius: "999px",
                                                                fontSize: "12px",
                                                                fontWeight: "800",
                                                                lineHeight: "1",
                                                                whiteSpace: "nowrap",
                                                            }}
                                                        >
                                                            {columnName}
                                                        </span>
                                                    )
                                                )}
                                            </div>
                                        ) : (
                                            <Input
                                                type="text"
                                                value="-"
                                                readOnly
                                                style={{
                                                    height: "48px",
                                                    borderRadius: "10px",
                                                    border: "1.5px solid #b8c2d6",
                                                    color: "#111827",
                                                    fontSize: "14px",
                                                    fontWeight: "700",
                                                    backgroundColor: "#e5e7eb",
                                                }}
                                            />
                                        )}
                                    </FormGroup>
                                </Col>
                            </Row>
                        </>
                    )}
                </ModalBody>

                <ModalFooter
                    style={{
                        backgroundColor: "#f8fafc",
                        borderTop: "1.5px solid #cbd5e1",
                    }}
                >
                    <Button
                        color="primary"
                        onClick={handleUpdate}
                        style={{
                            borderRadius: "10px",
                            fontWeight: "800",
                            padding: "10px 24px",
                            backgroundColor: "#1d4ed8",
                            borderColor: "#1d4ed8",
                        }}
                    >
                        Update
                    </Button>

                    <Button
                        color="secondary"
                        onClick={() => setIsModalOpen(false)}
                        style={{
                            borderRadius: "10px",
                            fontWeight: "800",
                            padding: "10px 24px",
                        }}
                    >
                        Cancel
                    </Button>
                </ModalFooter>
            </Modal>
        </React.Fragment>
    );
};

export default AddRack;