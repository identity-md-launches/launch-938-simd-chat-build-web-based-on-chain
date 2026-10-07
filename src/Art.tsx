import type { CSSProperties } from "react";

export function Icon({
  name,
  size = 20,
  className = "",
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const paths: Record<string, React.ReactNode> = {
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="2" />
        <rect x="14" y="3" width="7" height="7" rx="2" />
        <rect x="3" y="14" width="7" height="7" rx="2" />
        <rect x="14" y="14" width="7" height="7" rx="2" />
      </>
    ),
    wallet: (
      <>
        <path d="M20 8V5a2 2 0 0 0-2-2H5a3 3 0 0 0 0 6h15v11H5a3 3 0 0 1-3-3V6" />
        <path d="M21 12h-6v5h6z" />
        <path d="M17 14.5h.01" />
      </>
    ),
    arrow: (
      <>
        <path d="M4 12h16M14 6l6 6-6 6" />
      </>
    ),
    chevron: <path d="m9 5 7 7-7 7" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    help: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M9.5 8.5a2.5 2.5 0 0 1 5 0c0 2-2.5 2-2.5 4M12 16h.01" />
      </>
    ),
    link: (
      <>
        <path
          d="m10 13 4-4M8 16l-1 1a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0M16 8l1-1a4 4 0 0 1 6 6l-5 5a4 4 0 0 1-6 0"
          transform="translate(0 1) scale(.95)"
        />
      </>
    ),
    shield: (
      <>
        <path d="m12 2 8 4v6c0 5-8 10-8 10S4 17 4 12V6z" />
        <path d="m8 12 3 3 5-6" />
      </>
    ),
    dice: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="4" />
        <path
          d="M7 7h.01M17 7h.01M12 12h.01M7 17h.01M17 17h.01"
          strokeWidth="3"
        />
      </>
    ),
    history: (
      <>
        <path d="M3 11a9 9 0 1 1 2 7M3 4v7h7M12 7v5l3 2" />
      </>
    ),
    trophy: (
      <>
        <path d="M7 3h10v6c0 8-10 8-10 0zM7 5H3v3c0 3 4 4 4 4M17 5h4v3c0 3-4 4-4 4M12 15v6M8 21h8" />
      </>
    ),
    people: (
      <>
        <circle cx="9" cy="7" r="3" />
        <path d="M3 21v-4a6 6 0 0 1 12 0v4M16 4a3 3 0 0 1 0 6M18 13c3 0 4 3 4 5v3" />
      </>
    ),
    flag: (
      <>
        <path d="M5 22V3c5-5 9 5 14 0v10c-5 5-9-5-14 0" />
      </>
    ),
    hut: (
      <>
        <path d="m2 11 10-9 10 9M5 9v12h14V9M10 21v-7h4v7" />
      </>
    ),
    leaf: (
      <>
        <path d="M4 20C-2 8 10 2 21 3c0 12-5 19-17 17ZM4 20 16 8M9 15v-5M9 15h5" />
      </>
    ),
    palm: (
      <>
        <path d="M12 9 9 22M12 9C8 2 2 4 2 9c5-3 7-2 10 0ZM12 9c0-8 8-7 10-1-4-1-7-1-10 1ZM12 9C7 8 3 12 4 16c2-3 5-5 8-7ZM12 9c7 0 9 4 9 8-3-4-5-6-9-8Z" />
      </>
    ),
    water: (
      <>
        <path d="M2 10c3 4 4-4 7 0s4-4 7 0 4-4 7 0M2 16c3 4 4-4 7 0s4-4 7 0 4-4 7 0M5 4h13" />
      </>
    ),
    temple: (
      <>
        <path d="M2 21h20M4 21v-4h16v4M7 17v-5h10v5M9 12V7h6v5M12 2v5M7 7h10" />
      </>
    ),
    mountain: (
      <>
        <path d="m2 21 9-18 11 18ZM7 11l4 2 4-2" />
      </>
    ),
    jail: (
      <>
        <rect x="4" y="4" width="16" height="18" rx="3" />
        <path d="M8 4v18M12 4v18M16 4v18M4 10h16" />
      </>
    ),
    rest: (
      <>
        <path d="M3 9c3 12 15 12 18 0M3 4v17M21 4v17M8 4h6l-6 5h6" />
      </>
    ),
    chest: (
      <>
        <rect x="3" y="9" width="18" height="12" rx="2" />
        <path d="M3 13h18M7 9V5c0-3 10-3 10 0v4M10 12v4h4v-4" />
      </>
    ),
    chance: (
      <>
        <path d="M8 7a4 4 0 1 1 6 4c-2 1-2 2-2 4M12 19h.01" strokeWidth="3" />
        <path d="m3 3 1 1M20 3l-1 1M3 18l1-1M20 18l-1-1" />
      </>
    ),
    refresh: (
      <>
        <path d="M20 8A8 8 0 0 0 5 5L2 8M2 2v6h6M4 16a8 8 0 0 0 15 3l3-3M16 16h6v6" />
      </>
    ),
    check: <path d="m5 12 4 4L20 5" />,
  };
  if (name === "banana") return <Banana size={size} />;
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] ?? paths.leaf}
    </svg>
  );
}
export function Banana({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <path
        d="M25 5C25 20 15 24 5 17c3 13 23 14 24-8z"
        fill="#f8cd48"
        stroke="#b68b24"
        strokeWidth="1.3"
      />
      <path
        d="M5 17 3 18M25 5l3-2M10 24c10 3 15-5 16-11"
        fill="none"
        stroke="#93672c"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
export function Monkey({
  variant = "green",
  className = "",
  hero = false,
}: {
  variant?: string;
  className?: string;
  hero?: boolean;
}) {
  const scarf = variant === "green" ? "#527e4b" : "#df8549";
  return (
    <svg
      className={className}
      viewBox={hero ? "0 0 300 270" : "60 20 180 170"}
      fill="none"
      aria-hidden="true"
    >
      {hero && (
        <>
          <ellipse
            cx="150"
            cy="255"
            rx="81"
            ry="10"
            fill="#365e37"
            opacity=".12"
          />
          <path
            d="M207 232c63 2 76-65 42-65-26 0-22 28-6 24"
            stroke="#654128"
            strokeWidth="15"
            strokeLinecap="round"
          />
          <path
            d="M94 182 73 226q-15 24 10 24l37-41M204 182l18 43q12 25-10 27l-40-45"
            fill="#895c37"
            stroke="#523a26"
            strokeWidth="4"
          />
          <path
            d="M113 224 97 249c-5 12 38 11 40 4l6-24M181 224l18 25c6 12-37 12-40 4l-5-24"
            fill="#b37e49"
            stroke="#523a26"
            strokeWidth="4"
          />
          <path
            d="M107 155c-22 28-22 74 6 85 30 9 62 7 83-10 12-25-3-57-12-74"
            fill="#c3be86"
            stroke="#523a26"
            strokeWidth="4"
          />
          <path
            d="M112 183h22v23h-22zM165 183h21v23h-21z"
            fill="#a4a370"
            stroke="#6a6747"
            strokeWidth="2"
          />
          <path d="M150 176v66" stroke="#6a6747" strokeWidth="2" />
          <circle cx="155" cy="209" r="3" fill="#685a35" />
        </>
      )}
      <circle
        cx="78"
        cy="97"
        r="24"
        fill="#a67543"
        stroke="#523a26"
        strokeWidth="4"
      />
      <circle cx="78" cy="97" r="14" fill="#eac28c" />
      <circle
        cx="222"
        cy="97"
        r="24"
        fill="#a67543"
        stroke="#523a26"
        strokeWidth="4"
      />
      <circle cx="222" cy="97" r="14" fill="#eac28c" />
      <path
        d="M83 91C76 11 213 5 221 86c12 60-22 91-70 93-48-2-81-30-68-88"
        fill="#87562f"
        stroke="#523a26"
        strokeWidth="4"
      />
      <path
        d="M150 71c-40-53-89 32-47 80 21 29 71 29 95 1 39-48-9-130-48-81"
        fill="#f1d3a1"
      />
      <ellipse cx="123" cy="100" rx="8" ry="11" fill="#352b21" />
      <ellipse cx="179" cy="100" rx="8" ry="11" fill="#352b21" />
      <circle cx="125" cy="97" r="2.7" fill="white" />
      <circle cx="181" cy="97" r="2.7" fill="white" />
      <path
        d="M110 82q10-8 19-1M170 81q10-8 19 0"
        stroke="#694428"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <ellipse cx="151" cy="118" rx="11" ry="7" fill="#ad794c" />
      <path
        d="M124 132q25 38 54-1c-15 9-35 10-54 1"
        fill="#523426"
        stroke="#523426"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M138 148q14-9 27-1"
        stroke="#e7947c"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <ellipse cx="108" cy="125" rx="11" ry="6" fill="#e8a27c" opacity=".65" />
      <ellipse cx="194" cy="125" rx="11" ry="6" fill="#e8a27c" opacity=".65" />
      {hero ? (
        <>
          <path
            d="M96 37C103-9 199-6 207 38l13 7c19 18-151 30-149 10z"
            fill="#d8b678"
            stroke="#523a26"
            strokeWidth="4"
          />
          <path
            d="M96 35q51 17 111 0l2 12q-62 19-116 0z"
            fill="#476d42"
            stroke="#523a26"
            strokeWidth="3"
          />
          <path
            d="M114 172q37 20 75-2l-20 25-21-16-18 17z"
            fill={scarf}
            stroke="#355335"
            strokeWidth="3"
          />
          <path
            d="M203 213c-1 20-19 31-34 18 6 22 43 18 46-13z"
            fill="#f9cf49"
            stroke="#99742d"
            strokeWidth="3"
          />
          <path d="m210 214 3-9" stroke="#614e2c" strokeWidth="4" />
        </>
      ) : (
        <path d="M102 165q48 22 96 0l-14 21h-63z" fill={scarf} />
      )}
    </svg>
  );
}
export function Jungle({
  className = "",
  flip = false,
}: {
  className?: string;
  flip?: boolean;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 140 210"
      aria-hidden="true"
      style={{ "--flip": flip ? -1 : 1 } as CSSProperties}
    >
      <path
        d="M72 207q-4-87 30-158"
        fill="none"
        stroke="#63866a"
        strokeWidth="4"
      />
      <path
        d="M77 165C22 170 4 130 9 99c48 5 78 27 68 66M85 127C44 122 24 83 37 58c37 9 55 31 48 69M98 90C70 68 64 29 85 7c25 23 28 51 13 83M90 146c-2-55 24-70 49-72 6 43-10 68-49 72M79 190c10-55 40-57 57-58 0 44-17 64-57 58"
        fill="#8eaf82"
      />
      <path
        d="m77 165-44-37M85 126 55 85M97 86 88 32M91 144l29-46M82 187l38-36"
        stroke="#63866a"
        strokeWidth="2"
        fill="none"
      />
    </svg>
  );
}
export function Dice({ value }: { value: number }) {
  const positions: Record<number, number[]> = {
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8],
  };
  return (
    <span className="die" aria-label={`${value}`} role="img">
      {Array.from({ length: 9 }, (_, i) => (
        <i key={i} className={positions[value].includes(i) ? "pip" : ""} />
      ))}
    </span>
  );
}
