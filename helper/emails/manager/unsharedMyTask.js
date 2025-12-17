export const unsharedMyTaskMailTemplate = (
  managerName,
  submissionTitle,
  removedByName
) => {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
      <div style="max-width: 480px; margin: auto; background: #ffffff; padding: 25px; border-radius: 10px;">
        
        <h2 style="text-align: center; color: #b91c1c;">
          Submission Access Removed
        </h2>

        <p>Hi <b>${managerName}</b>,</p>

        <p>
          Your access to the following submission has been removed by
          <b>${removedByName}</b>.
        </p>

        <div style="
          font-size: 14px;
          text-align: center;
          font-weight: bold;
          margin: 25px 0;
          background: #fef2f2;
          padding: 15px;
          border-radius: 8px;
          color: #7f1d1d;
        ">
          ${submissionTitle}
        </div>

        <p style="margin-top: 25px; font-size: 12px; color: #777; text-align:center;">
          If you believe this was a mistake, please contact the person who removed your access.
        </p>
      </div>
    </div>
  `;
};
