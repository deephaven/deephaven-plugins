import React from 'react';
import Confetti from 'react-confetti';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export default function FishConfetti(
  props: Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any
): JSX.Element {
  return (
    <Confetti
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
      drawShape={ctx => {
        // Draw a fish shape
        ctx.beginPath();

        // Body - an ellipse
        ctx.ellipse(0, 0, 10, 5, 0, 0, 2 * Math.PI);

        // Tail - two triangles
        ctx.moveTo(-10, 0); // tail base
        ctx.lineTo(-15, 5); // upper fin
        ctx.lineTo(-15, -5); // lower fin
        ctx.lineTo(-10, 0); // close tail

        ctx.fill(); // or ctx.stroke() for outlined fish
        ctx.closePath();
      }}
    />
  );
}
