import {useEffect, useState} from 'react';
import {Image} from '@shopify/hydrogen';

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
  dropDate: string;
  buttonLabel?: string;
  buttonLink?: string;
  backgroundImage?: ImageData;
  productImage?: ImageData;
}

/**
 * HANSSEN — Drop Timer Section
 * Editorial countdown with serif display numbers, dark background, red accent.
 */
export default function DropTimer({
  eyebrow = 'Limited Drop',
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
    <section className="h-section h-reveal">
      <div className="h-container">
        <div
          className="relative overflow-hidden bg-[#1A1A1A] text-[#FAF9F6] bg-cover bg-center"
          style={bgStyle}
        >
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#1A1A1A]/95 to-[#1A1A1A]/70 z-0" />

          <div className="relative z-10 grid md:grid-cols-[1.5fr_1fr] gap-12 items-center px-8 md:px-16 py-16 md:py-24">
            {/* Text side */}
            <div className="flex flex-col gap-4">
              <p className="h-eyebrow text-[#9E9C97]">{eyebrow}</p>
              <h2 className="text-[clamp(2rem,5vw,4.5rem)] leading-[0.95] font-serif font-normal">
                {heading}
              </h2>
              {description && (
                <p className="text-[#FAF9F6]/70 max-w-[50ch] leading-relaxed">
                  {description}
                </p>
              )}

              {/* Timer */}
              <div className="flex gap-2 md:gap-4 items-start mt-4">
                <TimerUnit value={pad(timeLeft.days)} label="Days" />
                <TimerSep />
                <TimerUnit value={pad(timeLeft.hours)} label="Hours" />
                <TimerSep />
                <TimerUnit value={pad(timeLeft.minutes)} label="Min" />
                <TimerSep />
                <TimerUnit value={pad(timeLeft.seconds)} label="Sec" />
              </div>

              {buttonLabel && buttonLink && (
                <div className="mt-4">
                  <a href={buttonLink} className="h-btn-primary">
                    {buttonLabel}
                  </a>
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
                  className="max-h-[340px] w-auto object-contain"
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
      <span className="text-[clamp(2rem,5vw,3.5rem)] font-serif leading-none text-[#FF3B30]">
        {value}
      </span>
      <span className="h-eyebrow text-[#9E9C97]">
        {label}
      </span>
    </div>
  );
}

function TimerSep() {
  return (
    <span className="text-2xl font-serif text-[#9E9C97] leading-none mt-2">:</span>
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
