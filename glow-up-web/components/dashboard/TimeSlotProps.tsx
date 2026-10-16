import React from "react";

interface TimeSlotProps {
  title?: string;
  color?: string;
  onClick?: () => void;
    className?: string;
}

const TimeSlot: React.FC<TimeSlotProps> = ({ title, color, onClick,className = "" }) => {
  return (
    <div
      onClick={onClick}
      className={`h-16 ${className} border-b border-gray-200 cursor-pointer relative hover:bg-gray-50 transition-all`}
    >
      {title && (
        <div
          className={`absolute top-1 left-1 right-1 bottom-1 p-1 text-xs rounded ${color}`}
        >
          {title}
        </div>
      )}
    </div>
  );
};

export default TimeSlot;
