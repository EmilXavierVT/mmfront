import {
  TweaksPanel,
  TweakSection,
  TweakRadio,
  TweakSelect,
  TweakColor,
  TweakToggle,
} from '../tweaks-panel.jsx';

export function TweaksUI({ tweaks, setTweak }) {
  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Hero">
        <TweakRadio label="Hero copy" value={tweaks.heroVariant} options={[
          {value:'bold', label:'Bold'},
          {value:'warm', label:'Warm'},
          {value:'punchy', label:'Punchy'},
        ]} onChange={v=>setTweak('heroVariant', v)} />
        <TweakSelect label="Hero image" value={tweaks.heroImage} options={[
          {value:'hero-cover.webp', label:'Plated dish'},
          {value:'catering-hero.webp', label:'Catering scene'},
          {value:'cleaning-hero.webp', label:'Clean home'},
        ]} onChange={v=>setTweak('heroImage', v)} />
      </TweakSection>
      <TweakSection label="Color accents">
        <TweakColor label="Accent (pink)" value={tweaks.accentPink} onChange={v=>setTweak('accentPink', v)} />
        <TweakColor label="Accent (blue)" value={tweaks.accentBlue} onChange={v=>setTweak('accentBlue', v)} />
      </TweakSection>
      <TweakSection label="Layout">
        <TweakToggle label="Show trust strip" value={tweaks.showTrust} onChange={v=>setTweak('showTrust', v)} />
      </TweakSection>
    </TweaksPanel>
  );
}
