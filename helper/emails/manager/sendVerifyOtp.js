export function sendVerifyOtpTemplate(name, otp) {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
      <div style="max-width: 480px; margin: auto; background: #ffffff; padding: 25px; border-radius: 10px;">
        
        <h2 style="text-align: center; color: #333;">Email Verification</h2>
        <p>Hi <b>${name}</b>,</p>
        <p>Use the OTP below to verify your manager account:</p>

        <div style="
          font-size: 32px; 
          letter-spacing: 6px; 
          text-align: center; 
          font-weight: bold; 
          margin: 25px 0; 
          background: #f0f0f0; 
          padding: 15px; 
          border-radius: 8px;">
          ${otp}
        </div>

        <p style="text-align:center;">
          This OTP will expire in <b>10 minutes</b>.
        </p>

        <div style="text-align: center; margin-top: 20px;">
          <a href="https://mh-solutions-crm.vercel.app/manager-verified" 
            style="
              background: #4a6cf7;
              color: white;
              padding: 12px 25px;
              border-radius: 6px;
              text-decoration: none;
              font-size: 14px;">
            Verify Account
          </a>
        </div>

        <p style="margin-top: 25px; font-size: 12px; color: #777; text-align:center;">
          If you did not request this, you can ignore this email.
        </p>
      </div>
    </div>
  `;
}
