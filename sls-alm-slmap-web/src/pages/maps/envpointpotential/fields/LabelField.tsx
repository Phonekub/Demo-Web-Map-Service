import React from 'react';

interface LabelFieldProps {
  value: string;
}

const LabelField: React.FC<LabelFieldProps> = ({value }) => (
  <div className="mb-3 pr-2 pl-2">
    <h1 className="text-xl font-bold">{value}</h1>

  </div>
);

export default LabelField;
