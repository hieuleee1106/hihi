import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = async (options) => {
  if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_SENDER) {
    console.error("Lỗi cấu hình: Kiểm tra SENDGRID_API_KEY và SENDGRID_SENDER trong .env");
    throw new Error("Cấu hình email chưa đúng");
  }

  const msg = {
    to: options.email, // người nhận
    from: process.env.SENDGRID_SENDER, // email đã verify
    subject: options.subject,
    html: options.html,
  };

  try {
    const info = await sgMail.send(msg);
    console.log("Email sent successfully:", info);
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Không thể gửi email, vui lòng thử lại sau.");
  }
};

export default sendEmail;
