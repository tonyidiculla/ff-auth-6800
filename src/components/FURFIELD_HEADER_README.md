# FurfieldHeader Component

A unified header component for all Furfield applications with module switching capabilities.

## Features

- **Module Switcher**: Dropdown to switch between all Furfield services
- **Search Bar**: Optional search functionality
- **Notifications**: Bell icon with notification badge
- **User Menu**: User profile display with logout option
- **Responsive Design**: Clean, modern design matching the auth page aesthetic
- **Token Persistence**: Automatically carries auth token when switching modules

## Installation

### Option 1: Copy the Component
Copy `FurfieldHeader.tsx` to your project's components directory.

### Option 2: Import from Auth Repository
```tsx
// Add to your package.json dependencies
"@furfield/shared-components": "file:../ff-auth-6800/src/components"
```

## Usage

### Basic Usage
```tsx
import { FurfieldHeader } from '@/components/FurfieldHeader';

export default function Layout({ children }) {
  return (
    <div>
      <FurfieldHeader currentModule="hms" />
      <main>{children}</main>
    </div>
  );
}
```

### Full Example with All Props
```tsx
import { FurfieldHeader } from '@/components/FurfieldHeader';
import { useRouter } from 'next/navigation';

export default function Layout({ children }) {
  const router = useRouter();

  const handleLogout = () => {
    // Clear cookies
    document.cookie = 'furfield_token=; Max-Age=0; path=/;';
    // Redirect to login
    router.push('http://localhost:6800/login');
  };

  return (
    <div>
      <FurfieldHeader
        currentModule="hms"
        showModuleSwitcher={true}
        showSearch={true}
        showNotifications={true}
        showUserMenu={true}
        userName="Dr. Sarah Johnson"
        userRole="Administrator"
        onLogout={handleLogout}
      />
      <main>{children}</main>
    </div>
  );
}
```

### Minimal Usage (No Module Switcher)
```tsx
<FurfieldHeader
  currentModule="auth"
  showModuleSwitcher={false}
  showSearch={false}
  userName="Guest User"
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `currentModule` | `string` | `undefined` | ID of the current module (auth, finance, hms, hrms, purchasing, roster, organization) |
| `showModuleSwitcher` | `boolean` | `true` | Show/hide the module switcher dropdown |
| `showSearch` | `boolean` | `true` | Show/hide the search bar |
| `showNotifications` | `boolean` | `true` | Show/hide notifications bell |
| `showUserMenu` | `boolean` | `true` | Show/hide user profile menu |
| `userName` | `string` | `'Admin User'` | Display name of the current user |
| `userRole` | `string` | `'Administrator'` | Role/title of the current user |
| `onLogout` | `() => void` | `undefined` | Callback function when logout is clicked |

## Available Modules

The component includes these pre-configured modules:

| ID | Name | Description | Port |
|----|------|-------------|------|
| `auth` | Authentication | User & Access Management | 6800 |
| `finance` | Finance | Financial Management | 6850 |
| `hms` | HMS | Hospital Management | 6830 |
| `hrms` | HRMS | Human Resources | 6860 |
| `purchasing` | Purchasing | Procurement & Orders | 6870 |
| `roster` | Rostering | Staff Scheduling | 6840 |
| `organization` | Organization | Org Management | 6820 |

## Module Switching Behavior

When a user clicks on a module in the dropdown:
1. The component reads the `furfield_token` cookie
2. Redirects to the module URL with the token as a query parameter
3. The receiving module should extract the token and set it as a cookie

### Example: Receiving Module
```tsx
// In your page component or middleware
const searchParams = useSearchParams();
const authToken = searchParams.get('auth_token');

if (authToken) {
  document.cookie = `furfield_token=${authToken}; path=/; max-age=86400`;
}
```

## Styling

The component uses Tailwind CSS and follows the Furfield design system:
- **Background**: White with shadow
- **Module Icons**: Gradient backgrounds (unique per module)
- **Hover States**: Blue-50 background
- **Active Module**: Blue-50 background with checkmark
- **Dropdown**: Shadow-2xl with rounded corners

## Dependencies

- Next.js Image component
- React hooks (useState, useRef, useEffect)
- Tailwind CSS

## Image Requirements

The component expects a Furfield logo at:
```
/public/images/Furfield-icon.png
```

Make sure this image exists in all projects using the component.

## Integration Examples

### HMS Integration
```tsx
// ff-hosp-6830/src/components/layout/Header.tsx
import { FurfieldHeader } from '@/components/FurfieldHeader';

export default function Header() {
  const handleLogout = () => {
    document.cookie = 'furfield_token=; Max-Age=0; path=/;';
    window.location.href = 'http://localhost:6800/login';
  };

  return (
    <FurfieldHeader
      currentModule="hms"
      userName="Dr. Admin"
      userRole="Medical Director"
      onLogout={handleLogout}
    />
  );
}
```

### FINM Integration
```tsx
// ff-finm-6850/src/components/Header.tsx
import { FurfieldHeader } from '@/components/FurfieldHeader';

export default function Header() {
  return (
    <FurfieldHeader
      currentModule="finance"
      userName="Finance Manager"
      userRole="CFO"
    />
  );
}
```

## Customization

### Adding New Modules
Edit the `modules` array in `FurfieldHeader.tsx`:

```tsx
const modules: Module[] = [
  // ... existing modules
  {
    id: 'your-module',
    name: 'Your Module',
    description: 'Your Description',
    url: 'http://localhost:XXXX',
    color: 'from-color-500 to-color-600',
    icon: (
      <svg>...</svg>
    ),
  },
];
```

### Changing Colors
Update the `color` property for each module. Use Tailwind gradient classes:
- `from-pink-500 to-purple-600`
- `from-cyan-500 to-blue-600`
- `from-green-500 to-emerald-600`
- etc.

## Production Considerations

For production deployment, update the URLs in the modules array:
```tsx
url: 'https://hms.furfield.com',  // Instead of localhost:6830
```

## License

Part of the Furfield Healthcare Management System
