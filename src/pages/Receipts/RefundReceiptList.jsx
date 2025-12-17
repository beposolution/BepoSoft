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

const RefundReceiptList = () => {

    const token = localStorage.getItem("token");

    const [receipts, setReceipts] = useState([]);
    const [loading, setLoading] = useState(true);

    const [modalOpen, setModalOpen] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);

    const [selectedReceipt, setSelectedReceipt] = useState(null);
    const [formData, setFormData] = useState({
        refund_no: "",
        amount: "",
        transactionID: "",
        date: "",
        note: "",
        bank_name: "",
        customer_name: "",
        created_name: "",
    });

    const [beforeSnapshot, setBeforeSnapshot] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const perPageData = 10;


    const REFUND_FIELDS = [
        "refund_no",
        "amount",
        "transactionID",
        "date",
        "note",
    ];

    const norm = (v) => {
        if (v === undefined) return null;
        if (typeof v === "string") return v.trim();
        return v;
    };

    const pickFields = (obj) => {
        const out = {};
        REFUND_FIELDS.forEach((k) => {
            if (obj && Object.prototype.hasOwnProperty.call(obj, k)) {
                out[k] = obj[k];
            }
        });
        return out;
    };

    const computeDiff = (before, after) => {
        const before_data = { ...before };
        const after_data = {};             

        REFUND_FIELDS.forEach((k) => {
            const prev = before?.[k] ?? null;
            const curr = after?.[k] ?? null;

            const sp = prev === null ? null : String(prev);
            const sc = curr === null ? null : String(curr);

            if (sp !== sc) {
                after_data[k] = curr;
            }
        });

        return { before_data, after_data };
    };

    const fetchRefundReceipts = async () => {
        setLoading(true);
        try {
            const res = await axios.get(
                `${import.meta.env.VITE_APP_KEY}refund/receipts/`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setReceipts(res.data?.data || []);
        } catch (error) {
            toast.error("Failed to fetch refund receipts");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRefundReceipts();
    }, []);


    const handleView = async (id) => {
        setModalOpen(true);
        setModalLoading(true);

        try {
            const res = await axios.get(
                `${import.meta.env.VITE_APP_KEY}refund/receipts/${id}/`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const data = res.data?.data;

            setSelectedReceipt(data);

            setFormData({
                refund_no: data.refund_no || "",
                amount: data.amount || "",
                transactionID: data.transactionID || "",
                date: data.date
                    ? data.date.split("T")[0]
                    : "",
                note: data.note || "",
                bank_name: data.bank_name || "",
                customer_name: data.customer_name || "",
                created_name: data.created_name || "",
            });

            setBeforeSnapshot(
                pickFields({
                    refund_no: data.refund_no,
                    amount: data.amount,
                    transactionID: data.transactionID,
                    date: data.date ? data.date.split("T")[0] : "",
                    note: data.note,
                })
            );

        } catch (error) {
            toast.error("Failed to load receipt details");
        } finally {
            setModalLoading(false);
        }
    };

    const handleUpdate = async () => {
        if (!selectedReceipt?.id) return;

        try {
            const payload = {
                amount: formData.amount,
                transactionID: formData.transactionID,
                date: formData.date,
                note: formData.note,
            };

            const resp = await axios.put(
                `${import.meta.env.VITE_APP_KEY}refund/receipts/${selectedReceipt.id}/`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (resp.status === 200 || resp.status === 204) {

                // ---------------- CREATE DATALOG ----------------
                const afterSnapshot = pickFields({
                    refund_no: formData.refund_no,
                    ...payload,
                });

                const { before_data, after_data } = computeDiff(
                    beforeSnapshot,
                    afterSnapshot
                );

                if (Object.keys(before_data).length > 0) {
                    await axios.post(
                        `${import.meta.env.VITE_APP_KEY}datalog/create/`,
                        {
                            before_data,
                            after_data,
                            reference_type: "REFUND_RECEIPT",
                            reference_no: formData.refund_no,
                        },
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                                "Content-Type": "application/json",
                            },
                        }
                    );
                }

                toast.success("Refund receipt updated successfully");
                setModalOpen(false);
                fetchRefundReceipts();
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to update refund receipt");
        }
    };

    const handleChange = (e) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    /*  SEARCH + PAGINATION */
    const filteredReceipts = receipts.filter(item =>
        (item.refund_no || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.customer_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.bank_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.transactionID || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.created_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.note || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(item.amount || "").includes(searchTerm)
    );

    const indexOfLastItem = currentPage * perPageData;
    const indexOfFirstItem = indexOfLastItem - perPageData;
    const currentReceipts = filteredReceipts.slice(indexOfFirstItem, indexOfLastItem);

    /* ----------------------------------
       UI
    ---------------------------------- */
    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <Breadcrumbs title="PAYMENTS" breadcrumbItem="REFUND RECEIPTS" />

                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <CardTitle className="mb-4">REFUND RECEIPTS</CardTitle>

                                    <Row className="mb-3">
                                        <Col md={4}>
                                            <Label>Search</Label>
                                            <Input
                                                placeholder="Search by Refund No, Customer, Bank, Amount..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </Col>
                                    </Row>

                                    {loading ? (
                                        <Spinner color="primary" />
                                    ) : (
                                        <>
                                            <Table bordered responsive hover striped>
                                                <thead className="thead-dark">
                                                    <tr>
                                                        <th>#</th>
                                                        <th>Refund No</th>
                                                        <th>Amount</th>
                                                        <th>Transaction ID</th>
                                                        <th>Date</th>
                                                        <th>Customer</th>
                                                        <th>Bank</th>
                                                        <th>Created By</th>
                                                        <th>Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {currentReceipts.map((item, index) => (
                                                        <tr key={item.id}>
                                                            <td>{indexOfFirstItem + index + 1}</td>
                                                            <td>{item.refund_no}</td>
                                                            <td>{item.amount}</td>
                                                            <td>{item.transactionID}</td>
                                                            <td>{item.date}</td>
                                                            <td>{item.customer_name}</td>
                                                            <td>{item.bank_name}</td>
                                                            <td>{item.created_name}</td>
                                                            <td>
                                                                <Button
                                                                    size="sm"
                                                                    color="primary"
                                                                    onClick={() => handleView(item.id)}
                                                                >
                                                                    View
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </Table>

                                            <Paginations
                                                perPageData={perPageData}
                                                data={filteredReceipts}
                                                currentPage={currentPage}
                                                setCurrentPage={setCurrentPage}
                                                paginationClass="pagination-rounded"
                                                indexOfFirstItem={indexOfFirstItem}
                                                indexOfLastItem={indexOfLastItem}
                                            />
                                        </>
                                    )}

                                    {/* ---------------- MODAL ---------------- */}
                                    <Modal isOpen={modalOpen} toggle={() => setModalOpen(!modalOpen)} size="lg">
                                        <ModalHeader toggle={() => setModalOpen(!modalOpen)}>
                                            Refund Receipt Details
                                        </ModalHeader>

                                        <ModalBody>
                                            {modalLoading ? (
                                                <Spinner />
                                            ) : (
                                                <>
                                                    <Row>
                                                        <Col md={4}>
                                                            <Label>Refund No</Label>
                                                            <Input value={formData.refund_no} disabled />
                                                        </Col>
                                                        <Col md={4}>
                                                            <Label>Customer</Label>
                                                            <Input value={formData.customer_name} disabled />
                                                        </Col>
                                                        <Col md={4}>
                                                            <Label>Bank</Label>
                                                            <Input value={formData.bank_name} disabled />
                                                        </Col>
                                                    </Row>

                                                    <Row className="mt-3">
                                                        <Col md={4}>
                                                            <Label>Amount</Label>
                                                            <Input
                                                                type="number"
                                                                name="amount"
                                                                value={formData.amount}
                                                                onChange={handleChange}
                                                            />
                                                        </Col>
                                                        <Col md={4}>
                                                            <Label>Transaction ID</Label>
                                                            <Input
                                                                name="transactionID"
                                                                value={formData.transactionID}
                                                                onChange={handleChange}
                                                            />
                                                        </Col>
                                                        <Col md={4}>
                                                            <Label>Date</Label>
                                                            <Input
                                                                type="date"
                                                                name="date"
                                                                value={formData.date}
                                                                onChange={handleChange}
                                                            />
                                                        </Col>
                                                    </Row>

                                                    <Row className="mt-3">
                                                        <Col md={12}>
                                                            <Label>Note</Label>
                                                            <Input
                                                                name="note"
                                                                value={formData.note}
                                                                onChange={handleChange}
                                                            />
                                                        </Col>
                                                    </Row>
                                                </>
                                            )}
                                        </ModalBody>

                                        <ModalFooter>
                                            <Button color="primary" onClick={handleUpdate}>
                                                Update
                                            </Button>
                                            <Button color="secondary" onClick={() => setModalOpen(false)}>
                                                Cancel
                                            </Button>
                                        </ModalFooter>
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

export default RefundReceiptList;
