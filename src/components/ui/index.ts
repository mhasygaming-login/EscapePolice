/**
 * UI Primitives & Interactive Elements Barrel Export
 * Escape the Police: Cyber Pursuit
 * Standardized PascalCase Architecture
 */

// 1. Card Stacking & Map Carousel
export { CardStack } from './CardStack';
export type { CardStackItem, CardStackProps } from './CardStack';

// 2. Interactive Difficulty & Map Selector
export { InteractiveSelector } from './InteractiveSelector';
export type { DifficultyId, SelectorOption, InteractiveSelectorProps } from './InteractiveSelector';

// 3. Modern Animated Authentication Primitives
export {
  Input,
  BoxReveal,
  Ripple,
  OrbitingCircles,
  TechOrbitDisplay,
  AnimatedForm,
  AuthTabs,
  Label,
  BottomGradient,
} from './ModernAnimatedAuth';
export type { AnimatedFormProps, Field, IconConfig } from './ModernAnimatedAuth';

// 4. Cinematic Initial Boot Loading Screen
export { LoadingScreen } from './LoadingScreen';
