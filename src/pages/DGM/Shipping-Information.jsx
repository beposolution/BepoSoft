import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Table, Row, Col, CardTitle, Button } from "reactstrap";
import { toast, ToastContainer } from "react-toastify";

const BasicTable = () => {
    const { id } = useParams();
    const [warehouseData, setWarehouseData] = useState([]);
    const [parcelServices, setParcelServices] = useState([]);
    const [staffs, setStaffs] = useState([]);
    const [editableData, setEditableData] = useState([]);
    const token = localStorage.getItem('token');



    const [status, setStatus] = useState([
        "Packing under progress",
        "Packed",
        "Ready to ship",
        "Shipped",
    ]);

    useEffect(() => {
        axios.get(`${import.meta.env.VITE_APP_KEY}order/${id}/items/`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(response => {
            setWarehouseData(response.data.order.warehouse);
            setEditableData(response.data.order.warehouse);
        })
        .catch(error => toast.error("Error fetching warehouse data:"));
    }, [id, token]);

    useEffect(() => {
        axios.get(`${import.meta.env.VITE_APP_KEY}parcal/service/`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(response => setParcelServices(response.data.data))
        .catch(error => toast.error("Error fetching parcel services:"));
    }, [token]);

    useEffect(() => {
        axios.get(`${import.meta.env.VITE_APP_KEY}staffs/`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(response => setStaffs(response.data.data))
        .catch(error => toast.error("Error fetching staff data:"));
    }, [token]);

    const handleInputChange = (e, index, field) => {
        const newData = [...editableData];
        newData[index][field] = e.target.value;
        setEditableData(newData);
    };

    const updateDataOnServer = (index) => {
        const updatedItem = editableData[index];
        const url = `${import.meta.env.VITE_APP_KEY}warehouse/detail/${updatedItem.id}/`;
        const updatedFields = {
            verified_by: updatedItem.verified_by,
            shipped_date: updatedItem.shipped_date,
            parcel_service: updatedItem.parcel_service,
            tracking_id: updatedItem.tracking_id,
            status: updatedItem.status,
        };

        
        axios.put(url, updatedFields, {
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
        })
        .then(response => {
            toast.success("Data updated successfully!");
            const newData = [...editableData];
            newData[index] = response.data;
            setEditableData(newData);
            setWarehouseData(newData);
        })
        .catch(error => {
            toast.error("Update failed:", error.response ? error.response.data : error.message);
            alert("Update failed. Try again!");
        });
    };

    const deleteBox = async (index) => {
        const updatedItem = editableData[index];
    
        try {
            const response = await axios.delete(`${import.meta.env.VITE_APP_KEY}warehouse/detail/${updatedItem.id}/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // ✅ Check if the response status is 200 (successful deletion)
            if (response.status === 200) {
                toast.success("Box deleted successfully!");
    
            } else {
                toast.error("Failed to delete the box.");
            }
        } catch (error) {
            toast.error("Error deleting the box. Try again.");
        }
    };


    const sendTracking = async (index) => {

        try {

            const response = await axios.post(`${import.meta.env.VITE_APP_KEY}sendtrackingid/`, {
                tracking_id: editableData[index].tracking_id,
                name : warehouseData[0]?.customer,
                order_id: warehouseData[0]?.invoice,
                phone: warehouseData[0]?.phone,

                header:{
                    Authorization: `Bearer ${token}`
                }
            })

            if(response.status === 200){
                toast.success("sms send successfu")
            }
        }catch(error){
            toast.error("Error sending sms. Try again.");
        }
    }

    return (
        <div className="page-content">
            <div className="container-fluid">
                <Row>
                    <Col xl={12}>
                        <CardTitle className="h4 custom-heading">SHIPPING INFORMATION</CardTitle>
                        <div className="table-responsive">
                            <Table className="table table-hover mb-0">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>BOX</th>
                                        <th>Parcel Service</th>
                                        <th>Tracking ID</th>
                                        <th>Packed Image</th>
                                        <th>Parcel Image</th>
                                        <th>Packed by</th>
                                        <th>Status</th>
                                        <th>Verified by</th>
                                        <th>Date</th>
                                        <th>Action</th>
                                        <th>Delete</th>
                                        <th>sms</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {editableData.map((item, index) => (
                                        <tr key={item.id}>
                                            <th scope="row">{index + 1}</th>
                                            <td>{item.box || "N/A"}</td>
                                            <td>
                                                <select value={item.parcel_service || ""} onChange={(e) => handleInputChange(e, index, "parcel_service")}>
                                                    <option value="">{item.parcel_service ? item.parcel_service : "Select"}</option>
                                                    {parcelServices.map(service => (
                                                        <option key={service.id} value={service?.id}>{service.name}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td>
                                                <input type="text" value={item.tracking_id || ""} onChange={(e) => handleInputChange(e, index, "tracking_id")} />
                                            </td>
                                            <td>
                                                {item.image ? (
                                                    <img src={`${import.meta.env.VITE_APP_IMAGE}${item.image}`} alt="Warehouse Item" style={{ width: "50px", height: "50px", objectFit: "cover", borderRadius: "5px" }} />
                                                ) : (
                                                    "No Image"
                                                )}
                                            </td>
                                            <td>
                                                {item.image_before ? (
                                                    <img src={`${import.meta.env.VITE_APP_IMAGE}${item.image_before}`} alt="Warehouse Item" style={{ width: "50px", height: "50px", objectFit: "cover", borderRadius: "5px" }} />
                                                ) : (
                                                    "No Image"
                                                )}
                                            </td>
                                            <td>{item.packed_by || "N/A"}</td>
                                            <td>
                                                <select value={item.verified_by || ""} onChange={(e) => handleInputChange(e, index, "status")}>
                                                    <option value="">{item.status}</option>
                                                    {status.map(staff => (
                                                        <option key={staff} value={staff}>{staff}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td>
                                                <select value={item.verified_by || ""} onChange={(e) => handleInputChange(e, index, "verified_by")}>
                                                    <option value="">Select</option>
                                                    {staffs.map(staff => (
                                                        <option key={staff.id} value={staff.id}>{staff.name}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td>
                                                <input type="date" value={item.shipped_date || ''} onChange={(e) => handleInputChange(e, index, "shipped_date")} />
                                            </td>
                                            <td>
                                                <Button color="primary" onClick={() => updateDataOnServer(index)}>Save</Button>
                                            </td>
                                            <td>
                                                <Button color="danger" onClick={() => deleteBox(index)}>Delete</Button>
                                            </td>
                                            <td>
                {item.status === "Shipped" && (
                    <Button color="success" onClick={() => sendTracking(index)}>Send Sms</Button>
                )}
            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                            <ToastContainer/>
                        </div>
                    </Col>
                </Row>
            </div>
        </div>
    );
};

export default BasicTable;