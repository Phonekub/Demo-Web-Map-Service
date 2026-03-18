import React, { useState } from 'react';
import { HoverInput } from './HoverInput';

export const HoverInputExample: React.FC = () => {
  const [basicValue, setBasicValue] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [emailValue, setEmailValue] = useState('');
  const [numberValue, setNumberValue] = useState('');

  const handleBasicChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setBasicValue(e.target.value);
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setSearchValue(e.target.value);
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setEmailValue(e.target.value);
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setNumberValue(e.target.value);

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800 mb-8">HoverInput Examples</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Hover Input */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-3">Basic Hover Input</h3>
          <HoverInput
            placeholder="Hover me for effects..."
            value={basicValue}
            onChange={handleBasicChange}
            hoverBehavior="all"
            tooltip="This input responds to hover with all effects"
          />
        </div>

        {/* Search Input with Icon */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-3">Search Input</h3>
          <HoverInput
            type="search"
            placeholder="Search with hover icon..."
            value={searchValue}
            onChange={handleSearchChange}
            hoverBehavior="highlight"
            showClearOnHover={true}
            onClear={() => setSearchValue('')}
            tooltip="Search input with clear button on hover"
            hoverIcon={
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            }
          />
        </div>

        {/* Email Input */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-3">Email Input</h3>
          <HoverInput
            type="email"
            placeholder="Enter your email..."
            value={emailValue}
            onChange={handleEmailChange}
            hoverBehavior="border"
            variant="primary"
            size="lg"
            autoFocusOnHover={true}
            tooltip="Email input with auto-focus on hover"
            hoverIcon={
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                />
              </svg>
            }
          />
        </div>

        {/* Number Input */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-3">Number Input</h3>
          <HoverInput
            type="number"
            placeholder="Enter a number..."
            value={numberValue}
            onChange={handleNumberChange}
            hoverBehavior="expand"
            variant="success"
            size="sm"
            hoverDelay={100}
            tooltip="Number input with quick hover response"
          />
        </div>

        {/* Shadow Only */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-3">Shadow Effect Only</h3>
          <HoverInput
            placeholder="Shadow effect on hover..."
            hoverBehavior="shadow"
            variant="warning"
            tooltip="Only shadow effect on hover"
          />
        </div>

        {/* Expand Only */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-3">Scale Effect Only</h3>
          <HoverInput
            placeholder="Scale effect on hover..."
            hoverBehavior="expand"
            variant="error"
            tooltip="Only scale effect on hover"
          />
        </div>
      </div>

      {/* Advanced Example */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-semibold mb-4">Advanced Search Bar</h3>
        <div className="flex gap-4">
          <HoverInput
            type="search"
            placeholder="Advanced search with all features..."
            value={searchValue}
            onChange={handleSearchChange}
            hoverBehavior="all"
            showClearOnHover={true}
            onClear={() => setSearchValue('')}
            autoFocusOnHover={true}
            size="lg"
            variant="primary"
            className="flex-1"
            tooltip="Full-featured search input"
            hoverIcon={
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            }
          />
          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Search
          </button>
        </div>
      </div>

      {/* Values Display */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-3">Current Values</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Basic:</strong> {basicValue || 'empty'}
          </div>
          <div>
            <strong>Search:</strong> {searchValue || 'empty'}
          </div>
          <div>
            <strong>Email:</strong> {emailValue || 'empty'}
          </div>
          <div>
            <strong>Number:</strong> {numberValue || 'empty'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HoverInputExample;
