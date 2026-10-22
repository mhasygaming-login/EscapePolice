import {
  memo,
  ReactNode,
  useState,
  ChangeEvent,
  useEffect,
  useRef,
  forwardRef,
} from "react";
import {
  motion,
  useAnimation,
  useInView,
  useMotionTemplate,
  useMotionValue,
} from "motion/react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "../../lib/utils";

// ==================== Input ====================

const Input = memo(
  forwardRef(function Input(
    { className, type, ...props }: React.InputHTMLAttributes<HTMLInputElement>,
    ref: React.ForwardedRef<HTMLInputElement>,
  ) {
    const radius = 100;
    const [visible, setVisible] = useState(false);
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const background = useMotionTemplate`
      radial-gradient(
        ${visible ? radius + "px" : "0px"} circle at ${mouseX}px ${mouseY}px,
        var(--ep-accent),
        transparent 80%
      )
    `;

    function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent<HTMLDivElement>) {
      const { left, top } = currentTarget.getBoundingClientRect();
      mouseX.set(clientX - left);
      mouseY.set(clientY - top);
    }

    return (
      <motion.div
        style={{ background }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        className="group/input rounded-lg p-[2px] transition duration-300"
      >
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-md border border-cyan-500/30 bg-[#0a0f1d] px-3 py-2 text-sm text-white shadow-input transition duration-300 group-hover/input:shadow-none placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-[2px] focus-visible:ring-cyan-400 disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
          ref={ref}
          {...props}
        />
      </motion.div>
    );
  }),
);
Input.displayName = "Input";

// ==================== BoxReveal ====================

type BoxRevealProps = {
  children: ReactNode;
  width?: string;
  boxColor?: string;
  duration?: number;
  overflow?: string;
  position?: string;
  className?: string;
};

const BoxReveal = memo(function BoxReveal({
  children,
  width = "fit-content",
  boxColor,
  duration,
  overflow = "hidden",
  position = "relative",
  className,
}: BoxRevealProps) {
  const mainControls = useAnimation();
  const slideControls = useAnimation();
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    // Immediate activation fallback ensures elements are never stuck hidden in iframes
    const timer = setTimeout(() => {
      slideControls.start("visible");
      mainControls.start("visible");
    }, 40);

    if (isInView) {
      slideControls.start("visible");
      mainControls.start("visible");
    }

    return () => clearTimeout(timer);
  }, [isInView, mainControls, slideControls]);

  return (
    <section
      ref={ref}
      style={{ position: position as "relative" | "absolute" | "fixed" | "sticky" | "static", width, overflow }}
      className={className}
    >
      <motion.div
        variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }}
        initial="visible"
        animate={mainControls}
        transition={{ duration: duration ?? 0.4, delay: 0.1 }}
      >
        {children}
      </motion.div>
      <motion.div
        variants={{ hidden: { left: 0 }, visible: { left: "100%" } }}
        initial="hidden"
        animate={slideControls}
        transition={{ duration: duration ?? 0.4, ease: "easeIn" }}
        style={{
          position: "absolute",
          top: 4,
          bottom: 4,
          left: 0,
          right: 0,
          zIndex: 20,
          background: boxColor ?? "var(--ep-accent)",
          borderRadius: 4,
        }}
      />
    </section>
  );
});

// ==================== Ripple ====================

type RippleProps = {
  mainCircleSize?: number;
  mainCircleOpacity?: number;
  numCircles?: number;
  className?: string;
};

const Ripple = memo(function Ripple({
  mainCircleSize = 210,
  mainCircleOpacity = 0.24,
  numCircles = 11,
  className = "",
}: RippleProps) {
  return (
    <section
      className={`absolute inset-0 flex max-w-[100%] lg:max-w-[100%] items-center justify-center [mask-image:linear-gradient(to_bottom,black,transparent)] pointer-events-none ${className}`}
    >
      {Array.from({ length: numCircles }, (_, i) => {
        const size = mainCircleSize + i * 70;
        const opacity = Math.max(0, mainCircleOpacity - i * 0.02);
        const animationDelay = `${i * 0.06}s`;
        const borderStyle = i === numCircles - 1 ? "dashed" : "solid";

        return (
          <span
            key={i}
            className="animate-ripple absolute rounded-full border pointer-events-none"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              opacity,
              animationDelay,
              borderStyle,
              borderWidth: "1px",
              borderColor: "var(--ep-accent)",
              background: "color-mix(in srgb, var(--ep-accent) 10%, transparent)",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
          />
        );
      })}
    </section>
  );
});

// ==================== OrbitingCircles ====================

type OrbitingCirclesProps = {
  className?: string;
  children: ReactNode;
  reverse?: boolean;
  duration?: number;
  delay?: number;
  radius?: number;
  path?: boolean;
};

