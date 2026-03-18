# Base Components

This directory contains reusable base components for the project. Below are examples of how to use each component.

## Button

```tsx
import { Button } from '../index';

const Example = () => {
  return <Button onClick={() => alert('Button clicked!')}>Click Me</Button>;
};
```

## Input

```tsx
import { Input } from '../index';

const Example = () => {
  const [value, setValue] = React.useState('');

  return (
    <Input
      type="text"
      placeholder="Enter text"
      value={value}
      onChange={e => setValue(e.target.value)}
    />
  );
};
```

## Select

```tsx
import { Select } from '../index';

const Example = () => {
  const [selected, setSelected] = React.useState('');

  const options = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
  ];

  return (
    <Select
      options={options}
      value={selected}
      onChange={e => setSelected(e.target.value)}
    />
  );
};
```
