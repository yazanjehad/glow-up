# Multilingual & RTL/LTR Setup Guide

This application is fully configured for Arabic and English with automatic RTL/LTR support.

## Current Configuration

- **Default Language**: Arabic (RTL)
- **Fallback Language**: Arabic
- **Supported Languages**: Arabic (ar), English (en)

## File Structure

```
client/
├── i18n/
│   ├── config.ts                    # i18n configuration file
│   └── locales/
│       ├── ar.json                  # Arabic translations
│       └── en.json                  # English translations
├── components/
│   ├── Header.tsx                   # Header with language switcher
│   ├── Layout.tsx                   # Global layout wrapper
│   └── ui/
├── pages/
│   ├── Index.tsx                    # Homepage (fully translated)
│   ├── Profile.tsx                  # Profile page (placeholder)
│   ├── Favorites.tsx                # Favorites page (placeholder)
│   ├── Support.tsx                  # Support page (placeholder)
│   └── NotFound.tsx                 # 404 page
├── App.tsx                          # App with i18n provider
└── global.css                       # Global styles with RTL support
```

## How It Works

### 1. i18n Configuration (`client/i18n/config.ts`)

The configuration file:
- Initializes react-i18next
- Loads translation files for both languages
- Sets Arabic as the default language
- Handles direction (RTL/LTR) changes automatically
- Persists language preference to localStorage

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n.use(initReactI18next).init({
  lng: 'ar',        // Default to Arabic
  fallbackLng: 'ar',
  // ... other config
});

// Automatically set direction when language changes
i18n.on('languageChanged', (lng) => {
  const dir = lng === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.dir = dir;
  document.documentElement.lang = lng;
});
```

### 2. Using Translations in Components

Use the `useTranslation` hook in any component:

```typescript
import { useTranslation } from 'react-i18next';

export default function MyComponent() {
  const { t, i18n } = useTranslation();
  
  return (
    <div>
      <h1>{t('profile')}</h1>
      {i18n.language === 'ar' ? 'العربية' : 'English'}
    </div>
  );
}
```

### 3. Language Switcher

The language switcher is located in the Header component:
- Click the "AR" or "EN" button to switch languages
- The entire UI direction (RTL/LTR) changes automatically
- Language preference is saved to localStorage

### 4. Translation Files

#### Arabic Translations (`client/i18n/locales/ar.json`)
Contains all Arabic translations with proper Arabic text and RTL-friendly structure.

#### English Translations (`client/i18n/locales/en.json`)
Contains all English translations with proper LTR structure.

## Adding New Translations

1. **Add the key and value to both translation files**:

```json
// In client/i18n/locales/ar.json
{
  "newKey": "النص بالعربية"
}

// In client/i18n/locales/en.json
{
  "newKey": "English Text"
}
```

2. **Use in your component**:

```typescript
const { t } = useTranslation();
<p>{t('newKey')}</p>
```

## RTL/LTR Support

The application automatically handles:

- **Text Direction**: RTL for Arabic, LTR for English
- **HTML Direction**: `dir` attribute on `<html>` element
- **Text Alignment**: CSS handles via `[dir="rtl"]` and `[dir="ltr"]` selectors
- **Layout Reversal**: Flexbox order is adjusted automatically

### CSS RTL Support (in `client/global.css`)

```css
[dir="rtl"] {
  direction: rtl;
  text-align: right;
}

[dir="ltr"] {
  direction: ltr;
  text-align: left;
}
```

### Component-Level RTL Handling

Some components may need special RTL handling:

```typescript
const { i18n } = useTranslation();
const isRTL = i18n.language === 'ar';

// Position menu on the correct side
<div className={isRTL ? 'right-0' : 'left-0'}>
  Menu content
</div>
```

## App Integration

The i18n provider is wrapped around the entire app in `App.tsx`:

```typescript
import i18n from '@/i18n/config';
import { I18nextProvider } from 'react-i18next';

<I18nextProvider i18n={i18n}>
  <App />
</I18nextProvider>
```

## Default Language Behavior

- On first load, the app starts in Arabic (RTL)
- The selected language is persisted in localStorage
- Users can switch languages at any time via the header button

## Tailwind CSS & RTL

The app uses Tailwind CSS with RTL-friendly utilities:
- Standard Tailwind classes work for LTR
- CSS handles direction via global selectors
- Flexbox layout automatically adjusts in RTL

## Primary Color

The primary color (green) is defined in `tailwind.config.ts` and `client/global.css`:
- HSL Value: `142.86 37.25% 40.39%`
- Used for buttons, links, and interactive elements
- Automatically adapts to both themes

## Testing

To test the i18n setup:

1. **Change Language**: Click the language switcher in the header
2. **Verify Direction**: Check that:
   - Text direction changes (RTL for Arabic, LTR for English)
   - Menus position correctly
   - Layout elements align properly
3. **Verify Persistence**: Refresh the page; language preference should be maintained
4. **Check Translations**: Ensure all visible text is properly translated

## Browser Support

- Tested on modern browsers (Chrome, Firefox, Safari, Edge)
- RTL support via CSS and HTML `dir` attribute
- localStorage for language persistence

## Future Enhancements

- Add more languages
- Implement language detection based on browser locale
- Add right-to-left (RTL) date and number formatting
- Implement regional formatting (currency, dates, etc.)
- Add translation management UI for admin panel
