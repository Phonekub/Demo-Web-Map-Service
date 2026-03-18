import React, { useState } from 'react';
import { HoverDropdown } from './HoverDropdown';
import type { DropdownOption } from './HoverDropdown';

export const HoverDropdownExample: React.FC = () => {
  const [basicValue, setBasicValue] = useState('');
  const [countryValue, setCountryValue] = useState('');
  const [skillsValues, setSkillsValues] = useState<string[]>([]);
  const [categoryValue, setCategoryValue] = useState('');

  // Basic options
  const basicOptions: DropdownOption[] = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3', disabled: true },
    { value: 'option4', label: 'Option 4' },
  ];

  // Country options with icons and descriptions
  const countryOptions: DropdownOption[] = [
    {
      value: 'th',
      label: 'Thailand',
      icon: <span className="text-lg">🇹🇭</span>,
      description: 'Southeast Asian country',
    },
    {
      value: 'sg',
      label: 'Singapore',
      icon: <span className="text-lg">🇸🇬</span>,
      description: 'City-state in Southeast Asia',
    },
    {
      value: 'jp',
      label: 'Japan',
      icon: <span className="text-lg">🇯🇵</span>,
      description: 'Island country in East Asia',
    },
    {
      value: 'kr',
      label: 'South Korea',
      icon: <span className="text-lg">🇰🇷</span>,
      description: 'Country in East Asia',
    },
    {
      value: 'us',
      label: 'United States',
      icon: <span className="text-lg">🇺🇸</span>,
      description: 'North American country',
    },
    {
      value: 'uk',
      label: 'United Kingdom',
      icon: <span className="text-lg">🇬🇧</span>,
      description: 'European island country',
    },
  ];

  // Skills options for multiple selection
  const skillsOptions: DropdownOption[] = [
    {
      value: 'react',
      label: 'React',
      icon: <span className="text-blue-500">⚛️</span>,
      description: 'JavaScript library for building UIs',
    },
    {
      value: 'typescript',
      label: 'TypeScript',
      icon: <span className="text-blue-600">📘</span>,
      description: 'Typed superset of JavaScript',
    },
    {
      value: 'nodejs',
      label: 'Node.js',
      icon: <span className="text-green-600">🟢</span>,
      description: 'JavaScript runtime for server-side',
    },
    {
      value: 'python',
      label: 'Python',
      icon: <span className="text-yellow-500">🐍</span>,
      description: 'High-level programming language',
    },
    {
      value: 'docker',
      label: 'Docker',
      icon: <span className="text-blue-400">🐳</span>,
      description: 'Containerization platform',
    },
    {
      value: 'aws',
      label: 'AWS',
      icon: <span className="text-orange-500">☁️</span>,
      description: 'Amazon Web Services',
    },
  ];

  // Category options
  const categoryOptions: DropdownOption[] = [
    {
      value: 'tech',
      label: 'Technology',
      icon: <span className="text-blue-500">💻</span>,
    },
    {
      value: 'design',
      label: 'Design',
      icon: <span className="text-purple-500">🎨</span>,
    },
    {
      value: 'marketing',
      label: 'Marketing',
      icon: <span className="text-green-500">📈</span>,
    },
    {
      value: 'finance',
      label: 'Finance',
      icon: <span className="text-yellow-500">💰</span>,
    },
    {
      value: 'hr',
      label: 'Human Resources',
      icon: <span className="text-pink-500">👥</span>,
    },
  ];

  return (
    <div className="p-6 space-y-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">HoverDropdown Examples</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Basic Dropdown */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-semibold mb-4">Basic Dropdown</h3>
          <HoverDropdown
            options={basicOptions}
            value={basicValue}
            onChange={value => setBasicValue(value)}
            placeholder="Select an option..."
            hoverBehavior="all"
            tooltip="Basic dropdown with hover effects"
          />
          <p className="mt-2 text-sm text-gray-600">Selected: {basicValue || 'None'}</p>
        </div>

        {/* Country Dropdown with Search */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-semibold mb-4">Searchable Dropdown</h3>
          <HoverDropdown
            options={countryOptions}
            value={countryValue}
            onChange={value => setCountryValue(value)}
            placeholder="Search and select country..."
            hoverBehavior="highlight"
            searchable={true}
            showIcons={true}
            variant="primary"
            tooltip="Searchable dropdown with icons"
          />
          <p className="mt-2 text-sm text-gray-600">
            Selected:{' '}
            {countryOptions.find(opt => opt.value === countryValue)?.label || 'None'}
          </p>
        </div>

        {/* Multiple Selection Dropdown */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-semibold mb-4">Multiple Selection</h3>
          <HoverDropdown
            options={skillsOptions}
            multiple={true}
            selectedValues={skillsValues}
            onMultipleChange={values => setSkillsValues(values)}
            placeholder="Select your skills..."
            hoverBehavior="shadow"
            searchable={true}
            showIcons={true}
            variant="success"
            maxHeight="250px"
            tooltip="Multi-select with search"
          />
          <p className="mt-2 text-sm text-gray-600">
            Selected ({skillsValues.length}): {skillsValues.join(', ') || 'None'}
          </p>
        </div>

        {/* Hover to Open Dropdown */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-semibold mb-4">Open on Hover</h3>
          <HoverDropdown
            options={categoryOptions}
            value={categoryValue}
            onChange={value => setCategoryValue(value)}
            placeholder="Hover to open..."
            hoverBehavior="expand"
            openOnHover={true}
            hoverDelay={150}
            closeDelay={500}
            showIcons={true}
            variant="warning"
            tooltip="Opens automatically on hover"
          />
          <p className="mt-2 text-sm text-gray-600">
            Selected:{' '}
            {categoryOptions.find(opt => opt.value === categoryValue)?.label || 'None'}
          </p>
        </div>
      </div>

      {/* Advanced Examples */}
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h3 className="text-2xl font-semibold mb-6">Advanced Examples</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Large Size */}
          <div>
            <h4 className="font-medium mb-2">Large Size</h4>
            <HoverDropdown
              options={basicOptions}
              placeholder="Large dropdown..."
              size="lg"
              hoverBehavior="border"
              variant="primary"
            />
          </div>

          {/* Small Size */}
          <div>
            <h4 className="font-medium mb-2">Small Size</h4>
            <HoverDropdown
              options={basicOptions}
              placeholder="Small dropdown..."
              size="sm"
              hoverBehavior="highlight"
              variant="secondary"
            />
          </div>

          {/* Error Variant */}
          <div>
            <h4 className="font-medium mb-2">Error Variant</h4>
            <HoverDropdown
              options={basicOptions}
              placeholder="Error state..."
              variant="error"
              hoverBehavior="shadow"
              tooltip="This has an error style"
            />
          </div>
        </div>
      </div>

      {/* Different Hover Behaviors */}
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h3 className="text-2xl font-semibold mb-6">Hover Behaviors</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <h4 className="font-medium mb-2">Expand</h4>
            <HoverDropdown
              options={basicOptions.slice(0, 3)}
              placeholder="Hover to expand..."
              hoverBehavior="expand"
              variant="primary"
            />
          </div>

          <div>
            <h4 className="font-medium mb-2">Highlight</h4>
            <HoverDropdown
              options={basicOptions.slice(0, 3)}
              placeholder="Hover to highlight..."
              hoverBehavior="highlight"
              variant="secondary"
            />
          </div>

          <div>
            <h4 className="font-medium mb-2">Shadow</h4>
            <HoverDropdown
              options={basicOptions.slice(0, 3)}
              placeholder="Hover for shadow..."
              hoverBehavior="shadow"
              variant="success"
            />
          </div>

          <div>
            <h4 className="font-medium mb-2">Border</h4>
            <HoverDropdown
              options={basicOptions.slice(0, 3)}
              placeholder="Hover for border..."
              hoverBehavior="border"
              variant="warning"
            />
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-semibold mb-4">Current Selections</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Basic:</strong> {basicValue || 'Not selected'}
          </div>
          <div>
            <strong>Country:</strong>{' '}
            {countryOptions.find(opt => opt.value === countryValue)?.label ||
              'Not selected'}
          </div>
          <div>
            <strong>Skills:</strong>{' '}
            {skillsValues.length > 0 ? `${skillsValues.length} selected` : 'Not selected'}
          </div>
          <div>
            <strong>Category:</strong>{' '}
            {categoryOptions.find(opt => opt.value === categoryValue)?.label ||
              'Not selected'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HoverDropdownExample;
