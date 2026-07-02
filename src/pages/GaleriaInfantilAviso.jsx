import InfantilNoticeBanner from '../components/InfantilNoticeBanner';

export default function GaleriaInfantilAviso() {
  return (
    <div className="relative min-h-screen flex flex-col w-full">
      <div className="absolute inset-0 z-0 w-full h-full min-h-screen">
        <div
          className="w-full h-full min-h-screen absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, #ffe4ef 0%, #fffbe9 60%, #fff 100%)',
            opacity: 0.7,
          }}
        />
      </div>
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10 md:px-8">
        <div className="w-full max-w-5xl">
          <InfantilNoticeBanner />
        </div>
      </div>
    </div>
  );
}
