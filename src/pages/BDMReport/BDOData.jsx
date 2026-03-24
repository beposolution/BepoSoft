import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import {
    Card,
    CardBody,
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Col,
    Row,
    CardTitle,
    Form,
    Label,
    Button,
} from "reactstrap";
import "react-toastify/dist/ReactToastify.css";
import Select from "react-select";
import { FaPlusCircle, FaTrash } from "react-icons/fa";

const BDOData = () => {
    const token = localStorage.getItem("token");
    const BASE_URL = import.meta.env.VITE_APP_KEY || "/api/";

    const [userFamily, setUserFamily] = useState("");
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);

    const [entry, setEntry] = useState({ staff: null, status: "" });
    const [attendanceDate, setAttendanceDate] = useState("");
    const [allData, setAllData] = useState([]);

    const [selectedId, setSelectedId] = useState(null);
    const [selectedData, setSelectedData] = useState(null);
    const [rowEditModal, setRowEditModal] = useState(false);

    const getFamilyValue = (obj) => {
        if (!obj) return "";
        return (
            obj?.family_name ||
            obj?.family?.name ||
            obj?.family?.family_name ||
            obj?.family ||
            obj?.family_id ||
            ""
        );
    };

    const familyMatches = (obj, family) => {
        if (!family) return true;
        const objFamily = getFamilyValue(obj);
        return (
            String(objFamily).trim().toLowerCase() ===
            String(family).trim().toLowerCase()
        );
    };

    const normalizeList = (responseData) => {
        if (Array.isArray(responseData)) return responseData;
        if (Array.isArray(responseData?.data)) return responseData.data;
        if (Array.isArray(responseData?.results)) return responseData.results;
        return [];
    };

    const addAttendance = async (payload) => {
        return await axios.post(`${BASE_URL}bdm/order/analysis/add/`, payload, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });
    };

    const getSingleRecord = async (id) => {
        return await axios.get(`${BASE_URL}bdm/order/analysis/edit/${id}/`, {
            headers: { Authorization: `Bearer ${token}` },
        });
    };

    const deleteRecord = async (id) => {
        return await axios.delete(`${BASE_URL}bdm/order/analysis/edit/${id}/`, {
            headers: { Authorization: `Bearer ${token}` },
        });
    };

    const updateRecord = async (id, payload) => {
        return await axios.put(
            `${BASE_URL}bdm/order/analysis/edit/${id}/`,
            payload,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            }
        );
    };

    useEffect(() => {
        const today = new Date().toISOString().split("T")[0];
        setAttendanceDate(today);
    }, []);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await axios.get(`${BASE_URL}profile/`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                setUserFamily(response?.data?.data?.family_name || "");
            } catch (error) {
                toast.error("Error fetching user data");
            }
        };

        fetchUserData();
    }, [BASE_URL, token]);

    useEffect(() => {
        const fetchStaffs = async () => {
            try {
                setFetching(true);

                const response = await axios.get(`${BASE_URL}staffs/`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                setStaffList(response?.data?.data || response?.data || []);
            } catch (error) {
                toast.error("Failed to load staffs");
            } finally {
                setFetching(false);
            }
        };

        fetchStaffs();
    }, [BASE_URL, token]);

    const filteredStaffs = useMemo(() => {
        return (staffList || []).filter((staff) =>
            familyMatches(staff, userFamily)
        );
    }, [staffList, userFamily]);

    const staffOptions = useMemo(() => {
        return filteredStaffs.map((item) => ({
            value: item?.id ?? item?.pk,
            label:
                item?.name ||
                item?.full_name ||
                item?.username ||
                item?.staff_name ||
                `Staff #${item?.id ?? item?.pk}`,
            raw: item,
        }));
    }, [filteredStaffs]);

    const fetchAllData = async () => {
        try {
            const res = await axios.get(`${BASE_URL}bdm/order/analysis/add/`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const rawList = normalizeList(res.data);
            const grouped = {};

            rawList.forEach((item) => {
                const date = String(item?.attendance_date || "").slice(0, 10);
                const presentCount = Number(item?.present_count || 0);
                const absentCount = Number(item?.absent_count || 0);
                const halfDayCount = Number(item?.half_day_count || 0);
                const entriesForItem = Array.isArray(item?.staff_entries)
                    ? item.staff_entries.map((entry) => ({
                        ...entry,
                        record_id: item.id, // ✅ ADD THIS (CRITICAL)
                    }))
                    : [];

                if (!grouped[date]) {
                    grouped[date] = {
                        ...item,
                        present_count: presentCount,
                        absent_count: absentCount,
                        half_day_count: halfDayCount,
                        staff_entries: [...entriesForItem],
                    };
                } else {
                    grouped[date].present_count += presentCount;
                    grouped[date].absent_count += absentCount;
                    grouped[date].half_day_count += halfDayCount;
                    grouped[date].staff_entries = [
                        ...(grouped[date].staff_entries || []),
                        ...entriesForItem,
                    ];
                }
            });

            const finalList = Object.values(grouped).sort((a, b) =>
                String(b?.attendance_date || "").localeCompare(
                    String(a?.attendance_date || "")
                )
            );

            setAllData(finalList);
        } catch (error) {
            console.log("GET ERROR:", error);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, [BASE_URL, token]);


    const handleStaffChange = (selectedOption) => {
        setEntry((prev) => ({
            ...prev,
            staff: selectedOption,
        }));
    };

    const handleStatusChange = (value) => {
        setEntry((prev) => ({
            ...prev,
            status: value,
        }));
    };


    // =========================
    // FIX 1: handleSubmit
    // =========================
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!entry.staff || !entry.status) {
            toast.error("Please select staff and status");
            return;
        }

        // ❌ REMOVE THIS BLOCK
        /*
        const staffIds = entries.map((e) => e.staff?.value);
        const hasDuplicate = new Set(staffIds).size !== staffIds.length;
    
        if (hasDuplicate) {
            toast.error("Duplicate staff not allowed");
            return;
        }
        */

        const payload = {
            attendance_date: attendanceDate,
            staff_entries: [
                {
                    staff: Number(entry.staff?.value),
                    status: entry.status,
                },
            ],
        };

        try {
            setLoading(true);

            await addAttendance(payload);

            toast.success("Submitted successfully");
            await fetchAllData();

            // ✅ FIX RESET
            setEntry({ staff: null, status: "" });

        } catch (error) {
            const message =
                error?.response?.data?.message ||
                (typeof error?.response?.data === "string"
                    ? error.response.data
                    : JSON.stringify(error?.response?.data)) ||
                "Failed to submit";

            if (error?.response?.data?.errors?.staff_entries) {
                toast.error("Some staff already added for this date");
            } else {
                toast.error(message);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleView = (row, parentId) => {
        setSelectedId(parentId);
        setSelectedData(row);
        setRowEditModal(true);
    };

    // const handleDelete = async (id) => {
    //     if (!window.confirm("Are you sure you want to delete?")) return;

    //     try {
    //         await deleteRecord(id);
    //         toast.success("Deleted successfully");
    //         fetchAllData();
    //     } catch (err) {
    //         toast.error("Delete failed");
    //     }
    // };


    const handleDelete = async (parentId, staffId) => {
        if (!window.confirm("Are you sure you want to delete?")) return;

        try {
            const res = await getSingleRecord(parentId);
            const parent = res?.data?.data || res?.data;

            const allEntries = parent.staff_entries || [];

            const remainingEntries = allEntries
                .filter((e) => {
                    const id = e.staff?.id ?? e.staff;
                    return String(id) !== String(staffId);
                })
                .map((e) => ({
                    staff: e.staff?.id ?? e.staff,
                    status: e.status,
                }));

            if (remainingEntries.length === 0) {
                // ✅ DELETE FULL RECORD
                await deleteRecord(parentId);
            } else {
                // ✅ UPDATE RECORD
                await updateRecord(parentId, {
                    attendance_date: parent.attendance_date,
                    staff_entries: remainingEntries,
                });
            }

            toast.success("Deleted successfully");
            fetchAllData();

        } catch (err) {
            console.log(err);
            toast.error("Delete failed");
        }
    };
    const handleUpdateStatus = async () => {
        try {
            const res = await getSingleRecord(selectedId);
            const parent = res?.data?.data || res?.data;

            const allEntries = parent.staff_entries || [];

            const updatedEntries = allEntries.map((e) => {
                const staffId = e.staff?.id ?? e.staff;
                const selectedStaffId =
                    selectedData.staff?.id ?? selectedData.staff;

                if (String(staffId) === String(selectedStaffId)) {
                    return {
                        staff: staffId,
                        status: selectedData.status,
                    };
                }

                return {
                    staff: staffId,
                    status: e.status,
                };
            });

            await updateRecord(selectedId, {
                attendance_date: parent.attendance_date,
                staff_entries: updatedEntries,
            });

            toast.success("Updated successfully");
            setRowEditModal(false);
            fetchAllData();

        } catch (err) {
            console.log(err?.response?.data);
            toast.error("Update failed");
        }
    };
    const mapStatus = (status) => {
        if (status === "present") return "productive";
        if (status === "absent") return "non_productive";
        if (status === "half_day") return "follow_up";
        return status;
    };

    return (
        <React.Fragment>
            <ToastContainer />
            <div className="page-content">
                <Breadcrumbs title="Analysis" breadcrumbItem="Order Analysis" />

                <Row>
                    <Col lg={12}>
                        <Card className="shadow-sm border-0">
                            <CardBody>
                                <CardTitle className="h4 mb-2">
                                    ORDER ANALYSIS
                                </CardTitle>

                                <p style={{ fontWeight: "500" }}>
                                    Date: {attendanceDate}
                                </p>



                                <Form onSubmit={handleSubmit}>

                                    {/* ❌ REMOVE THIS */}
                                    {/*
    {entries.map((entry, index) => (
    */}

                                    {/* ✅ SINGLE ENTRY UI */}
                                    <Row className="align-items-end">
                                        <Col md={6}>
                                            <Label>Staff</Label>
                                            <Select
                                                options={staffOptions}
                                                value={entry.staff}
                                                onChange={handleStaffChange}
                                                placeholder="Select staff"
                                                isClearable
                                                isSearchable
                                            />
                                        </Col>

                                        <Col md={4}>
                                            <Label>Status</Label>
                                            <select
                                                className="form-control"
                                                value={entry.status}
                                                onChange={(e) => handleStatusChange(e.target.value)}
                                            >
                                                <option value="">Select Status</option>
                                                <option value="present">Present</option>
                                                <option value="absent">Absent</option>
                                                <option value="half_day">Half Day</option>
                                            </select>
                                        </Col>
                                    </Row>



                                    <Button
                                        color="primary"
                                        type="submit"
                                        disabled={loading}
                                        className="mt-3"
                                    >
                                        Add Staff
                                    </Button>
                                </Form>

                                <hr />

                                <h5>All Records</h5>

                                <Row className="g-4">
                                    {allData.length === 0 ? (
                                        <Col md={12}>
                                            <div className="text-center py-4">
                                                No records found
                                            </div>
                                        </Col>
                                    ) : (
                                        allData.map((item, index) => {
                                            const id = item.id;
                                            const staffEntries = Array.isArray(item.staff_entries)
                                                ? item.staff_entries
                                                : [];

                                            const cardTheme =
                                                index % 4 === 0
                                                    ? "#eef2ff"
                                                    : index % 4 === 1
                                                        ? "#ecfdf5"
                                                        : index % 4 === 2
                                                            ? "#fff7ed"
                                                            : "#fdf2f8";

                                            return (
                                                <Col key={id} md={12}>
                                                    <Card
                                                        className="shadow-sm border-0 h-100"
                                                        style={{
                                                            background: cardTheme,
                                                            borderRadius: "14px",
                                                        }}
                                                    >
                                                        <CardBody>
                                                            <div className="d-flex justify-content-between align-items-start mb-3">
                                                                <div>
                                                                    <h5 className="mb-1">
                                                                        {item.attendance_date}
                                                                    </h5>
                                                                    <div
                                                                        style={{
                                                                            fontSize: "13px",
                                                                            color: "#64748b",
                                                                        }}
                                                                    >
                                                                        Created by:{" "}
                                                                        {item.created_by_name || "-"}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <Row className="g-2 mb-3">
                                                                <Col xs={4}>
                                                                    <div
                                                                        style={{
                                                                            background: "#dcfce7",
                                                                            borderRadius: "10px",
                                                                            padding: "10px",
                                                                            textAlign: "center",
                                                                        }}
                                                                    >
                                                                        <div
                                                                            style={{
                                                                                fontSize: "12px",
                                                                                fontWeight: 600,
                                                                            }}
                                                                        >
                                                                            Present
                                                                        </div>
                                                                        <div style={{ fontWeight: 700 }}>
                                                                            {item.present_count || 0}
                                                                        </div>
                                                                    </div>
                                                                </Col>

                                                                <Col xs={4}>
                                                                    <div
                                                                        style={{
                                                                            background: "#fee2e2",
                                                                            borderRadius: "10px",
                                                                            padding: "10px",
                                                                            textAlign: "center",
                                                                        }}
                                                                    >
                                                                        <div
                                                                            style={{
                                                                                fontSize: "12px",
                                                                                fontWeight: 600,
                                                                            }}
                                                                        >
                                                                            Absent
                                                                        </div>
                                                                        <div style={{ fontWeight: 700 }}>
                                                                            {item.absent_count || 0}
                                                                        </div>
                                                                    </div>
                                                                </Col>

                                                                <Col xs={4}>
                                                                    <div
                                                                        style={{
                                                                            background: "#fef3c7",
                                                                            borderRadius: "10px",
                                                                            padding: "10px",
                                                                            textAlign: "center",
                                                                        }}
                                                                    >
                                                                        <div
                                                                            style={{
                                                                                fontSize: "12px",
                                                                                fontWeight: 600,
                                                                            }}
                                                                        >
                                                                            Half Day
                                                                        </div>
                                                                        <div style={{ fontWeight: 700 }}>
                                                                            {item.half_day_count || 0}
                                                                        </div>
                                                                    </div>
                                                                </Col>
                                                            </Row>

                                                            <div
                                                                className="table-responsive"
                                                                style={{
                                                                    maxHeight: "240px",
                                                                    overflowY: "auto",
                                                                }}
                                                            >
                                                                <table className="table table-sm table-bordered align-middle mb-0">
                                                                    <thead
                                                                        style={{
                                                                            backgroundColor: "#4338ca",
                                                                            color: "#fff",
                                                                        }}
                                                                    >
                                                                        <tr>
                                                                            <th style={{ width: "10%" }}>#</th>
                                                                            <th>Staff</th>
                                                                            <th>Status</th>
                                                                            <th>Action</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {staffEntries.length > 0 ? (
                                                                            staffEntries.map((staffItem, i) => (
                                                                                <tr key={`${staffItem.record_id}-${staffItem.staff}`}>
                                                                                    <td>{i + 1}</td>
                                                                                    <td>
                                                                                        {staffItem.staff_name ||
                                                                                            staffItem.staff?.name ||
                                                                                            staffItem.staff ||
                                                                                            "-"}
                                                                                    </td>
                                                                                    <td style={{ backgroundColor: "#ffffff" }}>
                                                                                        {staffItem.status}
                                                                                    </td>
                                                                                    <td className="d-flex gap-2">
                                                                                        <Button
                                                                                            size="sm"
                                                                                            color="info"
                                                                                            onClick={() =>
                                                                                                handleView(staffItem, staffItem.record_id)
                                                                                            }
                                                                                        >
                                                                                            View
                                                                                        </Button>

                                                                                        <Button
                                                                                            size="sm"
                                                                                            color="danger"
                                                                                            onClick={() =>
                                                                                                handleDelete(
                                                                                                    staffItem.record_id,
                                                                                                    staffItem.staff?.id || staffItem.staff
                                                                                                )
                                                                                            }
                                                                                        >
                                                                                            Delete
                                                                                        </Button>
                                                                                    </td>
                                                                                </tr>
                                                                            ))
                                                                        ) : (
                                                                            <tr>
                                                                                <td colSpan="4" className="text-center">
                                                                                    No staff entries
                                                                                </td>
                                                                            </tr>
                                                                        )}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </CardBody>
                                                    </Card>
                                                </Col>
                                            );
                                        })
                                    )}
                                </Row>
                            </CardBody>

                            <Modal
                                isOpen={rowEditModal}
                                toggle={() => setRowEditModal(false)}
                                size="lg"
                                centered
                            >
                                <ModalHeader toggle={() => setRowEditModal(false)}>
                                    Edit Status
                                </ModalHeader>

                                <ModalBody className="px-4 py-3">
                                    {selectedData ? (
                                        <div>

                                            {/* Staff Name */}
                                            <div className="mb-4">
                                                <Label className="form-label fw-semibold">
                                                    Staff
                                                </Label>
                                                <div className="form-control bg-light">
                                                    {selectedData.staff_name ||
                                                        selectedData.staff?.name ||
                                                        selectedData.staff ||
                                                        "-"}
                                                </div>
                                            </div>

                                            {/* Status */}
                                            <div className="mb-3">
                                                <Label className="form-label fw-semibold">
                                                    Status
                                                </Label>
                                                <select
                                                    className="form-control"
                                                    value={selectedData.status}
                                                    onChange={(e) =>
                                                        setSelectedData((prev) => ({
                                                            ...prev,
                                                            status: e.target.value,
                                                        }))
                                                    }
                                                >
                                                    <option value="present">Present</option>
                                                    <option value="absent">Absent</option>
                                                    <option value="half_day">Half Day</option>
                                                </select>
                                            </div>

                                        </div>
                                    ) : (
                                        <p className="text-center mb-0">Loading...</p>
                                    )}
                                </ModalBody>

                                <ModalFooter className="px-4 py-3">
                                    <Button color="primary" onClick={handleUpdateStatus}>
                                        Save
                                    </Button>
                                    <Button
                                        color="secondary"
                                        onClick={() => setRowEditModal(false)}
                                    >
                                        Cancel
                                    </Button>
                                </ModalFooter>
                            </Modal>
                        </Card>
                    </Col>
                </Row>
            </div>
        </React.Fragment>
    );
};

export default BDOData;