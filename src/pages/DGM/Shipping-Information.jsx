import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import {
    Table,
    Row,
    Col,
    CardTitle,
    Button,
    Modal,
    ModalBody,
    ModalFooter
} from "reactstrap";
import { toast, ToastContainer } from "react-toastify";

const BasicTable = () => {
    const { id } = useParams();
    const [warehouseData, setWarehouseData] = useState([]);
    const [parcelServices, setParcelServices] = useState([]);
    const [staffs, setStaffs] = useState([]);
    const [editableData, setEditableData] = useState([]);
    const token = localStorage.getItem("token");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [imageBeforeFile, setImageBeforeFile] = useState(null);
    const [imageAfterFile, setImageAfterFile] = useState(null);
    const [role, setRole] = useState(null)

    useEffect(() => {
        const role = localStorage.getItem("active");
        setRole(role);
    }, []);

    const [status, setStatus] = useState([
        "Packing under progress",
        "Packed",
        "Ready to ship",
        "Shipped"
    ]);

    useEffect(() => {
        axios
            .get(`${import.meta.env.VITE_APP_KEY}order/${id}/items/`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            .then((response) => {
                setWarehouseData(response.data.order.warehouse);
                setEditableData(response.data.order.warehouse);
            })
            .catch(() => toast.error("Error fetching warehouse data"));
    }, [id, token]);

    useEffect(() => {
        axios
            .get(`${import.meta.env.VITE_APP_KEY}parcal/service/`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            .then((response) => setParcelServices(response.data.data))
            .catch(() => toast.error("Error fetching parcel services"));
    }, [token]);

    useEffect(() => {
        axios
            .get(`${import.meta.env.VITE_APP_KEY}staffs/`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            .then((response) => setStaffs(response.data.data))
            .catch(() => toast.error("Error fetching staff data"));
    }, [token]);

    const deleteBox = async (index) => {
        const updatedItem = editableData[index];
        try {
            const response = await axios.delete(
                `${import.meta.env.VITE_APP_KEY}warehouse/detail/${updatedItem.id}/`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            if (response.status === 200) {
                toast.success("Box deleted successfully!");
                const updatedList = editableData.filter(
                    (item) => item.id !== updatedItem.id
                );
                setEditableData(updatedList);
                setWarehouseData(updatedList);
            } else {
                toast.error("Failed to delete the box.");
            }
        } catch (error) {
            toast.error("Error deleting the box. Try again.");
        }
    };

    const sendTracking = async (index) => {
        const item = editableData[index];
        const customerName = item.customer_name || warehouseData[0]?.customer;
        const phoneNumber = item.phone || warehouseData[0]?.phone;
        const invoiceNumber = item.invoice || warehouseData[0]?.invoice;
        const trackingId = item.tracking_id;

        // Validate required fields
        if (!customerName || !phoneNumber || !invoiceNumber || !trackingId) {
            toast.error("Missing required data. Please check name, phone, invoice or tracking ID.");
            return;
        }

        const payload = {
            name: customerName,
            phone: phoneNumber,
            order_id: invoiceNumber,
            tracking_id: trackingId,
        };

        try {
            const response = await axios.post(
                `${import.meta.env.VITE_APP_KEY}sendtrackingid/`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (response.status === 200) {
                toast.success("Tracking SMS sent successfully");
                // Optionally update message_status in frontend here
            } else {
                toast.error("SMS sending failed");
            }
        } catch (error) {
            toast.error("Error sending SMS. Try again.");
        }
    };

    return (
        <div className="page-content">
            <div className="container-fluid">
                <Row>
                    <Col xl={12}>
                        <CardTitle className="h4 custom-heading">
                            SHIPPING INFORMATION
                        </CardTitle>
                        <div className="table-responsive">
                            <Table className="table table-hover mb-0">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>BOX</th>
                                        <th>Parcel Service</th>
                                        <th>Tracking ID</th>
                                        <th>Height</th>
                                        <th>Breadth</th>
                                        <th>Length</th>
                                        <th>Packed Image</th>
                                        <th>Parcel Image</th>
                                        <th>Packed by</th>
                                        <th>Status</th>
                                        <th>Verified by</th>
                                        <th>Shipped Date</th>
                                        <th>Action</th>
                                        {role !== "warehouse" && <th>Delete</th>}
                                        {/* <th>SMS</th> */}
                                    </tr>
                                </thead>
                                <tbody>
                                    {editableData.map((item, index) => (
                                        <tr key={item.id}>
                                            <th scope="row">{index + 1}</th>
                                            <td>{item.box || "N/A"}</td>
                                            <td>{item.parcel_service || "N/A"}</td>
                                            <td>{item.tracking_id || "N/A"}</td>
                                            <td>{item.height}</td>
                                            <td>{item.breadth}</td>
                                            <td>{item.length}</td>
                                            <td>
                                                {item.image ? (
                                                    <img
                                                        src={`${import.meta.env.VITE_APP_IMAGE}${item.image}`}
                                                        alt="Packed"
                                                        style={{
                                                            width: "50px",
                                                            height: "50px",
                                                            objectFit: "cover",
                                                            borderRadius: "5px"
                                                        }}
                                                    />
                                                ) : (
                                                    "No Image"
                                                )}
                                            </td>
                                            <td>
                                                {item.image_before ? (
                                                    <img
                                                        src={`${import.meta.env.VITE_APP_IMAGE}${item.image_before}`}
                                                        alt="Before"
                                                        style={{
                                                            width: "50px",
                                                            height: "50px",
                                                            objectFit: "cover",
                                                            borderRadius: "5px"
                                                        }}
                                                    />
                                                ) : (
                                                    "No Image"
                                                )}
                                            </td>
                                            <td>
                                                {
                                                    staffs.find((s) => s.id === parseInt(item.packed_by))?.name ||
                                                    item.packed_by || "N/A"
                                                }
                                            </td>
                                            <td>{item.status || "N/A"}</td>
                                            <td>
                                                {
                                                    staffs.find(
                                                        (s) =>
                                                            s.id ===
                                                            parseInt(
                                                                item.verified_by
                                                            )
                                                    )?.name || "N/A"
                                                }
                                            </td>
                                            <td>{item.shipped_date || "N/A"}</td>
                                            <td>
                                                <Button
                                                    color="info"
                                                    onClick={() => {
                                                        setSelectedItem(item);
                                                        setIsModalOpen(true);
                                                    }}
                                                >
                                                    View
                                                </Button>
                                            </td>
                                            {role !== "warehouse" && (
                                                <td>
                                                    <Button
                                                        color="danger"
                                                        onClick={() => deleteBox(index)}
                                                    >
                                                        Delete
                                                    </Button>
                                                </td>
                                            )}
                                            {/* <td>
                                                {item.status === "Shipped" && (
                                                    <Button color="success" onClick={() => sendTracking(index)}>
                                                        Send SMS
                                                    </Button>
                                                )}
                                            </td> */}
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>

                            {/* MODAL FOR EDITING */}
                            <Modal
                                isOpen={isModalOpen}
                                toggle={() => setIsModalOpen(false)}
                            >
                                <ModalBody>
                                    {selectedItem && (
                                        <div>
                                            <h5 className="mb-3">
                                                Edit Box: {selectedItem.box}
                                            </h5>

                                            <label>Box</label>
                                            <input
                                                className="form-control mb-2"
                                                type="text"
                                                value={selectedItem.box || ""}
                                                onChange={(e) =>
                                                    setSelectedItem({
                                                        ...selectedItem,
                                                        box: e.target.value
                                                    })
                                                }
                                            />

                                            <label>Weight</label>
                                            <input
                                                className="form-control mb-2"
                                                type="text"
                                                value={selectedItem.weight || ""}
                                                onChange={(e) =>
                                                    setSelectedItem({
                                                        ...selectedItem,
                                                        weight: e.target.value
                                                    })
                                                }
                                            />

                                            <label>Length</label>
                                            <input
                                                className="form-control mb-2"
                                                type="text"
                                                value={selectedItem.length || ""}
                                                onChange={(e) =>
                                                    setSelectedItem({
                                                        ...selectedItem,
                                                        length: e.target.value
                                                    })
                                                }
                                            />

                                            <label>Breadth</label>
                                            <input
                                                className="form-control mb-2"
                                                type="text"
                                                value={selectedItem.breadth || ""}
                                                onChange={(e) =>
                                                    setSelectedItem({
                                                        ...selectedItem,
                                                        breadth: e.target.value
                                                    })
                                                }
                                            />

                                            <label>Height</label>
                                            <input
                                                className="form-control mb-2"
                                                type="text"
                                                value={selectedItem.height || ""}
                                                onChange={(e) =>
                                                    setSelectedItem({
                                                        ...selectedItem,
                                                        height: e.target.value
                                                    })
                                                }
                                            />

                                            <label>Status</label>
                                            <select
                                                className="form-control mb-2"
                                                value={selectedItem.status || ""}
                                                onChange={(e) =>
                                                    setSelectedItem({
                                                        ...selectedItem,
                                                        status: e.target.value
                                                    })
                                                }
                                            >
                                                <option value="">Select</option>
                                                {status.map((s, i) => (
                                                    <option key={i} value={s}>
                                                        {s}
                                                    </option>
                                                ))}
                                            </select>

                                            <label>Tracking ID</label>
                                            <input
                                                className="form-control mb-2"
                                                type="text"
                                                value={
                                                    selectedItem.tracking_id || ""
                                                }
                                                onChange={(e) =>
                                                    setSelectedItem({
                                                        ...selectedItem,
                                                        tracking_id:
                                                            e.target.value
                                                    })
                                                }
                                            />

                                            <label>Shipped Date</label>
                                            <input
                                                className="form-control mb-2"
                                                type="date"
                                                value={
                                                    selectedItem.shipped_date || ""
                                                }
                                                onChange={(e) =>
                                                    setSelectedItem({
                                                        ...selectedItem,
                                                        shipped_date:
                                                            e.target.value
                                                    })
                                                }
                                            />

                                            <label>Parcel Service</label>
                                            <select
                                                className="form-control mb-2"
                                                value={selectedItem.parcel_service || ""}
                                                onChange={(e) =>
                                                    setSelectedItem({
                                                        ...selectedItem,
                                                        parcel_service: e.target.value
                                                    })
                                                }
                                            >
                                                <option value="">Select</option>
                                                {parcelServices.map((service) => (
                                                    <option key={service.id} value={service.id}>
                                                        {service.name}
                                                    </option>
                                                ))}
                                            </select>

                                            {/* <label>Image Before Packing</label>
                                            <input
                                                type="file"
                                                className="form-control mb-2"
                                                onChange={(e) => setImageBeforeFile(e.target.files[0])}
                                            /> */}

                                            <label>Image After Packing</label>
                                            <input
                                                type="file"
                                                className="form-control mb-2"
                                                required
                                                onChange={(e) => setImageAfterFile(e.target.files[0])}
                                            />

                                        </div>
                                    )}
                                </ModalBody>
                                <ModalFooter>
                                    <Button
                                        color="primary"
                                        onClick={async () => {
                                            try {
                                                const formData = new FormData();
                                                formData.append("box", selectedItem.box || "");
                                                formData.append("weight", selectedItem.weight || "");
                                                formData.append("length", selectedItem.length || "");
                                                formData.append("breadth", selectedItem.breadth || "");
                                                formData.append("height", selectedItem.height || "");
                                                formData.append("status", selectedItem.status || "");
                                                formData.append("tracking_id", selectedItem.tracking_id || "");
                                                formData.append("shipped_date", selectedItem.shipped_date || "");
                                                formData.append("parcel_service", selectedItem.parcel_service || "");

                                                if (imageBeforeFile) {
                                                    formData.append("image_before", imageBeforeFile);
                                                }
                                                if (imageAfterFile) {
                                                    formData.append("image", imageAfterFile);
                                                }

                                                const res = await axios.put(
                                                    `${import.meta.env.VITE_APP_KEY}warehouse/detail/${selectedItem.id}/`,
                                                    formData,
                                                    {
                                                        headers: {
                                                            Authorization: `Bearer ${token}`,
                                                            "Content-Type": "multipart/form-data",
                                                        },
                                                    }
                                                );

                                                toast.success("Details updated!");
                                                setIsModalOpen(false);
                                                setImageBeforeFile(null);
                                                setImageAfterFile(null);

                                                const updatedList = [...editableData];
                                                const idx = updatedList.findIndex(
                                                    (item) => item.id === selectedItem.id
                                                );
                                                const fixedData = {
                                                    ...res.data,
                                                    parcel_service:
                                                        typeof res.data.parcel_service === "object"
                                                            ? res.data.parcel_service.id
                                                            : res.data.parcel_service,
                                                };
                                                updatedList[idx] = fixedData;
                                                setEditableData(updatedList);
                                                setWarehouseData(updatedList);
                                            } catch (err) {
                                                toast.error("Update failed.");
                                            }
                                        }}
                                    >
                                        Save
                                    </Button>
                                    <Button
                                        color="secondary"
                                        onClick={() => setIsModalOpen(false)}
                                    >
                                        Close
                                    </Button>
                                </ModalFooter>
                            </Modal>
                            <ToastContainer />
                        </div>
                    </Col>
                </Row>
            </div>
        </div>
    );
};

export default BasicTable;
