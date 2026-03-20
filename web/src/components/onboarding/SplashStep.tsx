import { SplashBg } from "../ui/SplashBg";
import styles from "./SplashStep.module.css";

const IMG = import.meta.env.BASE_URL + "images/";

interface Props {
  onNext: () => void;
}

export function SplashStep({ onNext }: Props) {
  return (
    <SplashBg>
      <div className={styles.container}>
        <img
          src={`${IMG}logo-splash.webp`}
          alt="EthCC Sofia"
          className={styles.logo}
        />
        <h1 className={styles.title}>EthCC[9]</h1>
        <p className={styles.subtitle}>Sofia Manager</p>
        <p className={styles.date}>Cannes &middot; Mar 30 &ndash; Apr 2, 2026</p>
      </div>
      <button className={styles.startBtn} onClick={onNext}>
        Get Started
      </button>
    </SplashBg>
  );
}
