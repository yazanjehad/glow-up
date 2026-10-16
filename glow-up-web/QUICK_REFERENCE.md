# Quick Reference Guide

## Adding a New Translation

### 1. Update translation files

**File**: `client/i18n/locales/ar.json`
```json
{
  "existingKey": "موجود بالفعل",
  "newKey": "المفتاح الجديد"
}
```

**File**: `client/i18n/locales/en.json`
```json
{
  "existingKey": "Already exists",
  "newKey": "New key"
}
```

### 2. Use in component
```typescript
import { useTranslation } from 'react-i18next';

export default function MyComponent() {
  const { t } = useTranslation();
  return <p>{t('newKey')}</p>;
}
```

## Using Current Language in Conditions

```typescript
import { useTranslation } from 'react-i18next';

export default function MyComponent() {
  const { i18n } = useTranslation();
  
  return (
    <div>
      {i18n.language === 'ar' ? (
        <p>هذا نص عربي</p>
      ) : (
        <p>This is English text</p>
      )}
    </div>
  );
}
```

## Changing Language Programmatically

```typescript
import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  
  const handleChangeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };
  
  return (
    <button onClick={() => handleChangeLanguage('ar')}>
      العربية
    </button>
  );
}
```

## Creating a New Page

### 1. Create page component

**File**: `client/pages/MyNewPage.tsx`
```typescript
import { useTranslation } from 'react-i18next';
import Layout from '@/components/Layout';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function MyNewPage() {
  const { t, i18n } = useTranslation();

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="flex items-center gap-2 mb-8">
          <Link to="/" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            {t('myPageTitle')}
          </h1>
        </div>

        {/* Your page content here */}
      </div>
    </Layout>
  );
}
```

### 2. Add route to App.tsx

**File**: `client/App.tsx`
```typescript
import MyNewPage from "./pages/MyNewPage";

<Route path="/my-page" element={<MyNewPage />} />
```

### 3. Add link to Header.tsx

**File**: `client/components/Header.tsx`
```typescript
<Link to="/my-page" className="text-gray-700 hover:text-primary font-medium text-sm">
  {t('myPageTitle')}
</Link>
```

### 4. Add translations

**Files**: `client/i18n/locales/ar.json` and `en.json`
```json
{
  "myPageTitle": "عنوان صفحتي"  // Arabic
  "myPageTitle": "My Page Title"  // English
}
```

## RTL/LTR Specific Styling

### Using Tailwind with Direction

```typescript
// Automatically correct in both directions
<div className="flex items-center gap-4">
  {/* Flexbox automatically adjusts in RTL */}
</div>

// Conditional styling based on direction
const { i18n } = useTranslation();
const isRTL = i18n.language === 'ar';

<div className={isRTL ? 'text-right' : 'text-left'}>
  Content
</div>
```

### Custom CSS for RTL

```css
/* Automatic RTL support in global.css */
[dir="rtl"] {
  direction: rtl;
  text-align: right;
}

[dir="ltr"] {
  direction: ltr;
  text-align: left;
}

/* Specific RTL rules */
[dir="rtl"] .my-element {
  margin-right: 10px;
  margin-left: 0;
}
```

## Using Layouts and Components

### Using Layout Wrapper

```typescript
import Layout from '@/components/Layout';

export default function MyPage() {
  return (
    <Layout>
      {/* Your page content - Header is automatically included */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Content */}
      </main>
    </Layout>
  );
}
```

### Using Buttons with Styling

```typescript
import { Button } from '@/components/ui/button';

<Button className="bg-primary hover:bg-primary/90 text-white">
  {t('buttonText')}
</Button>

// Different variants
<Button variant="outline">{t('outline')}</Button>
<Button variant="secondary">{t('secondary')}</Button>
<Button variant="destructive">{t('delete')}</Button>
<Button variant="ghost">{t('ghost')}</Button>
<Button variant="link">{t('link')}</Button>
```

## Styling Components

### Using Tailwind Classes

```typescript
// Responsive classes
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Cards */}
</div>

// Spacing
<div className="p-4 m-2 gap-3">

// Colors
<button className="bg-primary text-white hover:bg-primary/90">

// Text
<h1 className="text-3xl font-bold text-gray-900">
```

### Color Variables

```typescript
// Use CSS variables for consistent theming
<div className="bg-primary text-primary-foreground">
<button className="border border-border bg-card text-card-foreground">

// Access in CSS
.my-element {
  color: hsl(var(--foreground));
  background: hsl(var(--primary));
}
```

## Responsive Breakpoints

```
sm: 640px   - Small devices
md: 768px   - Tablets
lg: 1024px  - Laptops
xl: 1280px  - Desktops
2xl: 1400px - Large screens
```

**Usage**:
```typescript
<div className="hidden md:block">
  {/* Visible on tablets and larger */}
</div>

<div className="md:hidden">
  {/* Visible on mobile, hidden on tablets+ */}
</div>
```

## Icons from Lucide React

```typescript
import { 
  Bell, 
  User, 
  Globe, 
  LogOut, 
  Menu, 
  X,
  Heart,
  Star,
  MapPin,
  Search,
  ChevronRight
} from 'lucide-react';

<Bell size={20} className="text-gray-700" />
<Heart size={24} className="text-red-500 fill-red-500" />
```

## Common Patterns

### Language-conditional Text

```typescript
const { i18n } = useTranslation();

{i18n.language === 'ar' ? 'نص عربي' : 'English text'}
```

### Mobile Menu Toggle

```typescript
const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

<button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
  {mobileMenuOpen ? <X /> : <Menu />}
</button>

{mobileMenuOpen && (
  <div className="md:hidden">
    {/* Mobile menu content */}
  </div>
)}
```

### Responsive Grid

```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {items.map(item => (
    <div key={item.id}>{item.name}</div>
  ))}
</div>
```

## Available UI Components

Located in `client/components/ui/`:

- Button
- Card
- Dialog
- Dropdown Menu
- Form
- Input
- Label
- Select
- Sheet
- Tabs
- Toast/Toaster
- And 40+ more Radix UI components

All are pre-styled and ready to use!

## Dev Commands

```bash
# Start development
pnpm dev

# Build for production
pnpm build

# Check TypeScript
pnpm typecheck

# Format code
pnpm format.fix

# Run tests
pnpm test
```

## Important Files to Know

- `client/i18n/config.ts` - i18n setup
- `client/App.tsx` - Routes and providers
- `client/components/Layout.tsx` - Page wrapper
- `client/components/Header.tsx` - Navigation
- `client/global.css` - Global styles
- `tailwind.config.ts` - Tailwind config
- `client/pages/Index.tsx` - Homepage example

---

**Remember**: The app starts in Arabic (RTL). Click the language button in the header to switch to English (LTR).
