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
  const emailHref = buildEmailHref(settings.email);
  const phoneHref = buildPhoneHref(settings.phone);

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
          {settings.email && (
            <p>
              Email: <a href={emailHref}>{settings.email}</a>
            </p>
          )}
          {settings.phone && (
            <p>
              Телефон: <a href={phoneHref}>{settings.phone}</a>
            </p>
          )}
          {settings.address && <p>Адрес: {settings.address}</p>}
          {socialLinks.length > 0 && (
            <div className="footer-links">
              {socialLinks.map((item) => (
                <span key={item.label}>{renderSocialLink(item)}</span>
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

/**
 * Render a social link and replace Telegram text with icon.
 */
function renderSocialLink(link: SocialLink) {
  const isTelegram = link.label === "Telegram";
  return (
    <a
      href={link.href}
      target="_blank"
      rel="noreferrer"
      aria-label={link.label}
      title={link.label}
    >
      {isTelegram ? renderTelegramIcon() : link.label}
    </a>
  );
}

/**
 * Render Telegram icon with current color.
 */
function renderTelegramIcon() {
  return (
    <span className="footer-icon" aria-hidden="true">
      <svg viewBox="0 0 16 16" role="img">
        <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8.287 5.906c-.778.324-2.334.994-4.666 2.01-.378.15-.577.298-.595.442-.03.243.275.339.69.47l.175.055c.408.133.958.288 1.243.294.26.006.549-.1.868-.32 2.179-1.471 3.304-2.214 3.374-2.23.05-.012.12-.026.166.016.047.041.042.12.037.141-.03.129-1.227 1.241-1.846 1.817-.193.18-.33.307-.358.336a8.154 8.154 0 0 1-.188.186c-.38.366-.664.64.015 1.088.327.216.589.393.85.571.284.194.568.387.936.629.093.06.183.125.27.187.331.236.63.448.997.414.214-.02.435-.22.547-.82.265-1.417.786-4.486.906-5.751a1.426 1.426 0 0 0-.013-.315.337.337 0 0 0-.114-.217.526.526 0 0 0-.31-.093c-.3.005-.763.166-2.984 1.09z" />
      </svg>
    </span>
  );
}

/**
 * Build a mailto link from the email value.
 */
function buildEmailHref(email?: string | null) {
  return email ? `mailto:${email}` : "";
}

/**
 * Build a tel link from the phone value.
 */
function buildPhoneHref(phone?: string | null) {
  if (!phone) return "";
  const normalized = phone.replace(/[^\d+]/g, "");
  return `tel:${normalized || phone}`;
}
