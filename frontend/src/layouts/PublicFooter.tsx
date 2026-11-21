import { Link } from 'react-router-dom';
import { Building2, Mail, MapPin } from 'lucide-react';
import fptUniversityLogo from '../assets/fpt-university-logo.png';

const CONTACT_INFO = {
  organization: 'Trường Đại học FPT TP. Hồ Chí Minh',
  address: 'Lô E2a-7, Đường D1, Khu Công nghệ cao, P. Long Thạnh Mỹ, TP. Thủ Đức, TP. Hồ Chí Minh',
  email: 'tranxuankhoa777@gmail.com',
  githubDisplay: 'WindFaculty/SWP391_Self-Storage-Facility-Rental-and-Management-System',
  githubHref:
    'https://github.com/WindFaculty/SWP391_Self-Storage-Facility-Rental-and-Management-System',
};

export const PublicFooter = () => (
  <footer className="border-t border-border-hairline bg-surface">
    <div className="page-container px-4 py-8 sm:px-6 lg:px-10">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:items-start lg:gap-10">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:gap-5 md:col-span-6 lg:col-span-7">
          <Link
            to="/"
            className="inline-flex shrink-0 items-center justify-center rounded-xl border border-border-hairline bg-white px-3.5 py-2.5 shadow-sm focus-visible:outline-offset-4"
          >
            <img
              src={fptUniversityLogo}
              alt="Logo Trường Đại học FPT"
              width={225}
              height={88}
              loading="lazy"
              className="h-12 w-auto object-contain"
            />
          </Link>

          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to="/"
                className="text-[17px] font-bold tracking-[0.12em] text-primary transition-colors hover:text-primary-hover"
              >
                Kho Việt
              </Link>
              <span className="rounded-full bg-forest-tint px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                Đồ án SWP391
              </span>
            </div>
            <p className="text-body-medium text-text-main">
              Hệ thống cho thuê và quản lý kho tự lưu trữ
            </p>
            <p className="text-label text-text-muted">
              Self-Storage Facility Rental &amp; Management System
            </p>
            <p className="mt-1 max-w-lg text-table text-text-muted">
              Nền tảng tra cứu cơ sở, đặt kho trực tuyến, thanh toán VNPay và theo dõi hợp đồng lưu
              trữ minh bạch.
            </p>
          </div>
        </div>

        <div className="min-w-0 md:col-span-6 lg:col-span-5">
          <h2 className="text-badge font-semibold uppercase tracking-[0.14em] text-text-muted">
            Thông tin liên lạc
          </h2>
          <address className="mt-3 flex flex-col gap-2.5 not-italic text-table text-text-muted">
            <div className="flex items-start gap-2.5">
              <Building2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <span className="font-medium text-text-main">{CONTACT_INFO.organization}</span>
            </div>

            <div className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <span>{CONTACT_INFO.address}</span>
            </div>

            <a
              href={`mailto:${CONTACT_INFO.email}`}
              className="inline-flex w-fit items-center gap-2.5 transition-colors hover:text-primary"
            >
              <Mail className="size-4 shrink-0 text-primary" aria-hidden="true" />
              <span>{CONTACT_INFO.email}</span>
            </a>

            <a
              href={CONTACT_INFO.githubHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-start gap-2.5 transition-colors hover:text-primary"
            >
              <svg
                aria-hidden="true"
                focusable="false"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="mt-0.5 size-4 shrink-0 text-primary"
              >
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z" />
              </svg>
              <span className="min-w-0 break-words [overflow-wrap:anywhere]">
                {CONTACT_INFO.githubDisplay}
              </span>
            </a>
          </address>
        </div>
      </div>
    </div>
  </footer>
);
