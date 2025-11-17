# WhatsApp Number Checker - Design Guidelines

## Design Approach
**System-Based Approach using Material Design principles**
This utility-focused application prioritizes clarity, efficiency, and real-time data visualization. Material Design's structured approach to information hierarchy and feedback states aligns perfectly with the need for clear status indicators and progress tracking.

## Typography Hierarchy

**Primary Font:** Inter or Roboto via Google Fonts CDN
- Hero/Page Title: text-4xl font-bold tracking-tight
- Section Headers: text-2xl font-semibold 
- Subsections: text-lg font-medium
- Body Text: text-base font-normal
- Status Labels: text-sm font-medium uppercase tracking-wide
- Data/Numbers: text-sm font-mono (for phone numbers)
- Captions: text-xs

## Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 6, and 8
- Component padding: p-4 to p-6
- Section spacing: space-y-6 to space-y-8
- Card gaps: gap-4
- Form field spacing: space-y-4

**Container Strategy:**
- Main content: max-w-6xl mx-auto px-4
- Centered cards: max-w-2xl mx-auto
- Full-width results table: w-full with inner max-w-7xl

## Core Layout Structure

**Single-Page Dashboard Layout**

1. **Header Section** (sticky top-0)
   - Logo/title on left
   - Connection status indicator on right
   - Session info display (authenticated user number)

2. **Main Content Area** (3-column grid on desktop, stacked on mobile)
   
   **Left Panel - Upload Interface** (lg:col-span-1)
   - Card component with border
   - Heading: "Upload Phone Numbers"
   - Textarea input (h-48, font-mono for number display)
   - File upload dropzone with drag-and-drop
   - Format helper text with example
   - Primary action button: "Start Checking"
   - Number count display
   
   **Center Panel - Checking Progress** (lg:col-span-1)
   - Real-time status card
   - Large progress indicator (circular or linear)
   - Current number being checked (highlighted, font-mono)
   - Progress stats: X of Y checked
   - Estimated time remaining
   - Pause/Resume controls
   
   **Right Panel - Quick Stats** (lg:col-span-1)
   - Stats cards in vertical stack (space-y-4)
   - Total Checked (large number display)
   - Active on WhatsApp (with percentage)
   - Not Registered (with percentage)
   - Export button (sticky at bottom of panel)

3. **Results Table Section** (full-width below panels)
   - Filterable/searchable table
   - Columns: Phone Number (font-mono), Status (badge), Timestamp
   - Pagination controls
   - Bulk actions toolbar

## Component Library

**Status Badges:**
- AKTIF: Filled badge with checkmark icon
- NON-WA: Outlined badge with X icon  
- CHECKING: Pulsing badge with spinner icon
- ERROR: Filled badge with alert icon

**Upload Dropzone:**
- Dashed border (border-dashed border-2)
- Centered icon (upload cloud icon from Heroicons)
- Drag state: transform scale slightly, border solid
- File accepted state: brief success feedback

**QR Authentication Modal:**
- Centered modal (max-w-md)
- Large QR code display area (square, min 300px)
- Instruction text above
- "Scan with WhatsApp" heading
- Auto-dismiss on successful authentication

**Progress Indicators:**
- Circular progress ring for active checking
- Linear progress bar for overall completion
- Animated spinner for loading states

**Data Table:**
- Zebra striping for rows (alternate row treatment)
- Fixed header on scroll
- Monospace font for phone numbers
- Status badge in dedicated column
- Hover state on rows

**Action Buttons:**
- Primary: "Start Checking", "Export Results"
- Secondary: "Clear", "Pause"
- Destructive: "Cancel", "Reset"
- Icon-only: "Refresh", "Download"

**Toast Notifications:**
- Position: top-right
- Auto-dismiss after 4 seconds
- Success, error, info variants
- Slide-in animation

## Navigation & Controls

**No traditional navigation needed** - single-page application

**Control Bar** (appears when checking is active):
- Floating bottom bar (md:static md:inline)
- Pause/Resume toggle
- Stop button
- Progress percentage display

## Form Elements

**Phone Number Input:**
- Monospace textarea (font-mono)
- Line numbers indicator (optional helper)
- Placeholder: "62812345678\n62887654321"
- Character count display
- Format validation feedback

**File Upload:**
- Accept .txt files
- Max file size display (e.g., "Max 10MB")
- File preview after upload (first 10 lines)
- Remove file button

## Data Visualization

**Real-time Updates:**
- Socket.IO driven status changes
- Smooth transitions for status badge changes
- Row highlight flash on status update
- Auto-scroll to active checking item

**Export Interface:**
- Format selector: CSV, TXT, JSON
- Filter options: All, Active only, Non-WA only
- Download button with loading state

## Responsive Behavior

**Desktop (lg):** 3-column layout as described
**Tablet (md):** 2-column (Upload + Progress stacked, Stats sidebar)
**Mobile (base):** Single column stack, sticky controls at bottom

## Images

**Hero/Header Image:** Not applicable - this is a utility dashboard

**Icons Required:**
- Heroicons (via CDN): upload-cloud, check-circle, x-circle, spinner, download, pause, play, stop, refresh, filter, search
- All icons at size w-5 h-5 for inline use, w-8 h-8 for feature emphasis

## State Management Patterns

- Empty state: Large centered message with upload CTA
- Loading state: Skeleton loaders for table rows
- Error state: Alert banner with retry action
- Success state: Completion message with summary stats
- Authentication state: Modal overlay until QR scanned