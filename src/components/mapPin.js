import L from 'leaflet';

// Custom navy/gold pin via divIcon — pure HTML/CSS, no image assets needed.
// Shared between the directory map and per-church profile map.
export function buildPinIcon(isSelected = false) {
  const size = isSelected ? 32 : 26;
  const ringColor = isSelected ? '#c89b3c' : '#1a3a52';
  const dotColor = isSelected ? '#1a3a52' : '#c89b3c';
  return L.divIcon({
    className: 'ch-pin',
    html: `
      <div style="
        width:${size}px;height:${size}px;
        border-radius:50% 50% 50% 0;
        background:${ringColor};
        transform:rotate(-45deg);
        box-shadow:0 4px 10px rgba(26,35,50,0.25);
        display:grid;place-items:center;
        border:2px solid #fbf8f3;
      ">
        <div style="
          width:${size / 3}px;height:${size / 3}px;
          background:${dotColor};
          border-radius:50%;
          transform:rotate(45deg);
        "></div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
  });
}
