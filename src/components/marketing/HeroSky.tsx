import styles from "./HomeHero.module.css";

const stars = Array.from({ length: 150 }, (_, index) => ({
  x: (index * 613 + index * index * 11 + 31) % 1672,
  y: (index * 157 + index * index * 3 + 23) % 760,
  radius: index % 9 === 0 ? .9 : .45,
  opacity: .2 + (index % 7) * .08,
}));
const flares = [[84, 145], [405, 136], [76, 480], [1354, 475], [314, 424]];

export default function HeroSky() {
  return <>
    <svg className={styles.sky} viewBox="0 0 1672 900" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <radialGradient id="hirego-star-glow">
          <stop stopColor="#d8f4ff" />
          <stop offset=".12" stopColor="#7bd2ff" stopOpacity=".8" />
          <stop offset="1" stopColor="#1685ed" stopOpacity="0" />
        </radialGradient>
      </defs>
      {stars.map((star, index) => <circle key={index} cx={star.x} cy={star.y} r={star.radius} fill="#8dcaf6" opacity={star.opacity} />)}
      {flares.map(([x, y]) => <g key={`${x}-${y}`}>
        <circle cx={x} cy={y} r="11" fill="url(#hirego-star-glow)" />
        <path d={`M${x - 9} ${y}H${x + 9}M${x} ${y - 9}V${y + 9}`} stroke="#70c7ff" strokeWidth=".6" opacity=".7" />
        <circle cx={x} cy={y} r="1.15" fill="#dff8ff" />
      </g>)}
    </svg>
    <div className={styles.moon} aria-hidden="true" />
  </>;
}
