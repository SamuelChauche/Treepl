import { SplashBg } from "../ui/SplashBg";
import { Dots } from "../ui/Dots";
import styles from "./SlideStep.module.css";

const IMG = import.meta.env.BASE_URL + "images/";

const SLIDES = [
  {
    image: `${IMG}slide-interests.webp`,
    title: "Share what\nyou love",
    subtitle: "Your interests, on-chain.",
    size: 360,
  },
  {
    image: `${IMG}slide-sessions.webp`,
    title: "Find the best\nsessions",
    subtitle: "310+ talks, workshops & panels.",
    size: 360,
  },
  {
    image: `${IMG}slide-vibes.webp`,
    title: "Meet your\nvibe matches",
    subtitle: "Connect with nearby attendees.",
    size: 842,
  },
];

// Preload images
SLIDES.forEach((s) => { const img = new Image(); img.src = s.image; });

interface Props {
  /** 1-indexed slide number (1, 2, or 3) */
  slideIndex: number;
  onNext: () => void;
}

export function SlideStep({ slideIndex, onNext }: Props) {
  const slide = SLIDES[slideIndex - 1];
  if (!slide) return null;

  return (
    <SplashBg>
      <div className={styles.imageWrap}>
        <img
          src={slide.image}
          alt={slide.title}
          loading="eager"
          className={styles.image}
          style={{ width: slide.size }}
        />
      </div>
      <div className={styles.footer}>
        <Dots n={3} a={slideIndex - 1} />
        <h2 className={styles.title}>{slide.title}</h2>
        <p className={styles.subtitle}>{slide.subtitle}</p>
        <button className={styles.nextBtn} onClick={onNext}>
          Next
        </button>
      </div>
    </SplashBg>
  );
}
