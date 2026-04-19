# UI Components Analysis - TypeScript Conversion Guide

## Summary Statistics
- **Total Files**: 38
- **Files Analyzed**: 37 (1 empty file: aurora-text-effect.jsx)
- **Framework**: React + Framer Motion
- **UI Library**: Radix UI, class-variance-authority (CVA), lucide-react

---

## Component Inventory

### 1. **accordion.jsx**
- **Components**: `Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent`
- **Props**:
  - `AccordionItem`: `className?: string`
  - `AccordionTrigger`: `className?: string, children: ReactNode`
  - `AccordionContent`: `className?: string, children: ReactNode`
- **Imports**: `@radix-ui/react-accordion`, `lucide-react` (ChevronDown), `@/lib/utils` (cn)
- **Complexity**: **Simple** - Wrapper around Radix UI primitive

### 2. **ai-card.jsx**
- **Components**: `AICard` (main), `Skeleton`, `Container`, `ClaudeLogo`, `CopilotLogo`, `OpenAILogo`, `MetaIconOutline`, `GeminiLogo`, `Sparkles` (internal)
- **Props**: `AICard()` - no props
- **Imports**: `framer-motion`, `react` (useEffect), `@/lib/utils`
- **Complexity**: **Complex** - Multiple internal components, DOM manipulation, animation sequences

### 3. **animated-gradient-background.jsx**
- **Components**: `AnimatedGradientBackground`
- **Props**:
  ```typescript
  {
    startingGap?: number = 125,
    Breathing?: boolean = false,
    gradientColors?: string[] = [...]
    gradientStops?: number[] = [...]
    animationSpeed?: number = 0.02,
    breathingRange?: number = 5,
    containerStyle?: CSSProperties = {},
    topOffset?: number = 0,
    containerClassName?: string = ""
  }
  ```
- **Imports**: `framer-motion`, `react` (useEffect, useRef), `@/lib/utils`
- **Complexity**: **Medium** - useRef, requestAnimationFrame, custom animation logic

### 4. **animated-loading-skeleton.jsx**
- **Components**: `AnimatedLoadingSkeleton` (main), internal: `Skeleton` variants
- **Props**: No props (internal state management)
- **Imports**: `framer-motion` (motion, useAnimation), `react` (useEffect, useState)
- **Complexity**: **Complex** - useAnimation, responsive grid config, motion sequences

### 5. **animated-underline-text-one.jsx**
- **Components**: `AnimatedText` (forwardRef)
- **Props**:
  ```typescript
  {
    text: string,
    textClassName?: string,
    underlineClassName?: string,
    underlinePath?: string = "M 0,10 Q 75,0 150,10 Q 225,20 300,10",
    underlineHoverPath?: string = "M 0,10 Q 75,20 150,10 Q 225,0 300,10",
    underlineDuration?: number = 1.5,
    className?: string
  }
  ```
- **Imports**: `framer-motion`, `react`, `@/lib/utils`
- **Complexity**: **Medium** - SVG path animation, motion variants

### 6. **aurora-text-effect.jsx**
- **Components**: None (empty file)
- **Props**: N/A
- **Imports**: N/A
- **Complexity**: **N/A**

### 7. **badge.jsx**
- **Components**: `Badge`
- **Props**:
  ```typescript
  {
    className?: string,
    variant?: "default" | "secondary" | "destructive" | "outline" = "default",
    ...props: HTMLAttributes<HTMLDivElement>
  }
  ```
- **Imports**: `class-variance-authority`, `@/lib/utils`
- **Complexity**: **Simple** - CVA-based styling utility component

### 8. **button.jsx**
- **Components**: `Button` (forwardRef)
- **Props**:
  ```typescript
  {
    className?: string,
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" = "default",
    size?: "default" | "sm" | "lg" | "icon" = "default",
    asChild?: boolean = false,
    ...props: ButtonHTMLAttributes<HTMLButtonElement>
  }
  ```
- **Imports**: `@radix-ui/react-slot`, `class-variance-authority`, `react`, `@/lib/utils`
- **Complexity**: **Simple** - CVA-based button with slot support

