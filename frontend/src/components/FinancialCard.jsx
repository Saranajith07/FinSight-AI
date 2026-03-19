import React from "react";

const FinancialCard = ({
  icon,
  label,
  value,
  additionalContent,
  borderColor = "",
  bgColor = "bg-white",
}) => (
  <div
    className={`${bgColor} rounded-2xl p-5 shadow-sm border border-slate-100
     hover:shadow-md hover:border-slate-200/80 transition-all duration-200 ${borderColor}`}
  >
    <div className="text-sm font-medium text-gray-600 flex items-center gap-2">
      {icon}
      {label}
    </div>
    <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
    {additionalContent}
  </div>
);

export default FinancialCard;
