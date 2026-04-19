import { useEffect, useState } from "react";

// Define the possible screen sizes
type ScreenSizeType = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

// Size order mapping
const sizeOrder: Record<ScreenSizeType, number> = {
  xs: 0,
  sm: 1,
  md: 2,
  lg: 3,
  xl: 4,
  "2xl": 5,
};

class ComparableScreenSize {
  private value: ScreenSizeType;

  constructor(value: ScreenSizeType) {
    this.value = value;
  }

  toString(): string {
    return this.value;
  }

  valueOf(): number {
    return sizeOrder[this.value];
  }

  equals(other: ScreenSizeType): boolean {
    return this.value === other;
  }

  lessThan(other: ScreenSizeType): boolean {
    return this.valueOf() < sizeOrder[other];
  }

  greaterThan(other: ScreenSizeType): boolean {
    return this.valueOf() > sizeOrder[other];
  }

  lessThanOrEqual(other: ScreenSizeType): boolean {
    return this.valueOf() <= sizeOrder[other];
  }

  greaterThanOrEqual(other: ScreenSizeType): boolean {
    return this.valueOf() >= sizeOrder[other];
  }
}

const useScreenSize = (): ComparableScreenSize => {
  const [screenSize, setScreenSize] = useState<ScreenSizeType>("xs");

  useEffect(() => {
    const handleResize = (): void => {
      const width = window.innerWidth;

      if (width >= 1536) {
        setScreenSize("2xl");
      } else if (width >= 1280) {
        setScreenSize("xl");
      } else if (width >= 1024) {
        setScreenSize("lg");
      } else if (width >= 768) {
        setScreenSize("md");
      } else if (width >= 640) {
        setScreenSize("sm");
      } else {
        setScreenSize("xs");
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return new ComparableScreenSize(screenSize);
};

export default useScreenSize;