### 9. **card.jsx**
- **Components**: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`
- **Props**: All accept `className?: string` + spread HTMLDivElement props
- **Imports**: `react`, `@/lib/utils`
- **Complexity**: **Simple** - Layout wrapper components with forwardRef

### 10. **code-block.jsx**
- **Components**: `CodeBlock`
- **Props**:
  ```typescript
  {
    code: string,
    language?: string = "javascript",
    filename?: string,
    highlightLines?: number[] = [],
    className?: string
  }
  ```
- **Imports**: `lucide-react` (Check, Copy, FileCode, Terminal), `react` (useState), `@/lib/utils`
- **Complexity**: **Complex** - Custom syntax highlighting, placeholder system, token parsing

### 11. **comic-text.jsx**
- **Components**: `ComicText`
- **Props**:
  ```typescript
  {
    children: ReactNode,
    className?: string,
    fontSize?: 1 | 2 | 3 | 4 | 5 | 6 = 3,
    ...props: HTMLAttributes<HTMLSpanElement>
  }
  ```
- **Imports**: `@/lib/utils`, inline styles
- **Complexity**: **Simple** - Styled text component with font styling

### 12. **confetti.jsx**
- **Components**: `Confetti` (forwardRef), `ConfettiParticle` (internal)
- **Props**:
  ```typescript
  {
    className?: string,
    onMouseEnter?: (e: MouseEvent) => void,
    ref: { fire: (options?: ConfettiOptions) => void }
  }
  ```
- **Imports**: `react` (forwardRef, useCallback, useImperativeHandle, useMemo, useRef), `@/lib/utils`
- **Complexity**: **Complex** - Particle system, imperative ref API, physics simulation

### 13. **dot-pattern-1.jsx**
- **Components**: `DotPattern` (exported as default)
- **Props**:
  ```typescript
  {
    width?: number = 16,
    height?: number = 16,
    x?: number = 0,
    y?: number = 0,
    cx?: number = 1,
    cy?: number = 1,
    cr?: number = 1,
    className?: string,
    ...props: SVGAttributes<SVGElement>
  }
  ```
- **Imports**: `react` (useId), `@/lib/utils`
- **Complexity**: **Simple** - SVG pattern background utility

### 14. **faq-section.jsx**
- **Components**: `FAQ` (no props)
- **Props**: None
- **Imports**: Accordion components, Badge, Button, lucide-react, @/lib/utils
- **Complexity**: **Medium** - Compound component using multiple UI primitives

### 15. **flip-words.jsx**
- **Components**: `FlipWords`
- **Props**:
  ```typescript
  {
    words: string[],
    duration?: number = 3000,
    className?: string
  }
  ```
- **Imports**: `react` (useCallback, useEffect, useState), `@/lib/utils`
- **Complexity**: **Simple** - Word rotation with opacity/blur transitions

### 16. **input.jsx**
- **Components**: `Input` (forwardRef)
- **Props**: `className?: string, type?: string, ...props: InputHTMLAttributes<HTMLInputElement>`
- **Imports**: `react`, `@/lib/utils`
- **Complexity**: **Simple** - Input wrapper with tailwind styling

### 17. **label.jsx**
- **Components**: `Label` (forwardRef)
- **Props**: `className?: string, ...props: LabelHTMLAttributes<HTMLLabelElement>`
- **Imports**: `@radix-ui/react-label`, `class-variance-authority`, `react`, `@/lib/utils`
- **Complexity**: **Simple** - CVA-based label wrapper

### 18. **link-preview.jsx**
- **Components**: `LinkPreview`
- **Props**:
  ```typescript
  {
    children: ReactNode,
    url: string,
    className?: string
  }
  ```
- **Imports**: `react` (useCallback, useRef, useState), `@/lib/utils`
- **Complexity**: **Medium** - Dynamic tooltip positioning, favicon fetching, URL parsing

### 19. **meteors.jsx**
- **Components**: `Meteors`
- **Props**:
  ```typescript
  {
    number?: number = 20,
    className?: string
  }
  ```
- **Imports**: `@/lib/utils`
- **Complexity**: **Simple** - Animated background effect with inline styles

### 20. **pagination.jsx**
- **Components**: `Pagination`, `PaginationContent`, `PaginationItem`, `PaginationLink`, `PaginationPrevious`, `PaginationNext`, `PaginationEllipsis`
- **Props**: All accept `className?: string` + spread props
- **Imports**: `lucide-react`, `react`, `button` variants, `@/lib/utils`
- **Complexity**: **Simple** - Composable pagination components

### 21. **PixelTrail.jsx**
- **Components**: `PixelTrail`
- **Props**:
  ```typescript
  {
    pixelSize?: number = 24,
    fadeDuration?: number = 500,
    pixelClassName?: string = "bg-white",
    delay?: number = 0
  }
  ```
- **Imports**: `react` (useEffect, useMemo, useRef, useState)
- **Complexity**: **Complex** - Mouse tracking, ResizeObserver, grid calculation, DOM manipulation

### 22. **placeholders-and-vanish-input.jsx**
- **Components**: `PlaceholdersAndVanishInput`
- **Props**:
  ```typescript
  {
    placeholders: string[],
    onChange?: (e: ChangeEvent<HTMLInputElement>) => void,
    onSubmit?: (e: FormEvent) => void,
    value?: string,
    disabled?: boolean,
    inputRef?: React.Ref<HTMLInputElement>,
    tools?: any[]
  }
  ```
- **Imports**: `react` (useCallback, useEffect, useRef, useState), `@/lib/utils`
- **Complexity**: **Complex** - Canvas API for text animation, form state management, ref handling

### 23. **pricing-card.jsx**
- **Components**: `PricingCard`, internal: `HighlightedBackground`, `PopularBackground` (not shown)
- **Props**:
  ```typescript
  {
    tier: {
      name: string,
      price: Record<string, number | string>,
      highlighted?: boolean,
      popular?: boolean,
      description: string,
      features: string[],
      cta: string
    },
    paymentFrequency: string,
    onSelect?: (tier: any) => void,
    isCurrentPlan?: boolean
  }
  ```
- **Imports**: `lucide-react`, Badge, Button, Card, `@/lib/utils`
- **Complexity**: **Medium** - Complex tier prop structure, conditional rendering

### 24. **pricing-tab.jsx**
- **Components**: `Tab` (exported), default: `Tab`
- **Props**:
  ```typescript
  {
    text: string,
    selected: boolean,
    setSelected: (text: string) => void,
    discount?: boolean = false
  }
  ```
- **Imports**: `framer-motion`, Badge, `@/lib/utils`
- **Complexity**: **Simple** - Motion layout ID tab component

### 25. **prompt-input.jsx**
- **Components**: `PromptInput`, `PromptInputTextarea`, plus context hook `usePromptInput`
- **Props**:
  ```typescript
  PromptInput: {
    className?: string,
    isLoading?: boolean = false,
    maxHeight?: number | string = 240,
    value?: string,
    onValueChange?: (value: string) => void,
    onSubmit?: () => void,
    children: ReactNode
  }
  PromptInputTextarea: {
    className?: string,
    onKeyDown?: (e: KeyboardEvent) => void,
    disableAutosize?: boolean = false,
    ...props
  }
  ```
- **Imports**: Textarea, Tooltip components, `react`, `@/lib/utils`
- **Complexity**: **Medium** - Context provider, custom hook, auto-sizing textarea

### 26. **quote.jsx**
- **Components**: `Quote` (no props)
- **Props**: None
- **Imports**: `DotPattern` component
- **Complexity**: **Simple** - Static styled layout component

### 27. **rainbow-button.jsx**
- **Components**: `RainbowButton`
- **Props**:
  ```typescript
  {
    children: ReactNode,
    className?: string,
    onClick?: (e: MouseEvent) => void,
    ...props: ButtonHTMLAttributes<HTMLButtonElement>
  }
  ```
- **Imports**: `@/lib/utils`, inline CSS variables and keyframes
- **Complexity**: **Simple** - CSS gradient animation button

### 28. **scroll-progress.jsx**
- **Components**: `ScrollProgress`
- **Props**:
  ```typescript
  {
    className?: string,
    springOptions?: SpringOptions,
    containerRef?: React.RefObject<HTMLElement>
  }
  ```
- **Imports**: `framer-motion` (motion, useScroll, useSpring), `@/lib/utils`
- **Complexity**: **Simple** - Scroll progress bar with spring animation

### 29. **shimmer-button.jsx**
- **Components**: `ShimmerButton`
- **Props**:
  ```typescript
  {
    children: ReactNode,
    className?: string,
    onClick?: (e: MouseEvent) => void,
    ...props: ButtonHTMLAttributes<HTMLButtonElement>
  }
  ```
- **Imports**: `@/lib/utils`, inline keyframes
- **Complexity**: **Simple** - CSS shimmer animation button

### 30. **shiny-text.jsx**
- **Components**: `ShinyText`
- **Props**:
  ```typescript
  {
    children: ReactNode,
    disabled?: boolean = false,
    speed?: number = 3,
    className?: string,
    size?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl" = "base",
    weight?: "normal" | "medium" | "semibold" | "bold" | "extrabold" = "medium",
    baseColor?: string,
    shineColor?: string,
    intensity?: number = 1,
    direction?: "left-to-right" | "right-to-left" | "top-to-bottom" | "bottom-to-top" = "left-to-right",
    shineWidth?: number = 0,
    delay?: number = 0,
    repeat?: string | number = "infinite",
    pauseOnHover?: boolean = false,
    gradientType?: "linear" | "radial" = "linear"
  }
  ```
- **Imports**: `framer-motion`, `@/lib/utils`
- **Complexity**: **Complex** - Multiple animation directions, gradient types, extensive prop customization

### 31. **sparkles-text.jsx**
- **Components**: `SparklesText`, internal: `Sparkle`
- **Props**:
  ```typescript
  {
    children: ReactNode,
    className?: string,
    sparklesCount?: number = 10,
    colors?: { first: string, second: string } = { first: "#A07CFE", second: "#FE8FB5" },
    ...props
  }
  ```
- **Imports**: `react` (useEffect, useState), `@/lib/utils`
- **Complexity**: **Medium** - SVG sparkles animation, interval-based particle generation

### 32. **spotlight.jsx**
- **Components**: `Spotlight`
- **Props**:
  ```typescript
  {
    className?: string,
    fill?: string = "white"
  }
  ```
- **Imports**: `@/lib/utils`, inline SVG
- **Complexity**: **Simple** - Static SVG spotlight effect

### 33. **sticky-banner.jsx**
- **Components**: `StickyBanner`
- **Props**:
  ```typescript
  {
    children: ReactNode,
    className?: string,
    dismissible?: boolean = true
  }
  ```
- **Imports**: `lucide-react` (X), `react` (useEffect, useState), `@/lib/utils`
- **Complexity**: **Simple** - Scroll-aware dismissible banner

### 34. **svg-mask-effect.jsx**
- **Components**: `MaskContainer` (exported as default)
- **Props**:
  ```typescript
  {
    children: ReactNode,
    revealText: ReactNode,
    size?: number = 10,
    revealSize?: number = 600,
    className?: string
  }
  ```
- **Imports**: `framer-motion`, `react` (useEffect, useRef, useState), `@/lib/utils`
- **Complexity**: **Complex** - Mouse tracking, mask animation, WebKit CSS mask properties

### 35. **text-generate-effect.jsx**
- **Components**: `TextGenerateEffect`
- **Props**:
  ```typescript
  {
    words: string,
    className?: string,
    filter?: boolean = true,
    duration?: number = 0.5,
    onComplete?: () => void
  }
  ```
- **Imports**: `react` (useEffect, useState), `@/lib/utils`
- **Complexity**: **Medium** - Arabic text detection, RTL support, character-by-character animation

### 36. **text-shimmer-wave.jsx**
- **Components**: `TextShimmerWave`
- **Props**:
  ```typescript
  {
    children: ReactNode,
    as?: Component = "p",
    className?: string,
    duration?: number = 1,
    zDistance?: number = 10,
    xDistance?: number = 2,
    yDistance?: number = -2,
    spread?: number = 1,
    scaleDistance?: number = 1.1,
    rotateYDistance?: number = 10,
    transition?: TransitionConfig
  }
  ```
- **Imports**: `framer-motion`, `@/lib/utils`
- **Complexity**: **Medium** - 3D transforms per character, motion configuration

### 37. **textarea.jsx**
- **Components**: `Textarea` (forwardRef)
- **Props**: `className?: string, ...props: TextareaHTMLAttributes<HTMLTextAreaElement>`
- **Imports**: `@/lib/utils`, `react`
- **Complexity**: **Simple** - Textarea wrapper with tailwind styling

### 38. **tooltip.jsx**
- **Components**: `TooltipProvider`, `Tooltip`, `TooltipTrigger`, `TooltipContent`
- **Props**: `TooltipContent: { className?: string, sideOffset?: number = 4, ...props }`
- **Imports**: `@radix-ui/react-tooltip`, `react`, `@/lib/utils`
- **Complexity**: **Simple** - Radix UI wrapper components

---

## Complexity Breakdown

### Simple (14 files)
accordion, badge, button, card, comic-text, dot-pattern-1, flip-words, input, label, meteors, pagination, pricing-tab, quote, rainbow-button, shimmer-button, spotlight, sticky-banner, textarea, tooltip

### Medium (10 files)
animated-gradient-background, animated-underline-text-one, faq-section, link-preview, pricing-card, prompt-input, shiny-text, sparkles-text, text-generate-effect, text-shimmer-wave

### Complex (13 files)
ai-card, animated-loading-skeleton, code-block, confetti, placeholder-and-vanish-input, PixelTrail, scroll-progress, svg-mask-effect

---

## Key Import Patterns

### Framework Dependencies
- **framer-motion**: 14+ components (animations)
- **react**: 20+ components (hooks, forwardRef)
- **@radix-ui/***: 6 components (accordion, label, slot, tooltip)
- **lucide-react**: 10+ components (icons)
- **class-variance-authority**: 4 components (badge, button, label, pricing-tab)
- **@/lib/utils**: All 37 files (cn utility)

### Animation Libraries
- Framer Motion: dominant for advanced animations
- CSS Keyframes: used in shimmer, rainbow, meteors effects
- Canvas API: code-block, placeholders-and-vanish-input
- RequestAnimationFrame: animated-gradient-background, PixelTrail

---

## TypeScript Conversion Tips

### High Priority (Complex/Custom Types Needed)
1. **confetti.jsx** - Particle interface, imperative ref type
2. **code-block.jsx** - Language config map type
3. **PixelTrail.jsx** - Grid calculation types
4. **svg-mask-effect.jsx** - Mouse position type
5. **shiny-text.jsx** - Multiple enum types for directions/sizes

### Medium Priority (Standard React Types)
- All Radix UI wrapper components (already have types via @radix-ui packages)
- Animation components (Framer Motion provides motion types)
- Form components (standard HTML element types)

### Quick Wins (Simple 1:1 conversions)
- All simple wrapper components (card, badge, button, etc.)
- All pagination components
- All text effect components

### Special Considerations
- **Arabic text support**: text-generate-effect.jsx needs Unicode regex types
- **3D transforms**: text-shimmer-wave.jsx needs perspective CSS types
- **Web APIs**: PixelTrail (ResizeObserver), code-block (Canvas API)
- **Custom hooks**: prompt-input.jsx (context + hook pattern)

---

## Recommended Conversion Order

1. **Phase 1 - Foundation** (15 files): Simple wrapper components
   - card, badge, button, label, input, textarea, pagination, tooltip, etc.

2. **Phase 2 - Media/UI** (8 files): Medium-complexity styled components
   - pricing-card, faq-section, quote, shiny-text, etc.

3. **Phase 3 - Animations** (10 files): Framer Motion components
   - text-shimmer-wave, scroll-progress, animated-underline-text-one, etc.

4. **Phase 4 - Advanced** (4 files): Complex custom logic
   - confetti, code-block, PixelTrail, svg-mask-effect
