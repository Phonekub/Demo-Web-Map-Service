interface ShapeSelectorProps {
  onShapeSelect: (shape: 'circle' | 'polygon' | 'rectangle' | 'ellipse') => void;
}

export const ShapeSelector = ({ onShapeSelect }: ShapeSelectorProps) => {
  return (
    <div className="absolute right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 flex gap-2 z-50">
      <button
        type="button"
        onClick={() => onShapeSelect('circle')}
        className="flex flex-col items-center justify-center p-3 hover:bg-blue-50 rounded-lg border-2 border-transparent hover:border-blue-500 transition-all"
        title="วาดวงกลม"
      >
        <svg className="w-8 h-8 text-blue-600" viewBox="0 0 24 24">
          <circle
            cx="12"
            cy="12"
            r="8"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
        <span className="text-xs mt-1">วงกลม</span>
      </button>

      <button
        type="button"
        onClick={() => onShapeSelect('polygon')}
        className="flex flex-col items-center justify-center p-3 hover:bg-green-50 rounded-lg border-2 border-transparent hover:border-green-500 transition-all"
        title="วาดรูปหลายเหลี่ยม"
      >
        <svg className="w-8 h-8 text-green-600" viewBox="0 0 24 24">
          <path
            d="M12 3 L20 9 L17 19 L7 19 L4 9 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
        <span className="text-xs mt-1">รูปหลายเหลี่ยม</span>
      </button>

      <button
        type="button"
        onClick={() => onShapeSelect('rectangle')}
        className="flex flex-col items-center justify-center p-3 hover:bg-purple-50 rounded-lg border-2 border-transparent hover:border-purple-500 transition-all"
        title="วาดสี่เหลี่ยม"
      >
        <svg className="w-8 h-8 text-purple-600" viewBox="0 0 24 24">
          <rect
            x="5"
            y="7"
            width="14"
            height="10"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
        <span className="text-xs mt-1">สี่เหลี่ยม</span>
      </button>

      <button
        type="button"
        onClick={() => onShapeSelect('ellipse')}
        className="flex flex-col items-center justify-center p-3 hover:bg-orange-50 rounded-lg border-2 border-transparent hover:border-orange-500 transition-all"
        title="วาดวงรี"
      >
        <svg className="w-8 h-8 text-orange-600" viewBox="0 0 24 24">
          <ellipse
            cx="12"
            cy="12"
            rx="8"
            ry="5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
        <span className="text-xs mt-1">วงรี</span>
      </button>
    </div>
  );
};
