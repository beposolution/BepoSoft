import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import PropTypes from "prop-types";
import {
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from "reactstrap";

//i18n
import { withTranslation } from "react-i18next";

// Redux
import { connect } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import withRouter from "../../Common/withRouter";

// users
import user1 from "../../../assets/images/users/avatar-1.jpg";


const ProfileMenu = (props) => {
  const [menu, setMenu] = useState(false);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const BASE_URL = import.meta.env.VITE_APP_KEY;

  const [userImage, setUserImage] = useState(null);
  const [loading, setLoading] = useState(true);

  const username = localStorage.getItem('name')


  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${BASE_URL}profile/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const imagePath = res?.data?.data?.image;

        if (imagePath) {
          const fullImageUrl = imagePath.startsWith("http")
            ? imagePath
            : `${BASE_URL.replace("/api/", "")}${imagePath}`;

          setUserImage(fullImageUrl);
        }
      } catch (error) {
        toast.error("Failed to load profile");
      }
    };

    if (token) {
      fetchProfile();
    }
  }, [BASE_URL, token]);


  const logout = (event) => {
    event.preventDefault();
    localStorage.removeItem('token')
    navigate('/login')
    window.location.reload();
  }

  useEffect(() => {
    if (localStorage.getItem("authUser")) {
      if (import.meta.env.VITE_APP_DEFAULTAUTH === "firebase") {
        const obj = JSON.parse(localStorage.getItem("authUser"));
        setusername(obj.email);
      } else if (
        import.meta.env.VITE_APP_DEFAULTAUTH === "fake" ||
        import.meta.env.VITE_APP_DEFAULTAUTH === "jwt"
      ) {
        const obj = JSON.parse(localStorage.getItem("authUser"));
        setusername(obj.username);
      }
    }
  }, [props.success]);

  return (
    <React.Fragment>
      <Dropdown
        isOpen={menu}
        toggle={() => setMenu(!menu)}
        className="d-inline-block"
      >
        <DropdownToggle
          className="btn header-item"
          id="page-header-user-dropdown"
          tag="button"
        >
          <img
            className="rounded-circle header-profile-user"
            src={userImage || user1}
            alt="Header Avatar"
            style={{ cursor: "pointer" }}
            onClick={(e) => {
              e.stopPropagation(); // Prevents opening the dropdown
              navigate("/my/profile/");
            }}
            onError={(e) => {
              e.currentTarget.src = user1;
            }}
          />

          <span className="d-none d-xl-inline-block ms-2 me-1">
            {username}
          </span>

          <i className="mdi mdi-chevron-down d-none d-xl-inline-block" />
        </DropdownToggle>
        <DropdownMenu className="dropdown-menu-end">
          <Link onClick={logout} className="dropdown-item">
            <i className="bx bx-power-off font-size-16 align-middle me-1 text-danger" />
            <span>{props.t("Logout")}</span>
          </Link>
        </DropdownMenu>
      </Dropdown>
    </React.Fragment>
  );
};

ProfileMenu.propTypes = {
  success: PropTypes.any,
  t: PropTypes.any,
};

const mapStatetoProps = (state) => {
  const { error, success } = state.Profile;
  return { error, success };
};

export default withRouter(
  connect(mapStatetoProps, {})(withTranslation()(ProfileMenu))
);
