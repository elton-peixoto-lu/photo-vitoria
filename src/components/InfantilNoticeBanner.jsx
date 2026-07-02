import { BotaoInstagram, BotaoWhatsapp } from './ContatoInfo';
import {
  INFANTIL_NOTICE_COPY,
  INFANTIL_NOTICE_DISCLAIMER,
  INFANTIL_NOTICE_SERVICES,
  INFANTIL_NOTICE_TITLE,
} from '../galleryConfig';

export default function InfantilNoticeBanner({ className = '' }) {
  return (
    <section className={`w-full rounded-[28px] border border-pink-200/70 bg-white/85 px-6 py-6 shadow-lg ${className}`}>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-pink-400">Aviso importante</p>
          <h2 className="mt-3 text-2xl font-bold text-pink-500 md:text-3xl">{INFANTIL_NOTICE_TITLE}</h2>
          <p className="mt-4 text-base leading-7 text-gray-700">{INFANTIL_NOTICE_COPY}</p>
          <p className="mt-4 text-sm leading-7 text-gray-700">
            Seguimos oferecendo <strong>{INFANTIL_NOTICE_SERVICES.join(', ')}</strong>.
          </p>
          <p className="mt-4 rounded-2xl border border-pink-100 bg-pink-50/70 px-4 py-4 text-sm leading-7 text-gray-700">
            {INFANTIL_NOTICE_DISCLAIMER}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-3">
          <BotaoWhatsapp />
          <BotaoInstagram />
        </div>
      </div>
    </section>
  );
}
