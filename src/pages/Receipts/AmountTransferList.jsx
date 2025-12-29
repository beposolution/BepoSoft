import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Breadcrumbs from "../../components/Common/Breadcrumb";
import {
    Card,
    Col,
    Container,
    Row,
    CardBody,
    CardTitle,
    Table,
    Spinner,
    Input,
    Modal,
    ModalHeader,
    ModalBody,
    Label,
    ModalFooter,
    Button
} from "reactstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Paginations from '../../components/Common/Pagination';

const AmountTransferList = () => {

    const token = localStorage.getItem("token");
    const [transfers, setTransfers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);
    const [selectedTransfer, setSelectedTransfer] = useState(null);
    const [beforeSnapshot, setBeforeSnapshot] = useState(null);
    const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
    const [activeImage, setActiveImage] = useState(null);
    const [formData, setFormData] = useState({
        send_from_name: "",
        send_to_name: "",
        amount: "",
        date: "",
        note: "",
    });
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [staffs, setStaffs] = useState([]);
    const [selectedStaff, setSelectedStaff] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const perPageData = 10;
    const FIELDS = ["amount", "date", "note"];

    const pickFields = (obj) => {
        const out = {};
        FIELDS.forEach(k => {
            if (obj && Object.prototype.hasOwnProperty.call(obj, k)) {
                out[k] = obj[k];
            }
        });
        return out;
    };

    const computeDiff = (before, after) => {
        const before_data = { ...before };
        const after_data = {};

        FIELDS.forEach(k => {
            const b = before?.[k] ?? null;
            const a = after?.[k] ?? null;
            if (String(b) !== String(a)) {
                after_data[k] = a;
            }
        });

        return { before_data, after_data };
    };

    const fetchStaffs = async () => {
        try {
            const res = await axios.get(
                `${import.meta.env.VITE_APP_KEY}staffs/`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setStaffs(res.data?.data || []);
        } catch (err) {
            toast.error("Failed to fetch staffs");
        }
    };

    const fetchTransfers = async () => {
        setLoading(true);
        try {
            const res = await axios.get(
                `${import.meta.env.VITE_APP_KEY}advance/transfer/create/`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setTransfers(res.data?.data || []);
        } catch (err) {
            toast.error("Failed to fetch transfers");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransfers();
        fetchStaffs();
    }, []);

    const handleView = async (id) => {
        setModalOpen(true);
        setModalLoading(true);

        try {
            const res = await axios.get(
                `${import.meta.env.VITE_APP_KEY}advance/transfer/update/${id}/`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const data = res.data?.data;
            setSelectedTransfer(data);

            setFormData({
                send_from_name: data.send_from_name,
                send_to_name: data.send_to_name,
                amount: data.amount,
                date: data.date,
                note: data.note || "",
            });

            setBeforeSnapshot(
                pickFields({
                    amount: data.amount,
                    date: data.date,
                    note: data.note,
                })
            );

        } catch (err) {
            toast.error("Failed to load transfer details");
        } finally {
            setModalLoading(false);
        }
    };

    const handleUpdate = async () => {
        if (!selectedTransfer?.id) return;

        try {
            const payload = new FormData();
            payload.append("amount", formData.amount);
            payload.append("date", formData.date);
            payload.append("note", formData.note);

            const res = await axios.put(
                `${import.meta.env.VITE_APP_KEY}advance/transfer/update/${selectedTransfer.id}/`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (res.status === 200) {
                const afterSnapshot = pickFields({
                    amount: formData.amount,
                    date: formData.date,
                    note: formData.note,
                });

                const { before_data, after_data } = computeDiff(
                    beforeSnapshot,
                    afterSnapshot
                );

                if (Object.keys(after_data).length > 0) {
                    await axios.post(
                        `${import.meta.env.VITE_APP_KEY}datalog/create/`,
                        {
                            reference_type: "ADVANCE_AMOUNT_TRANSFER",
                            reference_no: `TRANSFER-${selectedTransfer.id}`,
                            before_data,
                            after_data,
                        },
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                                "Content-Type": "application/json",
                            },
                        }
                    );
                }

                toast.success("Transfer updated successfully");
                setModalOpen(false);
                fetchTransfers();
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to update transfer");
        }
    };

    const handleDeleteImage = async (imageId) => {
        if (!window.confirm("Delete this image?")) return;

        try {
            await axios.delete(
                `${import.meta.env.VITE_APP_KEY}advance/transfer/image/${imageId}/`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success("Image deleted");
            handleView(selectedTransfer.id);
        } catch {
            toast.error("Failed to delete image");
        }
    };

    const filtered = transfers.filter(item => {
        const matchesSearch =
            (item.send_from_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.send_to_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.note || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            String(item.amount || "").includes(searchTerm);

        const matchesStaff =
            !selectedStaff || item.created_by_name === selectedStaff;

        const itemDate = item.date ? new Date(item.date) : null;

        const matchesFromDate =
            !fromDate || (itemDate && itemDate >= new Date(fromDate));

        const matchesToDate =
            !toDate || (itemDate && itemDate <= new Date(toDate));

        return (
            matchesSearch &&
            matchesStaff &&
            matchesFromDate &&
            matchesToDate
        );
    });

    const indexOfLastItem = currentPage * perPageData;
    const indexOfFirstItem = indexOfLastItem - perPageData;
    const currentItems = filtered.slice(indexOfFirstItem, indexOfLastItem);

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <Breadcrumbs title="TABLES" breadcrumbItem="ADVANCE AMOUNT TRANSFER" />

                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <CardTitle className="mb-4">ADVANCE AMOUNT TRANSFER</CardTitle>

                                    <Row className="mb-3">
                                        <Col md={3}>
                                            <Label>Search</Label>
                                            <Input
                                                placeholder="Search by From / To / Amount / Note"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </Col>

                                        <Col md={3}>
                                            <Label>From Date</Label>
                                            <Input
                                                type="date"
                                                value={fromDate}
                                                onChange={(e) => setFromDate(e.target.value)}
                                            />
                                        </Col>

                                        <Col md={3}>
                                            <Label>To Date</Label>
                                            <Input
                                                type="date"
                                                value={toDate}
                                                onChange={(e) => setToDate(e.target.value)}
                                            />
                                        </Col>

                                        <Col md={3}>
                                            <Label>Created By</Label>
                                            <Input
                                                type="select"
                                                value={selectedStaff}
                                                onChange={(e) => setSelectedStaff(e.target.value)}
                                            >
                                                <option value="">All Staff</option>
                                                {staffs.map((staff) => (
                                                    <option key={staff.id} value={staff.name}>
                                                        {staff.name}
                                                    </option>
                                                ))}
                                            </Input>
                                        </Col>
                                    </Row>

                                    {loading ? (
                                        <Spinner />
                                    ) : (
                                        <>
                                            <Table bordered responsive hover striped>
                                                <thead>
                                                    <tr>
                                                        <th>#</th>
                                                        <th>Amount Transfered To</th>
                                                        <th>Amount Transfered From</th>
                                                        <th>Amount</th>
                                                        <th>Date</th>
                                                        <th>Note</th>
                                                        <th>Created By</th>
                                                        <th>Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {currentItems.map((item, index) => (
                                                        <tr key={item.id}>
                                                            <td>{indexOfFirstItem + index + 1}</td>
                                                            <td>{item.send_from_name}</td>
                                                            <td>{item.send_to_name}</td>
                                                            <td>₹ {item.amount}</td>
                                                            <td>{item.date}</td>
                                                            <td>{item.note}</td>
                                                            <td>{item.created_by_name}</td>
                                                            <td>
                                                                <Button size="sm" color="primary" onClick={() => handleView(item.id)}>
                                                                    View
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </Table>

                                            <Paginations
                                                perPageData={perPageData}
                                                data={filtered}
                                                currentPage={currentPage}
                                                setCurrentPage={setCurrentPage}
                                                indexOfFirstItem={indexOfFirstItem}
                                                indexOfLastItem={indexOfLastItem}
                                            />
                                        </>
                                    )}

                                    <Modal isOpen={modalOpen} toggle={() => setModalOpen(false)} size="lg">
                                        <ModalHeader toggle={() => setModalOpen(false)}>
                                            Transfer Details
                                        </ModalHeader>

                                        <ModalBody>
                                            {modalLoading ? <Spinner /> : (
                                                <>
                                                    <Row>
                                                        <Col md={6}>
                                                            <Label>Send From</Label>
                                                            <Input value={formData.send_from_name} disabled />
                                                        </Col>
                                                        <Col md={6}>
                                                            <Label>Send To</Label>
                                                            <Input value={formData.send_to_name} disabled />
                                                        </Col>
                                                    </Row>

                                                    <Row className="mt-3">
                                                        <Col md={4}>
                                                            <Label>Amount</Label>
                                                            <Input type="number" name="amount" value={formData.amount}
                                                                onChange={e => setFormData({ ...formData, amount: e.target.value })} />
                                                        </Col>
                                                        <Col md={4}>
                                                            <Label>Date</Label>
                                                            <Input type="date" name="date" value={formData.date}
                                                                onChange={e => setFormData({ ...formData, date: e.target.value })} />
                                                        </Col>
                                                    </Row>

                                                    <Row className="mt-3">
                                                        <Col md={12}>
                                                            <Label>Note</Label>
                                                            <Input name="note" value={formData.note}
                                                                onChange={e => setFormData({ ...formData, note: e.target.value })} />
                                                        </Col>
                                                    </Row>

                                                    <Row className="mt-4">
                                                        {selectedTransfer?.amount_transfer_images?.map(img => (
                                                            <Col md={2} key={img.id} className="mb-3 text-center">
                                                                <img
                                                                    src={`${import.meta.env.VITE_APP_IMAGE}${img.image}`}
                                                                    alt=""
                                                                    style={{
                                                                        width: "80px",
                                                                        height: "80px",
                                                                        objectFit: "cover",
                                                                        borderRadius: "6px",
                                                                        cursor: "pointer",
                                                                        border: "1px solid #ddd"
                                                                    }}
                                                                    onClick={() => {
                                                                        setActiveImage(img);
                                                                        setImagePreviewOpen(true);
                                                                    }}
                                                                />
                                                            </Col>
                                                        ))}
                                                    </Row>
                                                </>
                                            )}
                                        </ModalBody>

                                        <ModalFooter>
                                            <Button color="primary" onClick={handleUpdate}>Update</Button>
                                            <Button color="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
                                        </ModalFooter>
                                    </Modal>
                                    <Modal
                                        isOpen={imagePreviewOpen}
                                        toggle={() => setImagePreviewOpen(false)}
                                        size="lg"
                                        centered
                                    >
                                        <ModalHeader toggle={() => setImagePreviewOpen(false)}>
                                            Image Preview
                                        </ModalHeader>

                                        <ModalBody className="text-center">
                                            {activeImage && (
                                                <>
                                                    <img
                                                        src={`${import.meta.env.VITE_APP_IMAGE}${activeImage.image}`}
                                                        alt=""
                                                        style={{
                                                            maxWidth: "100%",
                                                            maxHeight: "70vh",
                                                            borderRadius: "8px"
                                                        }}
                                                    />

                                                    {/* <div className="mt-3">
                                                        <Button
                                                            color="danger"
                                                            onClick={() => {
                                                                handleDeleteImage(activeImage.id);
                                                                setImagePreviewOpen(false);
                                                            }}
                                                        >
                                                            Delete Image
                                                        </Button>
                                                    </div> */}
                                                </>
                                            )}
                                        </ModalBody>
                                    </Modal>

                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </Container>
                <ToastContainer />
            </div>
        </React.Fragment>
    );
};

export default AmountTransferList;