const OrbitingCircles = memo(function OrbitingCircles({
  className,
  children,
  reverse = false,
  duration = 20,
  delay = 10,
  radius = 50,
  path = true,
}: OrbitingCirclesProps) {
  return (
    <>
      {path && (
        <svg xmlns="http://www.w3.org/2000/svg" version="1.1" className="pointer-events-none absolute inset-0 size-full">
          <circle className="stroke-[var(--ep-card-border)] stroke-1" cx="50%" cy="50%" r={radius} fill="none" />
        </svg>
      )}
      <section
        style={{ "--duration": duration, "--radius": radius, "--delay": -delay } as React.CSSProperties}
        className={cn(
          "absolute flex size-full transform-gpu animate-orbit items-center justify-center rounded-full border border-[var(--ep-card-border)] bg-[var(--ep-accent)]/10 [animation-delay:calc(var(--delay)*1000ms)] pointer-events-none",
          reverse ? "[animation-direction:reverse]" : undefined,
          className,
        )}
      >
        <div className="pointer-events-auto">
          {children}
        </div>
      </section>
    </>
  );
});

// ==================== TechOrbitDisplay ====================

type IconConfig = {
  className?: string;
  duration?: number;
  delay?: number;
  radius?: number;
  path?: boolean;
  reverse?: boolean;
  component: () => React.ReactNode;
};

type TechnologyOrbitDisplayProps = {
  iconsArray: IconConfig[];
  text?: string;
  centerSlot?: ReactNode;
};

const TechOrbitDisplay = memo(function TechOrbitDisplay({ iconsArray, text, centerSlot }: TechnologyOrbitDisplayProps) {
  return (
    <section className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-lg">
      {centerSlot ?? (
        <span className="pointer-events-none whitespace-pre-wrap bg-gradient-to-b from-white to-slate-900/10 bg-clip-text text-center text-7xl font-semibold leading-none text-transparent">
          {text}
        </span>
      )}

      {iconsArray.map((icon, index) => (
        <OrbitingCircles
          key={index}
          className={icon.className}
          duration={icon.duration}
          delay={icon.delay}
          radius={icon.radius}
          path={icon.path}
          reverse={icon.reverse}
        >
          {icon.component()}
        </OrbitingCircles>
      ))}
    </section>
  );
});

// ==================== AnimatedForm ====================

type FieldType = "text" | "email" | "password";

