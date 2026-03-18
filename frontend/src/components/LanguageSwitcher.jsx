import { useLanguage } from '../context/LanguageContext';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="language-switcher">
      <button className={language === 'en' ? 'active' : ''} onClick={() => setLanguage('en')}>EN</button>
      <button className={language === 'uk' ? 'active' : ''} onClick={() => setLanguage('uk')}>UA</button>
      <button className={language === 'cs' ? 'active' : ''} onClick={() => setLanguage('cs')}>CZ</button>
    </div>
  );
}
