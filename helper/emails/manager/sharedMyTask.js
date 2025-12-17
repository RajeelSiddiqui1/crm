export const sharedMyTaskMailTemplate = (
  managerName,
  submissionTitle,
  sharedByName,
  submissionLink
) => {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
      <div style="max-width: 480px; margin: auto; background: #ffffff; padding: 25px; border-radius: 10px;">
        
        <h2 style="text-align: center; color: #333;">
          Submission Shared
        </h2>

        <p>Hi <b>${managerName}</b>,</p>

        <p>
          <b>${sharedByName}</b> has shared a submission with you.
        </p>

        <div style="
          font-size: 14px;
          text-align: center;
          font-weight: bold;
          margin: 25px 0;
          background: #f0f0f0;
          padding: 15px;
          border-radius: 8px;
        ">
          ${submissionTitle}
        </div>

        <div style="text-align: center; margin-top: 20px;">
          <a href="${submissionLink}" 
            style="
              background: #4a6cf7;
              color: white;
              padding: 12px 25px;
              border-radius: 6px;
              text-decoration: none;
              font-size: 14px;
            ">
            View Submission
          </a>
        </div>

        <p style="margin-top: 25px; font-size: 12px; color: #777; text-align:center;">
          If you have any questions, please contact the person who shared this submission.
        </p>
      </div>
    </div>
  `;
};
