# DatePicker Components

Two reusable date picker components for React Native applications.

## Components

### 1. DatePickerInput (Recommended)
A complete date picker input field with label, button, and modal.

#### Usage
```tsx
import { DatePickerInput } from '@/shared/components/DatePickerInput';

function MyScreen() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  return (
    <DatePickerInput
      label="Date of Birth"
      value={selectedDate}
      onChange={setSelectedDate}
      placeholder="Select your date of birth"
      maximumDate={new Date()}
      required={true}
      error={errors.dateOfBirth}
    />
  );
}
```

#### Props
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `label` | `string` | Yes | - | Label text for the input |
| `value` | `Date \| undefined` | Yes | - | Currently selected date |
| `onChange` | `(date: Date) => void` | Yes | - | Callback when date is selected |
| `placeholder` | `string` | No | 'Select date' | Placeholder text |
| `maximumDate` | `Date` | No | - | Maximum selectable date |
| `minimumDate` | `Date` | No | - | Minimum selectable date |
| `required` | `boolean` | No | `false` | Shows asterisk (*) if true |
| `error` | `string` | No | - | Error message to display |

---

### 2. DatePickerModal (Low-level)
Just the modal/picker component without the input field.

#### Usage
```tsx
import { DatePickerModal } from '@/shared/components/DatePickerModal';

function MyScreen() {
  const [showPicker, setShowPicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const handleConfirm = (date: Date) => {
    setSelectedDate(date);
    setShowPicker(false);
  };

  return (
    <>
      <TouchableOpacity onPress={() => setShowPicker(true)}>
        <Text>Select Date</Text>
      </TouchableOpacity>

      <DatePickerModal
        visible={showPicker}
        value={selectedDate}
        onConfirm={handleConfirm}
        onCancel={() => setShowPicker(false)}
        maximumDate={new Date()}
        title="Select Your Birthday"
      />
    </>
  );
}
```

#### Props
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `visible` | `boolean` | Yes | - | Controls modal visibility |
| `value` | `Date \| undefined` | Yes | - | Currently selected date |
| `onConfirm` | `(date: Date) => void` | Yes | - | Called when user confirms date |
| `onCancel` | `() => void` | Yes | - | Called when user cancels |
| `maximumDate` | `Date` | No | - | Maximum selectable date |
| `minimumDate` | `Date` | No | - | Minimum selectable date |
| `title` | `string` | No | 'Select Date' | Modal title |

## Platform Differences

### Android
- Uses native Android date picker dialog
- Shows as a system modal automatically
- Calendar view by default

### iOS
- Uses custom modal with spinner picker
- Shows with slide animation
- Includes Cancel and Done buttons

## Examples

### Basic Date of Birth Picker
```tsx
<DatePickerInput
  label="Date of Birth"
  value={dateOfBirth}
  onChange={setDateOfBirth}
  maximumDate={new Date()}
/>
```

### Date Picker with Validation
```tsx
<DatePickerInput
  label="Start Date"
  value={startDate}
  onChange={setStartDate}
  required={true}
  error={errors.startDate}
  minimumDate={new Date()}
/>
```

### Custom Date Range
```tsx
<DatePickerInput
  label="Appointment Date"
  value={appointmentDate}
  onChange={setAppointmentDate}
  minimumDate={new Date()}
  maximumDate={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)} // 30 days from now
/>
```

## Styling

Both components use the app's theme system automatically. No additional styling is required, but you can wrap them in a View with custom styles if needed.

## Dependencies

- `@react-native-community/datetimepicker` - Already installed
- `@expo/vector-icons` - Already installed
- Theme system from `@/theme`

