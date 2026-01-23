type SiteSettings = {
  telegram?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  company_name?: string | null;
  legal_address?: string | null;
  inn?: string | null;
  ogrn?: string | null;
  kpp?: string | null;
  policy_url?: string | null;
  vk_url?: string | null;
  telegram_url?: string | null;
  youtube_url?: string | null;
  instagram_url?: string | null;
};

type SocialLink = {
  label: string;
  href: string;
};

/**
 * Render the site footer with legal and social links.
 */
export default function SiteFooter({ settings }: { settings: SiteSettings }) {
  const socialLinks = buildSocialLinks(settings);
  const policyUrl = settings.policy_url ?? "";

  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <strong>TeleAgent</strong>
          <p>Трансформация бизнеса с AI под ключ.</p>
        </div>
        <div>
          <strong>Контакты</strong>
          {settings.telegram && <p>Telegram: {settings.telegram}</p>}
          {settings.email && <p>Email: {settings.email}</p>}
          {settings.phone && <p>Телефон: {settings.phone}</p>}
          {settings.address && <p>Адрес: {settings.address}</p>}
          {socialLinks.length > 0 && (
            <div className="footer-links">
              {socialLinks.map((item) => (
                <a key={item.label} href={item.href} target="_blank" rel="noreferrer">
                  {item.label}
                </a>
              ))}
            </div>
          )}
        </div>
        <div>
          <strong>Реквизиты</strong>
          {settings.company_name && <p>{settings.company_name}</p>}
          {settings.legal_address && <p>{settings.legal_address}</p>}
          {settings.inn && <p>ИНН: {settings.inn}</p>}
          {settings.kpp && <p>КПП: {settings.kpp}</p>}
          {settings.ogrn && <p>ОГРН: {settings.ogrn}</p>}
          {policyUrl && (
            <div className="footer-links">
              <a href={policyUrl} target="_blank" rel="noreferrer">
                Политика обработки персональных данных
              </a>
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}

/**
 * Build social links list from settings.
 */
function buildSocialLinks(settings: SiteSettings): SocialLink[] {
  const links: SocialLink[] = [];
  if (settings.telegram_url) {
    links.push({ label: "Telegram", href: settings.telegram_url });
  }
  if (settings.vk_url) {
    links.push({ label: "VK", href: settings.vk_url });
  }
  if (settings.youtube_url) {
    links.push({ label: "YouTube", href: settings.youtube_url });
  }
  if (settings.instagram_url) {
    links.push({ label: "Instagram", href: settings.instagram_url });
  }
  return links;
}
