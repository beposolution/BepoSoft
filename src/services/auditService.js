import axios from "axios";

const AUDIT_DEVICE_ID_KEY = "beposoft_web_device_id";

const PUBLIC_IP_URL = "https://api.ipify.org?format=json";

// ============================================================
// UUID / BROWSER INSTALLATION ID
// ============================================================

const generateUuid = () => {
    if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
    ) {
        return crypto.randomUUID();
    }

    // Fallback for older browsers.
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
        /[xy]/g,
        (char) => {
            const random = (Math.random() * 16) | 0;
            const value =
                char === "x"
                    ? random
                    : (random & 0x3) | 0x8;

            return value.toString(16);
        }
    );
};

const getDeviceId = () => {
    try {
        let deviceId =
            localStorage.getItem(AUDIT_DEVICE_ID_KEY);

        if (
            deviceId &&
            deviceId.trim().length > 0
        ) {
            return deviceId.trim();
        }

        deviceId =
            `beposoft_web_${generateUuid()}`;

        localStorage.setItem(
            AUDIT_DEVICE_ID_KEY,
            deviceId
        );

        return deviceId;
    } catch (error) {
        console.error(
            "AuditService device ID error:",
            error
        );

        return "unknown";
    }
};

// ============================================================
// PLATFORM
// ============================================================

const getPlatform = () => {
    try {
        const userAgent =
            navigator.userAgent || "";

        const platform =
            navigator.userAgentData?.platform ||
            navigator.platform ||
            "";

        if (/android/i.test(userAgent)) {
            return "android_web";
        }

        if (
            /iphone|ipad|ipod/i.test(userAgent)
        ) {
            return "ios_web";
        }

        if (
            /mac/i.test(platform) ||
            /macintosh/i.test(userAgent)
        ) {
            return "macos_web";
        }

        if (
            /win/i.test(platform) ||
            /windows/i.test(userAgent)
        ) {
            return "windows_web";
        }

        if (
            /linux/i.test(platform) ||
            /linux/i.test(userAgent)
        ) {
            return "linux_web";
        }

        return "web";
    } catch (error) {
        console.error(
            "AuditService platform error:",
            error
        );

        return "web";
    }
};

// ============================================================
// DEVICE / BROWSER NAME
// ============================================================

const getDeviceName = () => {
    try {
        const userAgent =
            navigator.userAgent || "";

        let browser = "Browser";

        if (
            /Edg\//i.test(userAgent)
        ) {
            browser = "Microsoft Edge";
        } else if (
            /Chrome\//i.test(userAgent) &&
            !/Edg\//i.test(userAgent)
        ) {
            browser = "Google Chrome";
        } else if (
            /Safari\//i.test(userAgent) &&
            !/Chrome\//i.test(userAgent)
        ) {
            browser = "Safari";
        } else if (
            /Firefox\//i.test(userAgent)
        ) {
            browser = "Mozilla Firefox";
        }

        let device = "Web Device";

        if (/iphone/i.test(userAgent)) {
            device = "iPhone";
        } else if (/ipad/i.test(userAgent)) {
            device = "iPad";
        } else if (/android/i.test(userAgent)) {
            device = "Android Device";
        } else if (
            /macintosh/i.test(userAgent)
        ) {
            device = "Mac";
        } else if (
            /windows/i.test(userAgent)
        ) {
            device = "Windows PC";
        } else if (
            /linux/i.test(userAgent)
        ) {
            device = "Linux PC";
        }

        return `${device} - ${browser}`;
    } catch (error) {
        console.error(
            "AuditService device name error:",
            error
        );

        return "Web Device";
    }
};

// ============================================================
// APP VERSION
// ============================================================

const getAppVersion = () => {
    try {
        return (
            import.meta.env.VITE_APP_VERSION ||
            "web"
        );
    } catch (error) {
        return "web";
    }
};

// ============================================================
// USER AGENT
// ============================================================

const getUserAgent = () => {
    try {
        return navigator.userAgent || null;
    } catch (error) {
        return null;
    }
};