type Field = {
  label: string;
  required?: boolean;
  type: FieldType;
  placeholder?: string;
  value?: string;
  helperText?: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

type AnimatedFormProps = {
  header?: string;
  subHeader?: string;
  fields: Field[];
  submitButton: string;
  textVariantButton?: string;
  errorField?: string;
  fieldPerRow?: number;
  onSubmit: (event: React.SyntheticEvent) => void;
  googleLogin?: string;
  goTo?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  noteSlot?: ReactNode;
  secondaryAction?: ReactNode;
};

type Errors = { [key: string]: string };

const AnimatedForm = memo(function AnimatedForm({
  header,
  subHeader,
  fields,
  submitButton,
  textVariantButton,
  errorField,
  fieldPerRow = 1,
  onSubmit,
  googleLogin,
  goTo,
  noteSlot,
  secondaryAction,
}: AnimatedFormProps) {
  const [visible, setVisible] = useState<boolean>(false);
  const [errors, setErrors] = useState<Errors>({});

  const toggleVisibility = () => setVisible(!visible);

  const validateForm = () => {
    const currentErrors: Errors = {};
    fields.forEach((field) => {
      const val = field.value ?? "";
      if (field.required && !val.trim()) {
        currentErrors[field.label] = `${field.label} wajib diisi`;
      }
      if (field.type === "password" && val && val.length < 3) {
        currentErrors[field.label] = "Kata sandi minimal 3 karakter";
      }
    });
    return currentErrors;
  };

  const handleSubmit = (event: React.SyntheticEvent) => {
    event.preventDefault();
    const formErrors = validateForm();
    if (Object.keys(formErrors).length === 0) {
      setErrors({});
      onSubmit(event);
    } else {
      setErrors(formErrors);
    }
  };

  return (
    <section className="mx-auto flex w-full flex-col gap-4">
      {header && (
        <BoxReveal boxColor="var(--ep-accent)" duration={0.3}>
          <h2 className="text-2xl font-bold font-display text-[var(--ep-text)] tracking-wider">{header}</h2>
        </BoxReveal>
      )}

      {subHeader && (
        <BoxReveal boxColor="var(--ep-accent)" duration={0.3} className="pb-2">
          <p className="max-w-sm text-sm text-[var(--ep-text-muted)]">{subHeader}</p>
        </BoxReveal>
      )}

      {googleLogin && (
        <>
          <BoxReveal boxColor="var(--ep-accent)" duration={0.3} overflow="visible" width="unset">
            <button className="g-button group/btn h-10 w-full rounded-md border font-medium outline-hidden hover:cursor-pointer" type="button">
              <span className="flex h-full w-full items-center justify-center gap-3">
                <img src="/icons/google.svg" width={26} height={26} alt="Google" />
                {googleLogin}
              </span>
              <BottomGradient />
            </button>
          </BoxReveal>
          <BoxReveal boxColor="var(--ep-accent)" duration={0.3} width="100%">
            <section className="flex items-center gap-4">
              <hr className="flex-1 border-1 border-dashed border-[var(--ep-card-border)]" />
              <p className="text-sm text-[var(--ep-text-muted)]">atau</p>
              <hr className="flex-1 border-1 border-dashed border-[var(--ep-card-border)]" />
            </section>
          </BoxReveal>
        </>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <section className={`grid grid-cols-1 md:grid-cols-${fieldPerRow} gap-4 mb-2`}>
          {fields.map((field) => (
            <section key={field.label} className="flex flex-col gap-1.5">
              <BoxReveal boxColor="var(--ep-accent)" duration={0.3}>
                <Label htmlFor={field.label} className="text-[11px] font-bold uppercase tracking-wider text-[var(--ep-text-muted)]">
                  {field.label} {field.required && <span className="text-[var(--ep-magenta)]">*</span>}
                </Label>
              </BoxReveal>

              <BoxReveal width="100%" boxColor="var(--ep-accent)" duration={0.3} className="flex w-full flex-col space-y-1">
                <section className="relative">
                  <Input
                    type={field.type === "password" ? (visible ? "text" : "password") : field.type}
                    id={field.label}
                    value={field.value ?? ""}
                    placeholder={field.placeholder}
                    onChange={field.onChange}
                  />
                  {field.type === "password" && (
                    <button
                      type="button"
                      onClick={toggleVisibility}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm leading-5 text-[var(--ep-field-icon)] hover:text-black transition-colors cursor-pointer"
                      title={visible ? "Sembunyikan sandi" : "Tampilkan sandi"}
                    >
                      {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  )}
                </section>
                {field.helperText && <p className="text-[10px] text-[var(--ep-text-muted)] mt-1">{field.helperText}</p>}
                {errors[field.label] && (
                  <p className="text-xs text-[var(--ep-magenta)] font-medium pt-0.5">{errors[field.label]}</p>
                )}
              </BoxReveal>
            </section>
          ))}
        </section>

        {noteSlot && (
          <BoxReveal width="100%" boxColor="var(--ep-accent)" duration={0.3} className="mb-3">
            {noteSlot}
          </BoxReveal>
        )}

        {errorField && (
          <BoxReveal width="100%" boxColor="var(--ep-accent)" duration={0.3}>
            <p className="mb-3 text-xs text-[var(--ep-magenta)] font-bold">{errorField}</p>
          </BoxReveal>
        )}

        <BoxReveal width="100%" boxColor="var(--ep-accent)" duration={0.3} overflow="visible">
          <button
            className="group/btn relative flex items-center justify-center gap-2 h-11 w-full rounded-xl bg-[var(--ep-accent)] font-display font-black text-xs uppercase tracking-wider text-black shadow-[0_0_24px_var(--ep-accent-glow)] outline-hidden hover:cursor-pointer hover:brightness-110 active:scale-[0.98] transition-all"
            type="submit"
          >
            <span>{submitButton}</span>
            <span className="font-sans font-bold text-sm">&rarr;</span>
            <BottomGradient />
          </button>
        </BoxReveal>

        {textVariantButton && goTo && (
          <BoxReveal boxColor="var(--ep-accent)" duration={0.3}>
            <section className="mt-4 text-center hover:cursor-pointer">
              <button className="text-sm text-[var(--ep-accent)] outline-hidden hover:cursor-pointer" onClick={goTo}>
                {textVariantButton}
              </button>
            </section>
          </BoxReveal>
        )}

        {secondaryAction && (
          <BoxReveal width="100%" boxColor="var(--ep-accent)" duration={0.3} className="mt-4 pt-4 border-t border-[var(--ep-card-border)]">
            {secondaryAction}
          </BoxReveal>
        )}
      </form>
    </section>
  );
});

const BottomGradient = () => (
  <>
    <span className="absolute -bottom-px inset-x-0 block h-px w-full bg-gradient-to-r from-transparent via-[var(--ep-accent)] to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
    <span className="absolute -bottom-px inset-x-10 mx-auto block h-px w-1/2 bg-gradient-to-r from-transparent via-[var(--ep-magenta)] to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
  </>
);

// ==================== AuthTabs ====================

interface AuthTabsProps {
  formFields: Omit<AnimatedFormProps, "onSubmit" | "goTo">;
  goTo?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  handleSubmit: (event: React.SyntheticEvent) => void;
}

const AuthTabs = memo(function AuthTabs({ formFields, goTo, handleSubmit }: AuthTabsProps) {
  return (
    <div className="flex w-full justify-center">
      <div className="flex h-full w-full flex-col items-center justify-center">
        <AnimatedForm {...formFields} fieldPerRow={1} onSubmit={handleSubmit} goTo={goTo} />
      </div>
    </div>
  );
});

// ==================== Label ====================

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  htmlFor?: string;
}

const Label = memo(function Label({ className, ...props }: LabelProps) {
  return <label className={cn("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className)} {...props} />;
});

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
};
export type { AnimatedFormProps, Field, IconConfig };
