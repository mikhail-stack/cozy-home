import Image from "next/image";
import Link from "next/link";

// Next.js App Router сам оборачивает not-found.tsx в корневой layout —
// Header/Footer подключать здесь не нужно, они уже снаружи.
export default function NotFound() {
  return (
    <div className="flex flex-col items-center gap-24 px-24 py-64 text-center">
      <Image
        src="/404.png"
        alt=""
        width={1672}
        height={941}
        priority
        className="w-full max-w-[480px]"
      />
      <h1 className="font-lunar text-heading-sm tracking-heading-sm text-obsidian">
        Страница не найдена
      </h1>
      <p className="max-w-[480px] font-lunar text-body-sm tracking-body-sm text-stone">
        Такой страницы нет — возможно, её переместили или адрес введён с ошибкой.
      </p>
      <Link
        href="/"
        className="rounded-md bg-cobalt-ink px-24 py-12 font-lunar text-body-sm tracking-body-sm font-medium text-canvas-white hover:opacity-90"
      >
        На главную
      </Link>
    </div>
  );
}
