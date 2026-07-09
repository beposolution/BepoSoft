import React, { useEffect, useState } from "react";
import axios from "axios";
import {
    Row,
    Col,
    Card,
    CardBody,
    CardTitle,
    Spinner,
    Badge,
} from "reactstrap";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import {
    FaUser,
    FaEnvelope,
    FaPhone,
    FaBirthdayCake,
    FaTint,
    FaVenusMars,
    FaHeart,
    FaBriefcase,
    FaIdCard,
    FaCalendarAlt,
    FaUsers,
    FaMapMarkerAlt,
    FaGlobe,
    FaGraduationCap,
    FaBuilding,
    FaCar,
    FaShieldAlt,
    FaHome,
    FaImage,
    FaFileAlt,
    FaLock,
    FaCheckCircle,
} from "react-icons/fa";

const MyProfile = () => {
    const token = localStorage.getItem("token");
    const BASE_URL = import.meta.env.VITE_APP_KEY;

    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await axios.get(`${BASE_URL}profile/`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                setUserProfile(res?.data?.data);
            } catch (error) {
                toast.error("Failed to load profile");
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [BASE_URL, token]);

    const getMediaUrl = (path) => {
        if (!path) return "";
        if (path.startsWith("http")) return path;
        return `${BASE_URL.replace("/api/", "")}${path}`;
    };

    const formatDate = (date) => {
        if (!date) return "-";
        return new Date(date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const showValue = (value) => {
        if (value === null || value === undefined || value === "") return "-";
        return value;
    };

    const FileLink = ({ path, label }) => {
        if (!path) return "-";

        return (
            <a href={getMediaUrl(path)} target="_blank" rel="noreferrer">
                View {label}
            </a>
        );
    };

    const InfoItem = ({ label, value, icon }) => (
        <Col lg={4} md={6} sm={12} className="mb-3">
            <div className="profile-info-box">
                <div className="profile-icon">{icon}</div>
                <div>
                    <small className="text-muted d-block mb-1">{label}</small>
                    <strong>{showValue(value)}</strong>
                </div>
            </div>
        </Col>
    );

    return (
        <React.Fragment>
            <ToastContainer />

            <div className="page-content">
                <div className="container-fluid">
                    <Breadcrumbs title="Profile" breadcrumbItem="My Profile" />

                    {loading ? (
                        <div className="text-center py-5">
                            <Spinner color="primary" />
                        </div>
                    ) : !userProfile ? (
                        <Card>
                            <CardBody className="text-center">
                                <h5>No profile data found</h5>
                            </CardBody>
                        </Card>
                    ) : (
                        <>
                            <Card className="shadow-sm border-0 profile-main-card">
                                <CardBody>
                                    <Row className="align-items-center">
                                        <Col md="auto" className="text-center mb-3 mb-md-0">
                                            <a
                                                href={getMediaUrl(userProfile.image)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                <img
                                                    src={
                                                        userProfile.image
                                                            ? getMediaUrl(userProfile.image)
                                                            : "/default-user.png"
                                                    }
                                                    alt="Profile"
                                                    className="profile-image"
                                                    onError={(e) => {
                                                        e.target.src = "/default-user.png";
                                                    }}
                                                    style={{ cursor: "pointer" }}
                                                />
                                            </a>
                                        </Col>

                                        <Col>
                                            <h4 className="mb-1">{showValue(userProfile.name)}</h4>
                                            <p className="text-muted mb-2">
                                                {showValue(userProfile.designation)}
                                            </p>

                                            <div className="d-flex flex-wrap gap-2">
                                                <Badge color="primary">
                                                    {showValue(userProfile.staff_id)}
                                                </Badge>

                                                <Badge
                                                    color={
                                                        userProfile.approval_status === "approved"
                                                            ? "success"
                                                            : "warning"
                                                    }
                                                >
                                                    {showValue(userProfile.approval_status)}
                                                </Badge>

                                                <Badge color="info">
                                                    {showValue(userProfile.employment_status)}
                                                </Badge>
                                            </div>
                                        </Col>
                                    </Row>
                                </CardBody>
                            </Card>

                            <Card className="shadow-sm border-0">
                                <CardBody>
                                    <CardTitle className="mb-4">Personal Information</CardTitle>
                                    <Row>
                                        <InfoItem label="Full Name" value={userProfile.name} icon={<FaUser />} />
                                        <InfoItem label="Username" value={userProfile.username} icon={<FaUser />} />
                                        <InfoItem label="Email" value={userProfile.email} icon={<FaEnvelope />} />
                                        <InfoItem label="Phone" value={userProfile.phone} icon={<FaPhone />} />
                                        <InfoItem label="Alternate Number" value={userProfile.alternate_number} icon={<FaPhone />} />
                                        <InfoItem label="Gender" value={userProfile.gender} icon={<FaVenusMars />} />
                                        <InfoItem label="Date of Birth" value={formatDate(userProfile.date_of_birth)} icon={<FaBirthdayCake />} />
                                        <InfoItem label="Blood Group" value={userProfile.blood_group} icon={<FaTint />} />
                                        <InfoItem label="Marital Status" value={userProfile.marital_status} icon={<FaHeart />} />
                                    </Row>
                                </CardBody>
                            </Card>

                            <Card className="shadow-sm border-0">
                                <CardBody>
                                    <CardTitle className="mb-4">Job Information</CardTitle>
                                    <Row>
                                        <InfoItem label="EID" value={userProfile.eid} icon={<FaIdCard />} />
                                        <InfoItem label="Staff ID" value={userProfile.staff_id} icon={<FaIdCard />} />
                                        <InfoItem label="Designation" value={userProfile.designation} icon={<FaBriefcase />} />
                                        <InfoItem label="Employment Status" value={userProfile.employment_status} icon={<FaBriefcase />} />
                                        <InfoItem label="Approval Status" value={userProfile.approval_status} icon={<FaCheckCircle />} />
                                        <InfoItem label="Family" value={userProfile.family_name} icon={<FaUsers />} />
                                        <InfoItem label="Join Date" value={formatDate(userProfile.join_date)} icon={<FaCalendarAlt />} />
                                        <InfoItem label="Confirmation Date" value={formatDate(userProfile.confirmation_date)} icon={<FaCalendarAlt />} />
                                        <InfoItem label="Termination Date" value={formatDate(userProfile.termination_date)} icon={<FaCalendarAlt />} />
                                        <InfoItem label="Manager" value={userProfile.is_manager ? "Yes" : "No"} icon={<FaUser />} />
                                        <InfoItem label="Employment Created At" value={formatDate(userProfile.created_at)} icon={<FaCalendarAlt />} />
                                        <InfoItem label="Last Updated At" value={formatDate(userProfile.updated_at)} icon={<FaCalendarAlt />} />
                                    </Row>
                                </CardBody>
                            </Card>

                            <Card className="shadow-sm border-0">
                                <CardBody>
                                    <CardTitle className="mb-4">Address Information</CardTitle>
                                    <Row>
                                        <InfoItem label="Address" value={userProfile.address} icon={<FaHome />} />
                                        <InfoItem label="Place" value={userProfile.place} icon={<FaMapMarkerAlt />} />
                                        <InfoItem label="State" value={userProfile.state} icon={<FaMapMarkerAlt />} />
                                        <InfoItem label="Country" value={userProfile.country} icon={<FaGlobe />} />
                                        <InfoItem label="Country Code" value={userProfile.country_code_name} icon={<FaGlobe />} />
                                    </Row>
                                </CardBody>
                            </Card>

                            <Card className="shadow-sm border-0">
                                <CardBody>
                                    <CardTitle className="mb-4">Education & Experience</CardTitle>
                                    <Row>
                                        <InfoItem label="Education" value={userProfile.education} icon={<FaGraduationCap />} />
                                        <InfoItem label="Experience" value={userProfile.experience ? `${userProfile.experience} Year` : "-"} icon={<FaBriefcase />} />
                                        <InfoItem label="Year Experience" value={userProfile.yr_experience} icon={<FaBriefcase />} />
                                        <InfoItem label="Previous Company" value={userProfile.previous_company} icon={<FaBuilding />} />
                                    </Row>
                                </CardBody>
                            </Card>

                            <Card className="shadow-sm border-0">
                                <CardBody>
                                    <CardTitle className="mb-4">Document Information</CardTitle>
                                    <Row>
                                        <InfoItem label="Aadhaar No" value={userProfile.aadhar_no} icon={<FaIdCard />} />
                                        <InfoItem label="Aadhaar Image" value={<FileLink path={userProfile.aadhar_image} label="Aadhaar" />} icon={<FaImage />} />
                                        <InfoItem label="PAN No" value={userProfile.pan_no} icon={<FaIdCard />} />
                                        <InfoItem label="PAN Image" value={<FileLink path={userProfile.pan_image} label="PAN" />} icon={<FaImage />} />
                                        <InfoItem label="Driving License" value={userProfile.driving_license} icon={<FaCar />} />
                                        <InfoItem label="License Expiry Date" value={formatDate(userProfile.driving_license_exp_date)} icon={<FaCalendarAlt />} />
                                        <InfoItem label="Experience Letter" value={<FileLink path={userProfile.exp_letter} label="Experience Letter" />} icon={<FaFileAlt />} />
                                        <InfoItem label="Salary Slip" value={<FileLink path={userProfile.salrary_slip} label="Salary Slip" />} icon={<FaFileAlt />} />
                                        <InfoItem label="Signature" value={<FileLink path={userProfile.signatur_up} label="Signature" />} icon={<FaImage />} />
                                    </Row>
                                </CardBody>
                            </Card>

                            <Card className="shadow-sm border-0">
                                <CardBody>
                                    <CardTitle className="mb-4">Emergency Contact</CardTitle>
                                    <Row>
                                        <InfoItem label="Emergency Contact Name" value={userProfile.emergency_contact_name} icon={<FaShieldAlt />} />
                                        <InfoItem label="Emergency Contact Number" value={userProfile.emergency_contact_number} icon={<FaPhone />} />
                                        <InfoItem label="Emergency Contact Name 2" value={userProfile.emergency_contact_name1} icon={<FaShieldAlt />} />
                                        <InfoItem label="Emergency Contact Number 2" value={userProfile.emergency_contact_number1} icon={<FaPhone />} />
                                    </Row>
                                </CardBody>
                            </Card>

                        </>
                    )}
                </div>
            </div>

            <style>{`
        .profile-main-card {
          background: linear-gradient(135deg, #ffffff, #f7fbff);
        }

        .profile-image {
          width: 130px;
          height: 130px;
          border-radius: 50%;
          object-fit: cover;
          border: 4px solid #f1f1f1;
        }

        .profile-info-box {
          background: #f8f9fa;
          border-radius: 12px;
          padding: 14px 16px;
          min-height: 82px;
          border: 1px solid #eeeeee;
          display: flex;
          align-items: flex-start;
          gap: 12px;
          transition: all 0.2s ease;
        }

        .profile-info-box:hover {
          background: #ffffff;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
          transform: translateY(-2px);
        }

        .profile-info-box strong {
          font-size: 14px;
          color: #333;
          word-break: break-word;
        }

        .profile-icon {
          width: 38px;
          height: 38px;
          min-width: 38px;
          border-radius: 10px;
          background: #e9f2ff;
          color: #0d6efd;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
        }
      `}</style>
        </React.Fragment>
    );
};

export default MyProfile;