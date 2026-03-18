import Input from './Input';

interface Props {
  title?: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  minDate?: string;
  maxDate?: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

const DatePicker = ({
  title,
  value,
  onChange,
  minDate,
  maxDate,
  disabled,
  placeholder = 'dd/mm/yyyy',
  className,
}: Props) => {
  const toInputFormat = (date: Date | null) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const toDisplayFormat = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  // ไอคอนปฏิทิน
  const CalendarIcon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-5 h-5 text-gray-500"
    >
      <path d="M12.75 12.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM7.5 15.75a.75.75 0 1 0 0-1.5 .75.75 0 0 0 0 1.5ZM8.25 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM9.75 15.75a.75.75 0 1 0 0-1.5 .75.75 0 0 0 0 1.5ZM10.5 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12 15.75a.75.75 0 1 0 0-1.5 .75.75 0 0 0 0 1.5ZM12.75 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM14.25 15.75a.75.75 0 1 0 0-1.5 .75.75 0 0 0 0 1.5ZM15 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM16.5 15.75a.75.75 0 1 0 0-1.5 .75.75 0 0 0 0 1.5ZM15 12.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM16.5 13.5a.75.75 0 1 0 0-1.5 .75.75 0 0 0 0 1.5Z" />
      <path
        fillRule="evenodd"
        d="M6.75 2.25A.75.75 0 0 1 7.5 3v1.5h9V3A.75.75 0 0 1 18 3v1.5h.75a3 3 0 0 1 3 3v11.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V7.5a3 3 0 0 1 3-3H6V3a.75.75 0 0 1 .75-.75Zm13.5 9a1.5 1.5 0 0 0-1.5-1.5H5.25a1.5 1.5 0 0 0-1.5 1.5v7.5a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5v-7.5Z"
        clipRule="evenodd"
      />
    </svg>
  );

  return (
    <div className={`relative w-full ${className}`}>
      <div className="relative z-0">
        <Input
          title={title}
          type="text"
          value={toDisplayFormat(value)}
          placeholder={placeholder}
          disabled={disabled}
          icon={CalendarIcon}
          iconPosition="right"
          readOnly
          className="bg-white w-full cursor-pointer"
          onChange={() => {}}
        />
      </div>

      <input
        type="date"
        className={`absolute inset-0 w-full h-full opacity-0 z-10 ${
          disabled ? 'cursor-not-allowed' : 'cursor-pointer'
        }`}
        value={toInputFormat(value)}
        min={minDate}
        max={maxDate}
        disabled={disabled}
        onClick={e => {
          if (!disabled) e.currentTarget.showPicker();
        }}
        onChange={e => {
          const val = e.target.value;
          onChange(val ? new Date(val) : null);
        }}
      />
    </div>
  );
};

export default DatePicker;