// ============================================================
// PUBLIC IP
// ============================================================

const getPublicIpAddress = async () => {
    try {
        const response = await axios.get(
            PUBLIC_IP_URL,
            {
                timeout: 5000,
            }
        );

        const ip =
            response?.data?.ip;

        if (
            typeof ip === "string" &&
            ip.trim().length > 0
        ) {
            return ip.trim();
        }

        return null;
    } catch (error) {
        console.error(
            "AuditService public IP error:",
            error
        );

        return null;
    }
};

// ============================================================
// CURRENT BROWSER LOCATION
// ============================================================

const getCurrentPosition = () => {
    return new Promise((resolve) => {
        if (
            typeof navigator === "undefined" ||
            !navigator.geolocation
        ) {
            console.warn(
                "AuditService: browser geolocation unavailable."
            );

            resolve(null);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                console.log(
                    "AuditService location captured:",
                    {
                        latitude:
                            position.coords.latitude,
                        longitude:
                            position.coords.longitude,
                        accuracy:
                            position.coords.accuracy,
                        timestamp:
                            new Date(
                                position.timestamp
                            ).toISOString(),
                    }
                );

                resolve(position);
            },

            (error) => {
                const errorMessages = {
                    1: "Location permission denied",
                    2: "Location position unavailable",
                    3: "Location request timed out",
                };

                console.warn(
                    "AuditService location error:",
                    {
                        code: error.code,
                        message:
                            errorMessages[error.code] ||
                            error.message ||
                            "Unknown location error",
                        browserMessage:
                            error.message,
                        secureContext:
                            window.isSecureContext,
                        protocol:
                            window.location.protocol,
                        hostname:
                            window.location.hostname,
                    }
                );

                resolve(null);
            },

            {
                // More reliable on desktop browsers.
                enableHighAccuracy: false,

                // Give Windows/browser location service
                // enough time to resolve.
                timeout: 20000,

                // Accept a location obtained within
                // the previous 60 seconds.
                maximumAge: 60000,
            }
        );
    });
};

// ============================================================
// REVERSE GEOCODING
// ============================================================

const reverseGeocode = async (latitude, longitude) => {
    try {
        const response = await axios.get(
            "https://nominatim.openstreetmap.org/reverse",
            {
                params: {
                    format: "jsonv2",
                    lat: latitude,
                    lon: longitude,
                    addressdetails: 1,
                    zoom: 18,
                },

                headers: {
                    "Accept-Language": "en",
                },

                timeout: 10000,
            }
        );

        const data = response?.data ?? {};
        const address = data?.address ?? {};

        // --------------------------------------------------------
        // OSM/Nominatim address fields are not identical for every
        // location, so provide sensible fallbacks.
        // --------------------------------------------------------

        const street =
            address.road ??
            address.pedestrian ??
            address.footway ??
            address.residential ??
            null;

        const subLocality =
            address.neighbourhood ??
            address.suburb ??
            address.quarter ??
            null;

        const locality =
            address.city ??
            address.town ??
            address.village ??
            address.municipality ??
            address.hamlet ??
            null;

        const district =
            address.state_district ??
            address.county ??
            address.district ??
            null;

        const state =
            address.state ??
            null;

        const postalCode =
            address.postcode ??
            null;

        const country =
            address.country ??
            null;

        const countryCode =
            address.country_code
                ? address.country_code.toUpperCase()
                : null;

        const fallbackLocationName = [
            street,
            subLocality,
            locality,
            district,
            state,
            postalCode,
            country,
        ]
            .filter(Boolean)
            .join(", ");

        const locationName =
            data.display_name ??
            (fallbackLocationName || null);

        console.log(
            "AuditService reverse geocoding successful:",
            {
                location_name: locationName,
                street,
                sub_locality: subLocality,
                locality,
                district,
                state,
                postal_code: postalCode,
                country,
                country_code: countryCode,
            }
        );

        return {
            location_name: locationName,
            street: street,
            sub_locality: subLocality,
            locality: locality,
            district: district,
            state: state,
            postal_code: postalCode,
            country: country,
            country_code: countryCode,
        };
    } catch (error) {
        console.error(
            "AuditService reverse geocoding error:",
            error?.response?.data ||
            error?.message ||
            error
        );

        // Reverse geocoding must never prevent audit creation.
        return {
            location_name: null,
            street: null,
            sub_locality: null,
            locality: null,
            district: null,
            state: null,
            postal_code: null,
            country: null,
            country_code: null,
        };
    }
};

