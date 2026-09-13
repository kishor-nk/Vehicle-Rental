const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

function formatDate(date) {
    if (!date) return "";

    return new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "UTC"
    });
}

function bookingHtml({
    title,
    intro,
    booking,
    statusText
}) {
    return `
    <div style="font-family:Arial,sans-serif;background:#f6f6f7;padding:30px;color:#202020">
        <div style="max-width:620px;margin:auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #eeeeee">

            <div style="padding:24px 28px;background:#171717;color:#ffffff">
                <div style="font-size:24px;font-weight:800">
                    Drive<span style="color:#ff5a36">Ease</span>
                </div>

                <div style="margin-top:5px;font-size:12px;color:#bdbdbd">
                    Vehicle Rental
                </div>
            </div>

            <div style="padding:30px 28px">

                <div style="font-size:12px;color:#ff5a36;font-weight:800;letter-spacing:1.5px">
                    ${statusText}
                </div>

                <h1 style="margin:8px 0 12px;font-size:26px;color:#171717">
                    ${title}
                </h1>

                <p style="margin:0 0 24px;color:#666;line-height:1.7">
                    ${intro}
                </p>

                <div style="background:#f8f8f9;border-radius:12px;padding:20px">

                    <div style="font-size:18px;font-weight:800;margin-bottom:15px">
                        ${booking.vehicle_name}
                    </div>

                    <div style="margin:8px 0;color:#666">
                        <strong style="color:#222">Booking ID:</strong>
                        #${booking.id}
                    </div>

                    <div style="margin:8px 0;color:#666">
                        <strong style="color:#222">Pickup:</strong>
                        ${formatDate(booking.start_date)}
                    </div>

                    <div style="margin:8px 0;color:#666">
                        <strong style="color:#222">Return:</strong>
                        ${formatDate(booking.end_date)}
                    </div>

                    <div style="margin:8px 0;color:#666">
                        <strong style="color:#222">Pickup Location:</strong>
                        ${booking.pickup_location}
                    </div>

                    <div style="margin:8px 0;color:#666">
                        <strong style="color:#222">Total:</strong>
                        ₹${Number(booking.total_price).toLocaleString("en-IN")}
                    </div>

                    <div style="margin:8px 0;color:#666">
                        <strong style="color:#222">Status:</strong>
                        ${booking.status}
                    </div>

                </div>

                <p style="margin:24px 0 0;color:#888;font-size:12px;line-height:1.6">
                    Thank you for choosing DriveEase. Please keep your booking ID for future reference.
                </p>

            </div>
        </div>
    </div>
    `;
}

async function sendEmail({ to, subject, html }) {
    const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.SMTP_USER,
        to,
        subject,
        html
    });

    console.log("Email sent:", info.messageId);

    return true;
}

async function sendBookingConfirmation(booking) {
    return sendEmail({
        to: booking.user_email,
        subject: `DriveEase Booking Confirmed - #${booking.id}`,
        html: bookingHtml({
            title: "Booking Confirmed 🎉",
            intro: `Hi ${booking.user_name}, your vehicle rental has been successfully confirmed.`,
            booking,
            statusText: "BOOKING CONFIRMED"
        })
    });
}

async function sendBookingCancellation(booking) {
    return sendEmail({
        to: booking.user_email,
        subject: `DriveEase Booking Cancelled - #${booking.id}`,
        html: bookingHtml({
            title: "Booking Cancelled",
            intro: `Hi ${booking.user_name}, your DriveEase booking has been cancelled successfully.`,
            booking,
            statusText: "BOOKING CANCELLED"
        })
    });
}

async function sendBookingStatusUpdate(booking) {
    return sendEmail({
        to: booking.user_email,
        subject: `DriveEase Booking Update - #${booking.id}`,
        html: bookingHtml({
            title: "Booking Status Updated",
            intro: `Hi ${booking.user_name}, the status of your DriveEase booking has been updated by our team.`,
            booking,
            statusText: "BOOKING UPDATE"
        })
    });
}

async function verifyEmailConfig() {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log("Email service is not configured.");
        return false;
    }

    try {
        await transporter.verify();

        console.log("Gmail email service configured successfully!");

        return true;
    } catch (error) {
        console.error("Gmail email service verification failed:");
        console.error(error.message);

        return false;
    }
}

module.exports = {
    sendBookingConfirmation,
    sendBookingCancellation,
    sendBookingStatusUpdate,
    verifyEmailConfig
};