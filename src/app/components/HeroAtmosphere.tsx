export function HeroAtmosphere() {
  return (
    <div className="hero-atmosphere" aria-hidden="true">
      <span className="hero-atmosphere__orb hero-atmosphere__orb--teal" />
      <span className="hero-atmosphere__orb hero-atmosphere__orb--sunset" />

      <span className="hero-atmosphere__compass">
        <span className="hero-atmosphere__needle" />
      </span>

      <span className="hero-atmosphere__route">
        <span className="hero-atmosphere__marker" />
      </span>
    </div>
  );
}