// ============================================================
// COLLECT AUDIT CONTEXT
// ============================================================

const collectAuditContext = async () => {
    try {
        // Static/network information can be collected in parallel.
        const [
            ipAddress,
            position,
        ] = await Promise.all([
            getPublicIpAddress(),
            getCurrentPosition(),
        ]);

        let locationData = {};

        if (position) {
            locationData =
                await reverseGeocode(
                    position.coords.latitude,
                    position.coords.longitude
                );
        }

        return {
            ip_address:
                ipAddress,

            user_agent:
                getUserAgent(),

            device_id:
                getDeviceId(),

            device_name:
                getDeviceName(),

            platform:
                getPlatform(),

            app_version:
                getAppVersion(),

            latitude:
                position
                    ? position.coords.latitude
                    : null,

            longitude:
                position
                    ? position.coords.longitude
                    : null,

            location_accuracy:
                position
                    ? position.coords.accuracy
                    : null,

            location_captured_at:
                position
                    ? new Date(
                        position.timestamp
                    ).toISOString()
                    : null,

            location_name:
                locationData.location_name ??
                null,

            street:
                locationData.street ??
                null,

            sub_locality:
                locationData.sub_locality ??
                null,

            locality:
                locationData.locality ??
                null,

            district:
                locationData.district ??
                null,

            state:
                locationData.state ??
                null,

            postal_code:
                locationData.postal_code ??
                null,

            country:
                locationData.country ??
                null,

            country_code:
                locationData.country_code ??
                null,
        };
    } catch (error) {
        console.error(
            "AuditService context collection error:",
            error
        );

        return {};
    }
};

// ============================================================
// REMOVE NULL / UNDEFINED TOP-LEVEL VALUES
// ============================================================

const removeNullValues = (payload) => {
    return Object.fromEntries(
        Object.entries(payload).filter(
            ([key, value]) => {
                if (
                    key === "before_data" ||
                    key === "after_data"
                ) {
                    return true;
                }

                return (
                    value !== null &&
                    value !== undefined
                );
            }
        )
    );
};

// ============================================================
// CREATE AUDIT LOG
// ============================================================

export const createAuditLog = async ({
    action,
    beforeData = {},
    afterData = {},
    orderId = null,
}) => {
    try {
        const token =
            localStorage.getItem("token");

        if (!token) {
            console.error(
                "AuditService: authentication token missing."
            );

            return false;
        }

        const auditContext =
            await collectAuditContext();

        const requestBody =
            removeNullValues({
                before_data: {
                    action,
                    ...beforeData,
                },

                after_data: {
                    action,
                    ...afterData,
                },

                ...auditContext,

                ...(orderId !== null
                    ? {
                        order: orderId,
                    }
                    : {}),
            });

        const response =
            await axios.post(
                `${import.meta.env
                    .VITE_APP_KEY
                }datalog/create/`,
                requestBody,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`,

                        "Content-Type":
                            "application/json",
                    },

                    timeout: 15000,
                }
            );

        if (response.status === 201) {
            console.log(
                `AuditService: ${action} logged successfully.`
            );

            return true;
        }

        console.error(
            "AuditService unexpected status:",
            response.status
        );

        return false;
    } catch (error) {
        console.error(
            "AuditService log creation failed:",
            error?.response?.data ||
            error?.message ||
            error
        );

        return false;
    }
};

export default {
    createAuditLog,
};