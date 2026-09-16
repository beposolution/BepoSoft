import React, { useEffect, useState } from "react";
import axios from "axios";
import {
    Button,
    Card,
    CardBody,
    CardTitle,
    Col,
    Container,
    Input,
    Label,
    Row,
    Spinner,
} from "reactstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Select from "react-select";
import Breadcrumbs from "../../components/Common/Breadcrumb";

const StaffMonthlySalaryCalculation = () => {
    document.title = "Staff Monthly Salary Calculation | Beposoft";

    const token = localStorage.getItem("token");

    const [staffList, setStaffList] = useState([]);
    const [staffLoading, setStaffLoading] = useState(false);
    const [selectedStaffId, setSelectedStaffId] = useState("");

    const currentDate = new Date();

    const [selectedYear, setSelectedYear] = useState(
        String(currentDate.getFullYear())
    );

    const [selectedMonth, setSelectedMonth] = useState(
        String(currentDate.getMonth() + 1)
    );

    const [salaryData, setSalaryData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // ============================================================
    // MONTHLY SALARY FORM
    // ============================================================

    const [bonus, setBonus] = useState("");
    const [incentives, setIncentives] = useState("");
    const [lateComes, setLateComes] = useState("");
    const [fines, setFines] = useState("");
    const [note, setNote] = useState("");
    const [savingSalary, setSavingSalary] = useState(false);

    // ============================================================
    // EXISTING MONTHLY SALARY RECORD
    // ============================================================

    const [monthlySalaryId, setMonthlySalaryId] = useState(null);
    const [monthlySalaryLoading, setMonthlySalaryLoading] =
        useState(false);

    const months = [
        { value: "1", label: "January" },
        { value: "2", label: "February" },
        { value: "3", label: "March" },
        { value: "4", label: "April" },
        { value: "5", label: "May" },
        { value: "6", label: "June" },
        { value: "7", label: "July" },
        { value: "8", label: "August" },
        { value: "9", label: "September" },
        { value: "10", label: "October" },
        { value: "11", label: "November" },
        { value: "12", label: "December" },
    ];

    const currentYear = currentDate.getFullYear();

    const years = [];

    for (
        let year = currentYear - 10;
        year <= currentYear + 1;
        year++
    ) {
        years.push(year);
    }

    const formatCurrency = (value) => {
        const number = Number(value || 0);

        return number.toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    // ============================================================
    // RESET MONTHLY SALARY FORM
    // ============================================================

    const resetSalaryForm = () => {
        setMonthlySalaryId(null);
        setBonus("");
        setIncentives("");
        setLateComes("");
        setFines("");
        setNote("");
    };

    // ============================================================
    // POPULATE MONTHLY SALARY FORM
    // ============================================================

    const populateMonthlySalaryForm = (data) => {
        if (!data) {
            resetSalaryForm();
            return;
        }

        setMonthlySalaryId(data.id ?? null);

        setBonus(
            data.bonus !== null && data.bonus !== undefined
                ? String(data.bonus)
                : ""
        );

        setIncentives(
            data.incentives !== null &&
                data.incentives !== undefined
                ? String(data.incentives)
                : ""
        );

        setLateComes(
            data.late_comes !== null &&
                data.late_comes !== undefined
                ? String(data.late_comes)
                : ""
        );

        setFines(
            data.fines !== null && data.fines !== undefined
                ? String(data.fines)
                : ""
        );

        setNote(data.note || "");
    };

    // ============================================================
    // FETCH STAFF
    // ============================================================

    const fetchStaff = async () => {
        try {
            setStaffLoading(true);

            const baseUrl = import.meta.env.VITE_APP_KEY;

            const response = await axios.get(
                `${baseUrl}staffs/`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = response?.data?.data || [];

            setStaffList(
                Array.isArray(data) ? data : []
            );
        } catch (error) {
            console.error(
                "Error fetching staff:",
                error?.response?.data || error.message
            );

            toast.error(
                error?.response?.data?.message ||
                "Failed to fetch staff list."
            );

            setStaffList([]);
        } finally {
            setStaffLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchStaff();
        }
    }, [token]);

    // ============================================================
    // GET SAVED MONTHLY SALARY
    // FIRST GET LIST -> FIND RECORD -> GET USING ID
    // ============================================================

    const fetchSavedMonthlySalary = async (
        staffId,
        year,
        month
    ) => {
        try {
            setMonthlySalaryLoading(true);

            const baseUrl =
                import.meta.env.VITE_APP_KEY;

            // ----------------------------------------------------
            // GET MONTHLY SALARY LIST
            // ----------------------------------------------------

            const listResponse = await axios.get(
                `${baseUrl}staff/monthly/salary/`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                    params: {
                        staff_id: staffId,
                        year: year,
                        month: month,
                    },
                }
            );

            const records =
                listResponse?.data?.data || [];

            if (
                listResponse?.data?.status !== "success" ||
                !Array.isArray(records) ||
                records.length === 0
            ) {
                resetSalaryForm();
                return null;
            }

            // ----------------------------------------------------
            // SAFELY FIND EXACT STAFF + YEAR + MONTH
            // ----------------------------------------------------

            const exactRecord =
                records.find(
                    (item) =>
                        String(item.staff) ===
                        String(staffId) &&
                        Number(item.year) ===
                        Number(year) &&
                        Number(item.month) ===
                        Number(month)
                ) || records[0];

            const recordId = exactRecord?.id;

            if (!recordId) {
                resetSalaryForm();
                return null;
            }

            // ----------------------------------------------------
            // DETAIL GET USING MONTHLY SALARY ID
            // ----------------------------------------------------

            const detailResponse = await axios.get(
                `${baseUrl}staff/monthly/salary/${recordId}/`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                }
            );

            if (
                detailResponse?.data?.status ===
                "success" &&
                detailResponse?.data?.data
            ) {
                const savedData =
                    detailResponse.data.data;

                populateMonthlySalaryForm(
                    savedData
                );

                return savedData;
            }

            resetSalaryForm();

            return null;
        } catch (err) {
            console.error(
                "Saved monthly salary fetch error:",
                err?.response?.data ||
                err.message
            );

            // 404 means no saved monthly salary.
            // Keep form ready for new POST.
            if (err?.response?.status !== 404) {
                console.error(
                    "Unable to load saved monthly salary record."
                );
            }

            resetSalaryForm();

            return null;
        } finally {
            setMonthlySalaryLoading(false);
        }
    };

    // ============================================================
    // CALCULATE SALARY
    // ============================================================

    const calculateSalary = async () => {
        try {
            if (!selectedStaffId) {
                toast.error(
                    "Please select a staff member."
                );
                return;
            }

            if (!selectedYear) {
                toast.error(
                    "Please select a year."
                );
                return;
            }

            if (!selectedMonth) {
                toast.error(
                    "Please select a month."
                );
                return;
            }

            setLoading(true);
            setError("");
            setSalaryData(null);

            resetSalaryForm();

            const baseUrl =
                import.meta.env.VITE_APP_KEY;

            const response = await axios.get(
                `${baseUrl}staff/salary/calculate/`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                    params: {
                        staff_id: selectedStaffId,
                        year: selectedYear,
                        month: selectedMonth,
                    },
                }
            );

            if (
                response?.data?.status ===
                "success" &&
                response?.data?.data
            ) {
                setSalaryData(
                    response.data.data
                );

                // =================================================
                // LOAD EXISTING MONTHLY SALARY AFTER CALCULATION
                // =================================================

                await fetchSavedMonthlySalary(
                    selectedStaffId,
                    selectedYear,
                    selectedMonth
                );

                toast.success(
                    response?.data?.message ||
                    "Monthly salary calculated successfully."
                );
            } else {
                const message =
                    response?.data?.message ||
                    "Unable to calculate salary.";

                setError(message);
                toast.error(message);
            }
        } catch (err) {
            console.error(
                "Salary calculation error:",
                err?.response?.data ||
                err.message
            );

            const backendMessage =
                err?.response?.data?.message;

            const backendErrors =
                err?.response?.data?.errors;

            let message =
                backendMessage ||
                "Failed to calculate monthly salary.";

            if (
                backendErrors &&
                typeof backendErrors === "string"
            ) {
                message = backendErrors;
            }

            setError(message);
            setSalaryData(null);

            resetSalaryForm();

            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    // ============================================================
    // RESET FILTERS
    // ============================================================

    const resetFilters = () => {
        setSelectedStaffId("");

        setSelectedYear(
            String(new Date().getFullYear())
        );

        setSelectedMonth(
            String(new Date().getMonth() + 1)
        );

        setSalaryData(null);
        setError("");

        resetSalaryForm();
    };

    const selectedStaff = staffList.find(
        (staffItem) =>
            String(staffItem.id) ===
            String(selectedStaffId)
    );

    const staff = salaryData?.staff || {};
    const salary = salaryData?.salary || {};
    const attendance =
        salaryData?.attendance || {};
    const paidLeave =
        salaryData?.paid_leave || {};
    const deductions =
        salaryData?.deductions || {};

    // ============================================================
    // LATE COMES
    // 3 LATE COMES = 0.5 DAY
    // ============================================================

    const lateComeHalfDays =
        Math.floor(
            Number(lateComes || 0) / 3
        ) * 0.5;

    // ============================================================
    // FRONTEND FINAL SALARY CALCULATION
    // Base Payable Salary + Bonus + Incentives
    // - Late Come Salary Deduction - Fines
    // 3 Late Comes = 0.5 Day Salary
    // ============================================================

    const basePayableSalary = Number(
        salaryData?.payable_salary || 0
    );

    const bonusAmount = Number(bonus || 0);
    const incentiveAmount = Number(incentives || 0);
    const fineAmount = Number(fines || 0);

    const perDaySalary = Number(
        salary?.per_day_salary || 0
    );

    const lateComeSalaryDeduction =
        lateComeHalfDays * perDaySalary;

    const newlyCalculatedSalary =
        basePayableSalary +
        bonusAmount +
        incentiveAmount -
        lateComeSalaryDeduction -
        fineAmount;

    // ============================================================
    // SAVE / UPDATE MONTHLY SALARY
    // ============================================================

    const saveMonthlySalary = async () => {
        try {
            if (!salaryData) {
                toast.error(
                    "Please calculate salary first."
                );
                return;
            }

            if (!selectedStaffId) {
                toast.error(
                    "Please select a staff member."
                );
                return;
            }

            if (!selectedYear) {
                toast.error(
                    "Please select a year."
                );
                return;
            }

            if (!selectedMonth) {
                toast.error(
                    "Please select a month."
                );
                return;
            }

            const bonusValue =
                Number(bonus || 0);

            const incentiveValue =
                Number(incentives || 0);

            const lateComeValue =
                Number(lateComes || 0);

            const fineValue =
                Number(fines || 0);

            if (
                bonusValue < 0 ||
                incentiveValue < 0 ||
                fineValue < 0
            ) {
                toast.error(
                    "Bonus, incentives and fines cannot be negative."
                );
                return;
            }

            if (
                !Number.isInteger(lateComeValue) ||
                lateComeValue < 0
            ) {
                toast.error(
                    "Number of late comes must be a valid whole number."
                );
                return;
            }

            setSavingSalary(true);

            const baseUrl =
                import.meta.env.VITE_APP_KEY;

            const payload = {
                staff: Number(
                    selectedStaffId
                ),

                month: Number(
                    selectedMonth
                ),

                year: Number(
                    selectedYear
                ),

                present: Number(
                    attendance.present || 0
                ),

                absent: Number(
                    attendance.absent || 0
                ),

                half_day: Number(
                    attendance.half_day || 0
                ),

                paid_leaves: Number(
                    paidLeave.used || 0
                ),

                bonus: bonusValue,

                incentives: incentiveValue,

                late_comes: lateComeValue,

                fines: fineValue,

                note: note.trim(),
            };

            console.log(
                "MONTHLY SALARY PAYLOAD:",
                payload
            );

            console.log(
                "MONTHLY SALARY ID:",
                monthlySalaryId
            );

            let response;

            // ====================================================
            // PUT EXISTING MONTHLY SALARY
            // ====================================================

            if (monthlySalaryId) {
                response = await axios.put(
                    `${baseUrl}staff/monthly/salary/${monthlySalaryId}/`,
                    payload,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`,
                            "Content-Type":
                                "application/json",
                        },
                    }
                );
            }

            // ====================================================
            // POST NEW MONTHLY SALARY
            // ====================================================

            else {
                response = await axios.post(
                    `${baseUrl}staff/monthly/salary/`,
                    payload,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`,
                            "Content-Type":
                                "application/json",
                        },
                    }
                );
            }

            if (
                response?.data?.status ===
                "success"
            ) {
                toast.success(
                    response?.data?.message ||
                    (monthlySalaryId
                        ? "Monthly salary data updated successfully."
                        : "Monthly salary data saved successfully.")
                );

                // =================================================
                // GET SAVED DATA AGAIN
                // =================================================

                await fetchSavedMonthlySalary(
                    selectedStaffId,
                    selectedYear,
                    selectedMonth
                );
            } else {
                toast.error(
                    response?.data?.message ||
                    (monthlySalaryId
                        ? "Failed to update monthly salary data."
                        : "Failed to save monthly salary data.")
                );
            }
        } catch (err) {
            console.error(
                "Monthly salary save/update error:",
                err?.response?.data ||
                err.message
            );

            const responseData =
                err?.response?.data;

            let message =
                responseData?.message ||
                (monthlySalaryId
                    ? "Failed to update monthly salary data."
                    : "Failed to save monthly salary data.");

            const backendErrors =
                responseData?.errors;

            if (backendErrors) {
                if (
                    backendErrors?.message
                ) {
                    if (
                        Array.isArray(
                            backendErrors.message
                        )
                    ) {
                        message =
                            backendErrors.message[0];
                    } else {
                        message =
                            backendErrors.message;
                    }
                } else if (
                    typeof backendErrors ===
                    "string"
                ) {
                    message = backendErrors;
                } else {
                    const firstErrorKey =
                        Object.keys(
                            backendErrors
                        )[0];

                    if (firstErrorKey) {
                        const firstError =
                            backendErrors[
                            firstErrorKey
                            ];

                        if (
                            Array.isArray(
                                firstError
                            )
                        ) {
                            message =
                                firstError[0];
                        } else if (
                            typeof firstError ===
                            "string"
                        ) {
                            message =
                                firstError;
                        }
                    }
                }
            }

            toast.error(message);
        } finally {
            setSavingSalary(false);
        }
    };

    // ============================================================
    // STAFF OPTIONS
    // ============================================================

    const staffOptions =
        staffList.map((staffItem) => ({
            value: staffItem.id,

            label: `${staffItem.name || "-"} - ${staffItem.staff_id ||
                staffItem.eid ||
                `ID ${staffItem.id}`
                }`,

            staff: staffItem,
        }));

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <Breadcrumbs
                        title="Staff"
                        breadcrumbItem="Monthly Salary Calculation"
                    />

                    <ToastContainer />

                    {/* ===================================================== */}
                    {/* FILTER */}
                    {/* ===================================================== */}

                    <Card className="mb-4">
                        <CardBody>
                            <CardTitle className="mb-4">
                                Calculate Monthly Salary
                            </CardTitle>

                            <Row>
                                {/* STAFF */}

                                <Col
                                    lg={5}
                                    md={12}
                                    className="mb-3"
                                >
                                    <Label>
                                        Staff
                                    </Label>

                                    <Select
                                        options={
                                            staffOptions
                                        }
                                        value={
                                            staffOptions.find(
                                                (
                                                    option
                                                ) =>
                                                    String(
                                                        option.value
                                                    ) ===
                                                    String(
                                                        selectedStaffId
                                                    )
                                            ) ||
                                            null
                                        }
                                        onChange={(
                                            selectedOption
                                        ) => {
                                            setSelectedStaffId(
                                                selectedOption
                                                    ? selectedOption.value
                                                    : ""
                                            );

                                            setSalaryData(
                                                null
                                            );
                                            setError("");
                                            resetSalaryForm();
                                        }}
                                        placeholder={
                                            staffLoading
                                                ? "Loading Staff..."
                                                : "Search or Select Staff"
                                        }
                                        isSearchable
                                        isClearable
                                        isDisabled={
                                            staffLoading ||
                                            loading ||
                                            savingSalary ||
                                            monthlySalaryLoading
                                        }
                                        isLoading={
                                            staffLoading
                                        }
                                        noOptionsMessage={() =>
                                            "No staff found"
                                        }
                                        filterOption={(
                                            option,
                                            inputValue
                                        ) => {
                                            const search =
                                                inputValue
                                                    .toLowerCase()
                                                    .trim();

                                            const staffItem =
                                                option
                                                    .data
                                                    .staff;

                                            const searchableText =
                                                [
                                                    staffItem?.name,
                                                    staffItem?.staff_id,
                                                    staffItem?.eid,
                                                    staffItem?.department_name,
                                                    staffItem?.designation,
                                                ]
                                                    .filter(
                                                        Boolean
                                                    )
                                                    .join(
                                                        " "
                                                    )
                                                    .toLowerCase();

                                            return searchableText.includes(
                                                search
                                            );
                                        }}
                                        styles={{
                                            control: (
                                                base,
                                                state
                                            ) => ({
                                                ...base,

                                                minHeight:
                                                    "36px",

                                                borderColor:
                                                    state.isFocused
                                                        ? "#86b7fe"
                                                        : "#ced4da",

                                                boxShadow:
                                                    state.isFocused
                                                        ? "0 0 0 0.25rem rgba(13, 110, 253, 0.25)"
                                                        : "none",

                                                "&:hover":
                                                {
                                                    borderColor:
                                                        state.isFocused
                                                            ? "#86b7fe"
                                                            : "#ced4da",
                                                },
                                            }),

                                            menu: (
                                                base
                                            ) => ({
                                                ...base,
                                                zIndex: 9999,
                                            }),

                                            menuPortal: (
                                                base
                                            ) => ({
                                                ...base,
                                                zIndex: 9999,
                                            }),
                                        }}
                                        menuPortalTarget={
                                            document.body
                                        }
                                    />
                                </Col>

                                {/* YEAR */}

                                <Col
                                    lg={2}
                                    md={4}
                                    sm={6}
                                    className="mb-3"
                                >
                                    <Label>
                                        Year
                                    </Label>

                                    <Input
                                        type="select"
                                        value={
                                            selectedYear
                                        }
                                        onChange={(
                                            e
                                        ) => {
                                            setSelectedYear(
                                                e.target
                                                    .value
                                            );

                                            setSalaryData(
                                                null
                                            );

                                            setError("");

                                            resetSalaryForm();
                                        }}
                                        disabled={
                                            loading ||
                                            savingSalary ||
                                            monthlySalaryLoading
                                        }
                                    >
                                        {years.map(
                                            (year) => (
                                                <option
                                                    key={
                                                        year
                                                    }
                                                    value={
                                                        year
                                                    }
                                                >
                                                    {
                                                        year
                                                    }
                                                </option>
                                            )
                                        )}
                                    </Input>
                                </Col>

                                {/* MONTH */}

                                <Col
                                    lg={2}
                                    md={4}
                                    sm={6}
                                    className="mb-3"
                                >
                                    <Label>
                                        Month
                                    </Label>

                                    <Input
                                        type="select"
                                        value={
                                            selectedMonth
                                        }
                                        onChange={(
                                            e
                                        ) => {
                                            setSelectedMonth(
                                                e.target
                                                    .value
                                            );

                                            setSalaryData(
                                                null
                                            );

                                            setError("");

                                            resetSalaryForm();
                                        }}
                                        disabled={
                                            loading ||
                                            savingSalary ||
                                            monthlySalaryLoading
                                        }
                                    >
                                        {months.map(
                                            (month) => (
                                                <option
                                                    key={
                                                        month.value
                                                    }
                                                    value={
                                                        month.value
                                                    }
                                                >
                                                    {
                                                        month.label
                                                    }
                                                </option>
                                            )
                                        )}
                                    </Input>
                                </Col>

                                {/* BUTTONS */}

                                <Col
                                    lg={3}
                                    md={4}
                                    className="mb-3"
                                >
                                    <Label className="d-block">
                                        &nbsp;
                                    </Label>

                                    <div className="d-flex gap-2">
                                        <Button
                                            type="button"
                                            color="primary"
                                            onClick={
                                                calculateSalary
                                            }
                                            disabled={
                                                loading ||
                                                staffLoading ||
                                                savingSalary ||
                                                monthlySalaryLoading
                                            }
                                        >
                                            {loading ||
                                                monthlySalaryLoading ? (
                                                <>
                                                    <Spinner
                                                        size="sm"
                                                        className="me-2"
                                                    />

                                                    {loading
                                                        ? "Calculating..."
                                                        : "Loading..."}
                                                </>
                                            ) : (
                                                "Calculate Salary"
                                            )}
                                        </Button>

                                        <Button
                                            type="button"
                                            color="secondary"
                                            outline
                                            onClick={
                                                resetFilters
                                            }
                                            disabled={
                                                loading ||
                                                savingSalary ||
                                                monthlySalaryLoading
                                            }
                                        >
                                            Reset
                                        </Button>
                                    </div>
                                </Col>
                            </Row>

                            {/* SELECTED STAFF PREVIEW */}

                            {selectedStaff && (
                                <div className="mt-2 text-muted">
                                    Selected Staff:

                                    <strong className="ms-2 text-dark">
                                        {
                                            selectedStaff.name
                                        }
                                    </strong>

                                    {selectedStaff.designation && (
                                        <>
                                            {" | "}
                                            {
                                                selectedStaff.designation
                                            }
                                        </>
                                    )}
                                </div>
                            )}
                        </CardBody>
                    </Card>

                    {/* ===================================================== */}
                    {/* LOADING */}
                    {/* ===================================================== */}

                    {loading && (
                        <div
                            className="d-flex justify-content-center align-items-center"
                            style={{
                                minHeight:
                                    "250px",
                            }}
                        >
                            <Spinner color="primary" />

                            <span className="ms-2">
                                Calculating monthly
                                salary...
                            </span>
                        </div>
                    )}

                    {/* ===================================================== */}
                    {/* ERROR */}
                    {/* ===================================================== */}

                    {!loading && error && (
                        <div
                            className="alert alert-danger"
                            role="alert"
                        >
                            {error}
                        </div>
                    )}

                    {/* ===================================================== */}
                    {/* SALARY RESULT */}
                    {/* ===================================================== */}

                    {!loading &&
                        !error &&
                        salaryData && (
                            <>
                                {/* ========================================= */}
                                {/* STAFF DETAILS */}
                                {/* ========================================= */}

                                <Card className="mb-4">
                                    <CardBody>
                                        <CardTitle className="mb-4">
                                            Staff Details
                                        </CardTitle>

                                        <Row>
                                            <Col
                                                md={6}
                                                lg={3}
                                                className="mb-3"
                                            >
                                                <div className="text-muted">
                                                    Staff
                                                    Name
                                                </div>

                                                <strong>
                                                    {staff.name ||
                                                        "-"}
                                                </strong>
                                            </Col>

                                            <Col
                                                md={6}
                                                lg={3}
                                                className="mb-3"
                                            >
                                                <div className="text-muted">
                                                    Staff
                                                    ID
                                                </div>

                                                <strong>
                                                    {staff.staff_id ||
                                                        "-"}
                                                </strong>
                                            </Col>

                                            <Col
                                                md={6}
                                                lg={3}
                                                className="mb-3"
                                            >
                                                <div className="text-muted">
                                                    Designation
                                                </div>

                                                <strong>
                                                    {staff.designation ||
                                                        "-"}
                                                </strong>
                                            </Col>

                                            <Col
                                                md={6}
                                                lg={3}
                                            >
                                                <div className="text-muted">
                                                    EID
                                                </div>

                                                <strong>
                                                    {staff.eid ||
                                                        "-"}
                                                </strong>
                                            </Col>
                                        </Row>
                                    </CardBody>
                                </Card>

                                {/* ========================================= */}
                                {/* SALARY CARDS */}
                                {/* ========================================= */}

                                <Row className="mb-4">
                                    <Col
                                        xl={3}
                                        md={6}
                                        className="mb-3 mb-xl-0"
                                    >
                                        <Card className="h-100">
                                            <CardBody>
                                                <div className="text-muted mb-2">
                                                    Monthly
                                                    Salary
                                                </div>

                                                <h3 className="mb-0">
                                                    ₹
                                                    {formatCurrency(
                                                        salary.monthly_salary
                                                    )}
                                                </h3>
                                            </CardBody>
                                        </Card>
                                    </Col>

                                    <Col
                                        xl={3}
                                        md={6}
                                        className="mb-3 mb-xl-0"
                                    >
                                        <Card className="h-100">
                                            <CardBody>
                                                <div className="text-muted mb-2">
                                                    Payable
                                                    Salary
                                                </div>

                                                <h3 className="mb-0 text-success">
                                                    ₹
                                                    {formatCurrency(
                                                        salaryData.payable_salary
                                                    )}
                                                </h3>
                                            </CardBody>
                                        </Card>
                                    </Col>

                                    <Col
                                        xl={3}
                                        md={6}
                                        className="mb-3 mb-md-0"
                                    >
                                        <Card className="h-100">
                                            <CardBody>
                                                <div className="text-muted mb-2">
                                                    Per Day
                                                    Salary
                                                </div>

                                                <h3 className="mb-0">
                                                    ₹
                                                    {formatCurrency(
                                                        salary.per_day_salary
                                                    )}
                                                </h3>
                                            </CardBody>
                                        </Card>
                                    </Col>

                                    <Col
                                        xl={3}
                                        md={6}
                                    >
                                        <Card className="h-100">
                                            <CardBody>
                                                <div className="text-muted mb-2">
                                                    Salary
                                                    Calculation
                                                    Days
                                                </div>

                                                <h3 className="mb-0">
                                                    {salary.salary_calculation_days ??
                                                        "-"}
                                                </h3>
                                            </CardBody>
                                        </Card>
                                    </Col>
                                </Row>

                                {/* ========================================= */}
                                {/* ATTENDANCE DETAILS */}
                                {/* ========================================= */}

                                <Card className="mb-4">
                                    <CardBody>
                                        <CardTitle className="mb-4">
                                            Attendance
                                            Details
                                        </CardTitle>

                                        <Row>
                                            <Col
                                                xl={3}
                                                md={4}
                                                sm={6}
                                                className="mb-4"
                                            >
                                                <div className="text-muted mb-1">
                                                    Year
                                                </div>

                                                <h5 className="mb-0">
                                                    {attendance.year ??
                                                        "-"}
                                                </h5>
                                            </Col>

                                            <Col
                                                xl={3}
                                                md={4}
                                                sm={6}
                                                className="mb-4"
                                            >
                                                <div className="text-muted mb-1">
                                                    Month
                                                </div>

                                                <h5 className="mb-0">
                                                    {months.find(
                                                        (
                                                            item
                                                        ) =>
                                                            Number(
                                                                item.value
                                                            ) ===
                                                            Number(
                                                                attendance.month
                                                            )
                                                    )
                                                        ?.label ||
                                                        attendance.month ||
                                                        "-"}
                                                </h5>
                                            </Col>

                                            <Col
                                                xl={3}
                                                md={4}
                                                sm={6}
                                                className="mb-4"
                                            >
                                                <div className="text-muted mb-1">
                                                    Calendar
                                                    Days
                                                </div>

                                                <h5 className="mb-0">
                                                    {attendance.calendar_days ??
                                                        "-"}
                                                </h5>
                                            </Col>

                                            <Col
                                                xl={3}
                                                md={4}
                                                sm={6}
                                                className="mb-4"
                                            >
                                                <div className="text-muted mb-1">
                                                    Attendance
                                                    Records
                                                </div>

                                                <h5 className="mb-0">
                                                    {attendance.total_attendance_records ??
                                                        "0"}
                                                </h5>
                                            </Col>

                                            <Col
                                                xl={3}
                                                md={4}
                                                sm={6}
                                                className="mb-4 mb-xl-0"
                                            >
                                                <div className="text-muted mb-1">
                                                    Present
                                                </div>

                                                <h4 className="mb-0 text-success">
                                                    {attendance.present ??
                                                        "0"}
                                                </h4>
                                            </Col>

                                            <Col
                                                xl={3}
                                                md={4}
                                                sm={6}
                                                className="mb-4 mb-xl-0"
                                            >
                                                <div className="text-muted mb-1">
                                                    Absent
                                                </div>

                                                <h4 className="mb-0 text-danger">
                                                    {attendance.absent ??
                                                        "0"}
                                                </h4>
                                            </Col>

                                            <Col
                                                xl={3}
                                                md={4}
                                                sm={6}
                                                className="mb-4 mb-md-0"
                                            >
                                                <div className="text-muted mb-1">
                                                    Half
                                                    Day
                                                </div>

                                                <h4 className="mb-0 text-warning">
                                                    {attendance.half_day ??
                                                        "0"}
                                                </h4>
                                            </Col>

                                            <Col
                                                xl={3}
                                                md={4}
                                                sm={6}
                                            >
                                                <div className="text-muted mb-1">
                                                    Payable
                                                    Days
                                                </div>

                                                <h4 className="mb-0 text-primary">
                                                    {attendance.payable_days ??
                                                        "0"}
                                                </h4>
                                            </Col>
                                        </Row>
                                    </CardBody>
                                </Card>

                                {/* ========================================= */}
                                {/* PAID LEAVE */}
                                {/* ========================================= */}

                                <Card className="mb-4">
                                    <CardBody>
                                        <CardTitle className="mb-4">
                                            Paid Leave
                                            Details
                                        </CardTitle>

                                        <Row>
                                            <Col
                                                lg={3}
                                                md={6}
                                                className="mb-3 mb-lg-0"
                                            >
                                                <div className="text-muted mb-2">
                                                    Allowed
                                                </div>

                                                <h3 className="mb-0">
                                                    {paidLeave.allowed ??
                                                        "0"}
                                                </h3>
                                            </Col>

                                            <Col
                                                lg={3}
                                                md={6}
                                                className="mb-3 mb-lg-0"
                                            >
                                                <div className="text-muted mb-2">
                                                    Used
                                                </div>

                                                <h3 className="mb-0">
                                                    {paidLeave.used ??
                                                        "0"}
                                                </h3>
                                            </Col>

                                            <Col
                                                lg={3}
                                                md={6}
                                                className="mb-3 mb-md-0"
                                            >
                                                <div className="text-muted mb-2">
                                                    Remaining
                                                </div>

                                                <h3 className="mb-0">
                                                    {paidLeave.remaining ??
                                                        "0"}
                                                </h3>
                                            </Col>

                                            <Col
                                                lg={3}
                                                md={6}
                                            >
                                                <div className="text-muted mb-2">
                                                    Deductible
                                                    Absent
                                                    Days
                                                </div>

                                                <h3 className="mb-0">
                                                    {paidLeave.deductible_absent_days ??
                                                        "0"}
                                                </h3>
                                            </Col>
                                        </Row>
                                    </CardBody>
                                </Card>

                                {/* ========================================= */}
                                {/* SALARY DEDUCTIONS */}
                                {/* ========================================= */}

                                <Card className="mb-4">
                                    <CardBody>
                                        <CardTitle className="mb-4">
                                            Salary
                                            Deductions
                                        </CardTitle>

                                        <Row>
                                            <Col
                                                md={4}
                                                className="mb-3 mb-md-0"
                                            >
                                                <div className="text-muted mb-2">
                                                    Absent
                                                    Deduction
                                                </div>

                                                <h4 className="mb-0">
                                                    ₹
                                                    {formatCurrency(
                                                        deductions.absent_deduction
                                                    )}
                                                </h4>
                                            </Col>

                                            <Col
                                                md={4}
                                                className="mb-3 mb-md-0"
                                            >
                                                <div className="text-muted mb-2">
                                                    Half Day
                                                    Deduction
                                                </div>

                                                <h4 className="mb-0">
                                                    ₹
                                                    {formatCurrency(
                                                        deductions.half_day_deduction
                                                    )}
                                                </h4>
                                            </Col>

                                            <Col md={4}>
                                                <div className="text-muted mb-2">
                                                    Total
                                                    Deduction
                                                </div>

                                                <h4 className="mb-0 text-danger">
                                                    ₹
                                                    {formatCurrency(
                                                        deductions.total_deduction
                                                    )}
                                                </h4>
                                            </Col>
                                        </Row>
                                    </CardBody>
                                </Card>

                                <Card className="mb-4">
                                    <CardBody>
                                        <Row className="align-items-center">
                                            <Col
                                                lg={8}
                                                className="mb-3 mb-lg-0"
                                            >
                                                <CardTitle className="mb-2">
                                                    Final
                                                    Payable
                                                    Salary
                                                </CardTitle>

                                                <div className="text-muted">
                                                    Monthly
                                                    salary
                                                    after
                                                    attendance
                                                    and
                                                    applicable
                                                    deductions.
                                                </div>
                                            </Col>

                                            <Col
                                                lg={4}
                                                className="text-lg-end"
                                            >
                                                <div className="text-muted mb-1">
                                                    Payable
                                                    Salary
                                                </div>

                                                <div
                                                    className="text-success"
                                                    style={{
                                                        fontSize:
                                                            "36px",
                                                        fontWeight:
                                                            "700",
                                                    }}
                                                >
                                                    ₹
                                                    {formatCurrency(
                                                        salaryData.payable_salary
                                                    )}
                                                </div>
                                            </Col>
                                        </Row>
                                    </CardBody>
                                </Card>

                                <Card className="mb-4">
                                    <CardBody>
                                        <CardTitle className="mb-4">
                                            Monthly Salary
                                            Details
                                        </CardTitle>

                                        {/* EXISTING RECORD INDICATOR */}

                                        {monthlySalaryId && (
                                            <div className="alert alert-info py-2 mb-4">
                                                Existing
                                                monthly
                                                salary
                                                record
                                                loaded. You
                                                can update
                                                the values
                                                below.
                                            </div>
                                        )}

                                        <Row>
                                            {/* BONUS */}

                                            <Col
                                                lg={3}
                                                md={6}
                                                className="mb-3"
                                            >
                                                <Label>
                                                    Bonus
                                                </Label>

                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={
                                                        bonus
                                                    }
                                                    onChange={(
                                                        e
                                                    ) =>
                                                        setBonus(
                                                            e
                                                                .target
                                                                .value
                                                        )
                                                    }
                                                    placeholder="Enter bonus"
                                                    disabled={
                                                        savingSalary ||
                                                        monthlySalaryLoading
                                                    }
                                                />
                                            </Col>

                                            {/* INCENTIVES */}

                                            <Col
                                                lg={3}
                                                md={6}
                                                className="mb-3"
                                            >
                                                <Label>
                                                    Incentives
                                                </Label>

                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={
                                                        incentives
                                                    }
                                                    onChange={(
                                                        e
                                                    ) =>
                                                        setIncentives(
                                                            e
                                                                .target
                                                                .value
                                                        )
                                                    }
                                                    placeholder="Enter incentives"
                                                    disabled={
                                                        savingSalary ||
                                                        monthlySalaryLoading
                                                    }
                                                />
                                            </Col>

                                            {/* LATE COMES */}

                                            <Col
                                                lg={3}
                                                md={6}
                                                className="mb-3"
                                            >
                                                <Label>
                                                    Number of
                                                    Late Comes
                                                </Label>

                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="1"
                                                    value={
                                                        lateComes
                                                    }
                                                    onChange={(
                                                        e
                                                    ) =>
                                                        setLateComes(
                                                            e
                                                                .target
                                                                .value
                                                        )
                                                    }
                                                    placeholder="Enter late comes"
                                                    disabled={
                                                        savingSalary ||
                                                        monthlySalaryLoading
                                                    }
                                                />

                                                <div className="text-muted mt-1">
                                                    3 late
                                                    comes =
                                                    0.5 day
                                                    leave
                                                </div>

                                                {Number(
                                                    lateComes ||
                                                    0
                                                ) >= 3 && (
                                                        <div className="text-warning mt-1">
                                                            Late
                                                            Leave:{" "}
                                                            {
                                                                lateComeHalfDays
                                                            }{" "}
                                                            Day
                                                            {lateComeHalfDays !==
                                                                1
                                                                ? "s"
                                                                : ""}
                                                        </div>
                                                    )}
                                            </Col>

                                            {/* FINES */}

                                            <Col
                                                lg={3}
                                                md={6}
                                                className="mb-3"
                                            >
                                                <Label>
                                                    Fines
                                                </Label>

                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={
                                                        fines
                                                    }
                                                    onChange={(
                                                        e
                                                    ) =>
                                                        setFines(
                                                            e
                                                                .target
                                                                .value
                                                        )
                                                    }
                                                    placeholder="Enter fines"
                                                    disabled={
                                                        savingSalary ||
                                                        monthlySalaryLoading
                                                    }
                                                />
                                            </Col>

                                            {/* NOTE */}

                                            <Col
                                                md={12}
                                                className="mb-3"
                                            >
                                                <Label>
                                                    Note
                                                </Label>

                                                <Input
                                                    type="textarea"
                                                    rows="4"
                                                    value={
                                                        note
                                                    }
                                                    onChange={(
                                                        e
                                                    ) =>
                                                        setNote(
                                                            e
                                                                .target
                                                                .value
                                                        )
                                                    }
                                                    placeholder="Enter note"
                                                    disabled={
                                                        savingSalary ||
                                                        monthlySalaryLoading
                                                    }
                                                />
                                            </Col>

                                            {/* LATE COME SUMMARY */}

                                            <Col
                                                md={12}
                                                className="mb-3"
                                            >
                                                <div
                                                    className="p-3 border rounded"
                                                    style={{
                                                        backgroundColor:
                                                            "#f8f9fa",
                                                    }}
                                                >
                                                    <Row>
                                                        <Col
                                                            md={
                                                                6
                                                            }
                                                            className="mb-2 mb-md-0"
                                                        >
                                                            <div className="text-muted">
                                                                Number
                                                                of
                                                                Late
                                                                Comes
                                                            </div>

                                                            <strong>
                                                                {Number(
                                                                    lateComes ||
                                                                    0
                                                                )}
                                                            </strong>
                                                        </Col>

                                                        <Col
                                                            md={
                                                                6
                                                            }
                                                        >
                                                            <div className="text-muted">
                                                                Half
                                                                Day
                                                                Leave
                                                                from
                                                                Late
                                                                Comes
                                                            </div>

                                                            <strong className="text-warning">
                                                                {
                                                                    lateComeHalfDays
                                                                }
                                                            </strong>
                                                        </Col>
                                                    </Row>
                                                </div>
                                            </Col>

                                            {/* NEWLY CALCULATED SALARY */}

                                            <Col
                                                md={12}
                                                className="mb-3"
                                            >
                                                <div
                                                    className="p-3 border rounded"
                                                    style={{
                                                        backgroundColor:
                                                            "#f8f9fa",
                                                    }}
                                                >
                                                    <Row className="align-items-center">
                                                        <Col
                                                            lg={8}
                                                            className="mb-3 mb-lg-0"
                                                        >
                                                            <div
                                                                className="fw-semibold mb-1"
                                                                style={{
                                                                    fontSize:
                                                                        "16px",
                                                                }}
                                                            >
                                                                Newly Calculated Salary
                                                            </div>

                                                            <div className="text-muted">
                                                                Payable Salary + Bonus + Incentives - Late Come Deduction - Fines
                                                            </div>

                                                            <div className="text-muted mt-2">
                                                                ₹
                                                                {formatCurrency(
                                                                    basePayableSalary
                                                                )}{" "}
                                                                + ₹
                                                                {formatCurrency(
                                                                    bonusAmount
                                                                )}{" "}
                                                                + ₹
                                                                {formatCurrency(
                                                                    incentiveAmount
                                                                )}{" "}
                                                                - ₹
                                                                {formatCurrency(
                                                                    lateComeSalaryDeduction
                                                                )}{" "}
                                                                - ₹
                                                                {formatCurrency(
                                                                    fineAmount
                                                                )}
                                                            </div>
                                                        </Col>

                                                        <Col
                                                            lg={4}
                                                            className="text-lg-end"
                                                        >
                                                            <div className="text-muted mb-1">
                                                                Final Salary
                                                            </div>

                                                            <div
                                                                className="text-success"
                                                                style={{
                                                                    fontSize:
                                                                        "30px",
                                                                    fontWeight:
                                                                        "700",
                                                                }}
                                                            >
                                                                ₹
                                                                {formatCurrency(
                                                                    newlyCalculatedSalary
                                                                )}
                                                            </div>
                                                        </Col>
                                                    </Row>
                                                </div>
                                            </Col>

                                            {/* SAVE / UPDATE BUTTON */}

                                            <Col md={12}>
                                                <div className="d-flex justify-content-end">
                                                    <Button
                                                        type="button"
                                                        color={
                                                            monthlySalaryId
                                                                ? "primary"
                                                                : "success"
                                                        }
                                                        onClick={
                                                            saveMonthlySalary
                                                        }
                                                        disabled={
                                                            savingSalary ||
                                                            loading ||
                                                            monthlySalaryLoading
                                                        }
                                                    >
                                                        {savingSalary ? (
                                                            <>
                                                                <Spinner
                                                                    size="sm"
                                                                    className="me-2"
                                                                />

                                                                {monthlySalaryId
                                                                    ? "Updating..."
                                                                    : "Saving..."}
                                                            </>
                                                        ) : monthlySalaryId ? (
                                                            "Update Monthly Salary"
                                                        ) : (
                                                            "Save Monthly Salary"
                                                        )}
                                                    </Button>
                                                </div>
                                            </Col>
                                        </Row>
                                    </CardBody>
                                </Card>

                            </>
                        )}
                </Container>
            </div>
        </React.Fragment>
    );
};

export default StaffMonthlySalaryCalculation;