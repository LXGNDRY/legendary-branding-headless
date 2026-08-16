import {useEffect, useState} from 'react';
import {Image} from '@shopify/hydrogen';
import Button from '~/components/ui/Button';

type ImageData = {
  url: string;
  altText?: string | null;
  width?: number | null;
  height?: number | null;
};

interface DropTimerProps {
  eyebrow?: string;
  heading: string;
  description?: string;
  dropDate: string; // ISO date string
  buttonLabel?: string;
  buttonLink?: string;
  backgroundImage?: ImageData;
  productImage?: ImageData;
}

/**
 * LEGENDARY STREETWEAR — Drop Timer Section
 * Limited-edition countdown timer for product drops and restocks.
 * Ported from sections/lb-drop-timer.liquid
 */
export default function DropTimer({
  eyebrow = 'LIMITED DROP',
  heading,
  description,
  dropDate,
  buttonLabel = 'Set reminder',
  buttonLink,
  backgroundImage,
  productImage,
}: DropTimerProps) {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(dropDate));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft(dropDate));
    }, 1000);
    return () => clearInterval(interval);
  }, [dropDate]);

  function pad(n: number) {
    return n < 10 ? `0${n}` : `${n}`;
  }

  const bgStyle = backgroundImage
    ? {
        backgroundImage: `url(${backgroundImage.url})`,
      }
    : {};

  return (
    <section className="lb-section">
      <div className="lb-container">
        <div
          className="relative rounded-lg overflow-hidden bg-black text-white bg-cover bg-center min-h-[360px]"
          style={bgStyle}
        >
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-black/90 to-black/60 z-0" />

          <div className="relative z-10 grid md:grid-cols-[1.5fr_1fr] gap-12 items-center p-12 md:px-16 md:py-24">
            {/* Text side */}
            <div className="flex flex-col gap-4">
              <div className="lb-eyebrow !text-white/80">{eyebrow}</div>
              <h2 className="!text-white !text-[clamp(2rem,5vw,4.5rem)] uppercase font-bold tracking-tight leading-none">
                {heading}
              </h2>
              {description && (
                <p className="text-white/75 max-w-[50ch] leading-relaxed">
                  {description}
                </p>
              )}

              {/* Timer */}
              <div className="flex gap-3 items-start mt-4">
                <TimerUnit value={pad(timeLeft.days)} label="Days" />
                <TimerSep />
                <TimerUnit value={pad(timeLeft.hours)} label="Hours" />
                <TimerSep />
                <TimerUnit value={pad(timeLeft.minutes)} label="Min" />
                <TimerSep />
                <TimerUnit value={pad(timeLeft.seconds)} label="Sec" />
              </div>

              {buttonLabel && buttonLink && (
                <div className="mt-3">
                  <Button as="link" to={buttonLink} variant="solid" size="md">
                    {buttonLabel}
                  </Button>
                </div>
              )}
            </div>

            {/* Product image side */}
            {productImage && (
              <div className="flex items-center justify-center">
                <Image
                  data={productImage}
                  aspectRatio="1/1"
                  sizes="(max-width: 768px) 200px, 400px"
                  loading="lazy"
                  className="max-h-[340px] w-auto object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function TimerUnit({value, label}: {value: string; label: string}) {
  return (
    <div className="flex flex-col items-center gap-1 min-w-[60px]">
      <span className="font-mono text-[clamp(1.5rem,4vw,3rem)] font-semibold leading-none tracking-tight text-white">
        {value}
      </span>
      <span className="text-[0.65rem] uppercase tracking-[0.15em] opacity-50">
        {label}
      </span>
    </div>
  );
}

function TimerSep() {
  return (
    <span className="font-mono text-2xl opacity-30 leading-none mt-1">:</span>
  );
}

function calculateTimeLeft(dropDate: string) {
  const diff = new Date(dropDate).getTime() - Date.now();
  if (diff <= 0) {
    return {days: 0, hours: 0, minutes: 0, seconds: 0};
  }
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
  };
}
