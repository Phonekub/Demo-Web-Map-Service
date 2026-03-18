import React from 'react';

interface TimeRangeFieldProps {
  label?: string;
  value: { start: string; end: string };
  required?: boolean;
  onChange: (value: { start: string; end: string }, localErrorMsg?: string) => void;
  errorMsg?: string;
  showError?: boolean;
  disabled?: boolean;
}

const TimeRangeField: React.FC<TimeRangeFieldProps> = ({
  label,
  value,
  required = false,
  onChange,
  errorMsg,
  showError,
  disabled,
}) => {
  // Validation: end time must not be less than start time
  let localErrorMsg = errorMsg;
  if (value.start && value.end && value.end < value.start) {
    localErrorMsg = 'เวลาสิ้นสุดต้องมากกว่าหรือเท่ากับเวลาเริ่ม';
  }

  return (
    <div
      className={`flex flex-col gap-1 pr-2 pl-2${disabled ? ' opacity-50 pointer-events-none' : ''}`}
    >
      {label && (
        <label className="font-semibold mb-1 text-gray-500">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="flex gap-2 items-center">
        {/*
          <select
            className="select select-sm w-32"
            value={value.start}
            onChange={e => onChange({ ...value, start: e.target.value })}
          >
            <option value="">เลือกเวลาเริ่ม</option>
            {Array.from({ length: 23 }, (_, i) => i + 1).map(h => (
              <option key={h} value={h.toString().padStart(2, '0') + ':00'}>
                {h}:00
              </option>
            ))}
          </select>
          */}
        <input
          type="time"
          className="border rounded px-2 py-1 "
          value={value.start}
          onChange={e => {
            const newValue = { ...value, start: e.target.value };
            let err = errorMsg;
            if (newValue.start && newValue.end && newValue.end < newValue.start) {
              err = 'เวลาสิ้นสุดต้องมากกว่าหรือเท่ากับเวลาเริ่ม';
            }
            onChange(newValue, err);
          }}
        />
        <span>ถึง</span>
        {/*
          <select
            className="select select-sm w-32"
            value={value.end}
            onChange={e => onChange({ ...value, end: e.target.value })}
          >
            <option value="">เลือกเวลาสิ้นสุด</option>
            {Array.from({ length: 23 }, (_, i) => i + 1).map(h => (
              <option key={h} value={h.toString().padStart(2, '0') + ':00'}>
                {h}:00
              </option>
            ))}
          </select>
          */}
        <input
          type="time"
          className="border rounded px-2 py-1"
          value={value.end}
          onChange={e => {
            const newValue = { ...value, end: e.target.value };
            let err = errorMsg;
            if (newValue.start && newValue.end && newValue.end < newValue.start) {
              err = 'เวลาสิ้นสุดต้องมากกว่าหรือเท่ากับเวลาเริ่ม';
            }
            onChange(newValue, err);
          }}
        />
      </div>
      {showError && localErrorMsg && (
        <span className="text-red-500 text-xs">{localErrorMsg}</span>
      )}
    </div>
  );
};

export default TimeRangeField;
