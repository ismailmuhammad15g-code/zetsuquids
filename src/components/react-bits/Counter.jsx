// Using framer-motion as it is installed as 'framer-motion'
import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";

import "./Counter.css";

function Number({ mv, number, height }) {
  let y = useTransform(mv, (latest) => {
    let placeValue = latest % 10;
    let offset = (10 + number - placeValue) % 10;
    let memo = offset * height;
    if (offset > 5) {
      memo -= 10 * height;
    }
    return memo;
  });
  return (
    <motion.span className="counter-number" style={{ y }}>
      {number}
    </motion.span>
  );
}

function Digit({ place, value, height, digitStyle }) {
  const isDecimal = place === ".";
  // Round to place to avoid float issues
  const valueRoundedToPlace = isDecimal ? 0 : Math.floor(value / place); // This works for integers "1 2 3"
  const animatedValue = useSpring(valueRoundedToPlace, {
    stiffness: 100,
    damping: 30,
    mass: 1,
  });

  useEffect(() => {
    if (!isDecimal) {
      animatedValue.set(valueRoundedToPlace);
    }
  }, [animatedValue, valueRoundedToPlace, isDecimal]);

  if (isDecimal) {
    return (
      <span
        className="counter-digit"
        style={{ height, ...digitStyle, width: "fit-content" }}
      >
        .
      </span>
    );
  }

  return (
    <span className="counter-digit" style={{ height, ...digitStyle }}>
      {Array.from({ length: 10 }, (_, i) => (
        <Number key={i} mv={animatedValue} number={i} height={height} />
      ))}
    </span>
  );
}

export default function Counter({
  value,
  fontSize = 100,
  padding = 0,
  places,
  gap = 8,
  borderRadius = 4,
  horizontalPadding = 8,
  textColor = "inherit",
  fontWeight = "inherit",
  containerStyle,
  counterStyle,
  digitStyle,
  gradientHeight = 16,
  gradientFrom = "black",
  gradientTo = "transparent",
  topGradientStyle,
  bottomGradientStyle,
}) {
  // If places is not provided, generate roughly enough for the number
  // For seconds counter "1 2 3", we want 1s, 10s, 100s, 1000s etc
  const derivedPlaces =
    places ||
    (() => {
      const valStr = Math.floor(value).toString();
      // Generate array of powers of 10 in descending order: [100, 10, 1] for 123
      return Array.from({ length: valStr.length }, (_, i) =>
        Math.pow(10, valStr.length - i - 1),
      );
    })();

  const height = fontSize + padding;
  const defaultCounterStyle = {
    fontSize,
    gap: gap,
    borderRadius: borderRadius,
    paddingLeft: horizontalPadding,
    paddingRight: horizontalPadding,
    color: textColor,
    fontWeight: fontWeight,
  };
  const defaultTopGradientStyle = {
    height: gradientHeight,
    background: `linear-gradient(to bottom, ${gradientFrom}, ${gradientTo})`,
  };
  const defaultBottomGradientStyle = {
    height: gradientHeight,
    background: `linear-gradient(to top, ${gradientFrom}, ${gradientTo})`,
  };
  return (
    <span className="counter-container" style={containerStyle}>
      <span
        className="counter-counter"
        style={{ ...defaultCounterStyle, ...counterStyle }}
      >
        {derivedPlaces.map((place, index) => (
          <Digit
            key={index}
            place={place}
            value={value}
            height={height}
            digitStyle={digitStyle}
          />
        ))}
      </span>
      <span className="gradient-container">
        <span
          className="top-gradient"
          style={topGradientStyle ? topGradientStyle : defaultTopGradientStyle}
        ></span>
        <span
          className="bottom-gradient"
          style={
            bottomGradientStyle
              ? bottomGradientStyle
              : defaultBottomGradientStyle
          }
        ></span>
      </span>
    </span>
  );
}
