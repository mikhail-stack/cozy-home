import Image from "next/image";
import type { ProductImages } from "@/types/product";

interface ProductGalleryProps {
  letter: string;
  images?: ProductImages;
}

// Компонента нет в docs/DESIGN.md (Nornorm — сайт без форм товара в
// референсе), стиль экстраполирован из общей системы: 0px радиус на
// фото (editorial-контент остаётся резким), без теней и рамок. Главное
// фото + два дополнительных (крупным планом, в интерьере) — реальные
// фото есть пока не у всех товаров, без них остаётся буквенная заглушка
// на Bone.
export function ProductGallery({ letter, images }: ProductGalleryProps) {
  if (!images) {
    return (
      <div className="flex aspect-square items-center justify-center bg-bone">
        <span className="font-lunar text-heading tracking-heading text-obsidian">{letter}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-16">
      <div className="relative aspect-square bg-bone">
        <Image
          src={images.main}
          alt={letter}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
        />
      </div>
      <div className="grid grid-cols-2 gap-16">
        <div className="relative aspect-square bg-bone">
          <Image
            src={images.detail}
            alt={`${letter} — крупным планом`}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover"
          />
        </div>
        <div className="relative aspect-square bg-bone">
          <Image
            src={images.interior}
            alt={`${letter} — в интерьере`}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover"
          />
        </div>
      </div>
    </div>
  );
}
