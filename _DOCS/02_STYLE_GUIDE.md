# Daily Standup AI - Style Guide

## Design Philosophy
Daily Standup AI follows a modern, high-tech aesthetic characterized by:
- **Glassmorphism**: Use of translucent backgrounds with high `backdrop-blur` for a layered, depth-rich feel.
- **Deep Neutrals**: Using the Slate palette from Tailwind (e.g., `slate-900` for dark backgrounds, `slate-50` for light).
- **Vibrant Accents**: Indigo and Violet are the primary brand colors, used for buttons, active states, and glowing effects.
- **Micro-interactions**: Smooth transitions and scale transforms on interactive elements.

## Color Palette

### Light Mode
- **Background**: `#F8FAFC` (`slate-50`)
- **Surface**: `white/70` with backdrop blur
- **Primary Text**: `slate-800`
- **Secondary Text**: `slate-500`
- **Accent**: `indigo-600`

### Dark Mode
- **Background**: `#0F172A` (`slate-900`)
- **Surface**: `slate-900/70` with backdrop blur
- **Primary Text**: `slate-200`
- **Secondary Text**: `slate-400`
- **Accent**: `indigo-400`

## Typography
- **Primary Font**: `Sans-serif` (system default stack).
- **Weights**:
  - `font-black`: Used for headings and brand identity.
  - `font-bold`: Used for labels and button text.
  - `font-normal`: Body text.
- **Styles**: All-caps with high tracking (`tracking-widest`) for navigation and small headers.

## Components

### Buttons
- **Standard**: Rounded-2xl (`rounded-2xl`), semi-bold text, transition effects.
- **Navigation Tabs**: High-contrast active state with box-shadows.
- **Hover States**: Slight scale up (`hover:scale-105`) and background shifts.

### Surfaces (Cards & Headers)
- **Glass Card**: `bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50`.
- **Shadows**: Soft, multi-layered shadows for depth.

### Icons
- Uses **Heroicons (set 24/outline)**.
- Icon sizing: Typically `w-[18px] h-[18px]` for small UI icons.

## Animations
- **Spring Transitions**: All color and transform changes should use `duration-300` or `duration-500`.
- **Entrance**: Use "animate-in fade-in" for new views.
- **Background Decor**: Pulsing blurred circles in the background corners (`animate-pulse`).

## Tailwind Configuration Summary
The project relies on standard Tailwind classes with specific emphasis on:
- `backdrop-blur-xl`
- `rounded-[28px]` (Large rounded corners for high-end feel)
- `dark:` variants for every color property.
- Custom spacing and shadow utilities where needed.