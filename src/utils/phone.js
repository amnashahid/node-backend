
const normalizePakistaniPhone = (phone) => {
    if (!phone) {
        throw new Error("Phone number is required");
    }

    let value = phone.replace(/\s|-/g, "");

    if (/^03\d{9}$/.test(value)) {
        return `+92${value.substring(1)}`;
    }

    if (/^3\d{9}$/.test(value)) {
        return `+92${value}`;
    }

    if (/^\+923\d{9}$/.test(value)) {
        return value;
    }

    throw new Error("Invalid Pakistani phone number");
};

module.exports = {
    normalizePakistaniPhone
};