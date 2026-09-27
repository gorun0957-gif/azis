import React from 'react';

interface BgnLogoProps {
  className?: string;
  size?: number;
}

export const BgnLogo: React.FC<BgnLogoProps> = ({ className = 'w-10 h-10', size = 44 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Logo Resmi Badan Gizi Nasional"
    >
      <defs>
        {/* Outer Circular Path for BADAN GIZI NASIONAL */}
        <path
          id="topTextPath"
          d="M 28,100 A 72,72 0 1,1 172,100"
          fill="none"
        />
        {/* Lower Circular Path for REPUBLIK INDONESIA */}
        <path
          id="bottomTextPath"
          d="M 172,100 A 72,72 0 0,1 28,100"
          fill="none"
        />
      </defs>

      {/* Outermost Gold Border Ring */}
      <circle cx="100" cy="100" r="97" fill="#0C1D48" stroke="#B8933D" strokeWidth="4.5" />
      <circle cx="100" cy="100" r="92" fill="#9CD6ED" stroke="#D4AF37" strokeWidth="1.5" />

      {/* Outer Blue Ring for Circular Inscription */}
      <circle cx="100" cy="100" r="70" fill="#0A183D" stroke="#B8933D" strokeWidth="3" />

      {/* Top Text: BADAN GIZI NASIONAL */}
      <text
        fill="#0A183D"
        fontSize="17.5"
        fontWeight="900"
        fontFamily="sans-serif"
        letterSpacing="3"
      >
        <textPath href="#topTextPath" startOffset="50%" textAnchor="middle">
          BADAN GIZI NASIONAL
        </textPath>
      </text>

      {/* Left and Right Navy Round Dots */}
      <circle cx="21" cy="100" r="5" fill="#0A183D" />
      <circle cx="179" cy="100" r="5" fill="#0A183D" />

      {/* Bottom Text: REPUBLIK INDONESIA */}
      <text
        fill="#0A183D"
        fontSize="15"
        fontWeight="900"
        fontFamily="sans-serif"
        letterSpacing="2.5"
      >
        <textPath href="#bottomTextPath" startOffset="50%" textAnchor="middle">
          REPUBLIK INDONESIA
        </textPath>
      </text>

      {/* Two Golden Human Figures with Raised Arms (Left and Right Silhouettes) */}
      {/* Left Human Silhouette */}
      <circle cx="58" cy="115" r="9" fill="#DEB162" />
      <path
        d="M50 155 C50 135, 62 130, 68 132 C72 120, 74 105, 74 100 C77 100, 79 104, 76 112 C74 120, 71 138, 71 155 Z"
        fill="#DEB162"
      />

      {/* Right Human Silhouette */}
      <circle cx="142" cy="115" r="9" fill="#DEB162" />
      <path
        d="M150 155 C150 135, 138 130, 132 132 C128 120, 126 105, 126 100 C123 100, 121 104, 124 112 C126 120, 129 138, 129 155 Z"
        fill="#DEB162"
      />

      {/* Center: Garuda Pancasila Symbol */}
      {/* Garuda Wings (Golden) */}
      <path
        d="M100 68 C82 50, 65 65, 66 98 C72 108, 88 114, 100 114 C112 114, 128 108, 134 98 C135 65, 118 50, 100 68 Z"
        fill="#F59E0B"
      />
      {/* Wing Feathers Detail */}
      <path
        d="M74 72 L64 88 L72 90 L62 102 L74 102 L66 112 L78 108 L100 115 L122 108 L134 112 L126 102 L138 102 L128 90 L136 88 L126 72 Z"
        fill="#D97706"
        opacity="0.8"
      />

      {/* Garuda Head and Neck */}
      <circle cx="100" cy="74" r="7" fill="#F59E0B" />
      {/* Beak facing right */}
      <path d="M104 72 L112 75 L104 78 Z" fill="#FBBF24" stroke="#B45309" strokeWidth="0.5" />
      {/* Eye */}
      <circle cx="103" cy="73.5" r="1" fill="#78350F" />

      {/* Indonesian National Shield (Perisai Pancasila) */}
      <path
        d="M89 85 C89 83, 111 83, 111 85 C111 102, 104 109, 100 112 C96 109, 89 102, 89 85 Z"
        fill="#DC2626"
        stroke="#FFFFFF"
        strokeWidth="1.5"
      />
      {/* White Half of Shield */}
      <path
        d="M100 85 L111 85 C111 102, 104 109, 100 112 Z"
        fill="#FFFFFF"
      />
      {/* Red Half of Shield */}
      <path
        d="M89 85 L100 85 L100 112 C96 109, 89 102, 89 85 Z"
        fill="#DC2626"
      />

      {/* Golden Star in Center of Shield */}
      <path
        d="M100 94 L101.5 97.5 L105 97.5 L102 99.5 L103 103 L100 101 L97 103 L98 99.5 L95 97.5 L98.5 97.5 Z"
        fill="#FBBF24"
        stroke="#78350F"
        strokeWidth="0.3"
      />

      {/* Bhinneka Tunggal Ika White Ribbon */}
      <path
        d="M74 122 L126 122 L121 127 L100 125 L79 127 Z"
        fill="#FFFFFF"
        stroke="#D97706"
        strokeWidth="0.7"
      />
      <text
        x="100"
        y="125"
        textAnchor="middle"
        fontSize="3.8"
        fontWeight="bold"
        fill="#1E293B"
        fontFamily="sans-serif"
      >
        BHINNEKA TUNGGAL IKA
      </text>

      {/* Two Vibrant Green Leaves at Bottom */}
      <path
        d="M100 148 C90 140, 72 142, 68 155 C82 165, 96 158, 100 148 Z"
        fill="#66C636"
        stroke="#3F8220"
        strokeWidth="0.8"
      />
      <path
        d="M100 148 C110 140, 128 142, 132 155 C118 165, 104 158, 100 148 Z"
        fill="#7ED94C"
        stroke="#3F8220"
        strokeWidth="0.8"
      />
      <path
        d="M100 162 L100 148"
        stroke="#3F8220"
        strokeWidth="1.5"
      />
    </svg>
  );
};
