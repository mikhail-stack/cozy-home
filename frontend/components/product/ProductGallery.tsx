interface ProductGalleryProps {
  letter: string;
}

// Одно плейсхолдер-фото вместо галереи с миниатюрами из ТЗ — нескольких
// изображений на товар пока нет (появятся с загрузкой в Cloudinary,
// backend, пункт 16 плана). 0px радиус — editorial-контент остаётся
// резким (docs/DESIGN.md).
export function ProductGallery({ letter }: ProductGalleryProps) {
  return (
    <div className="flex aspect-square items-center justify-center bg-bone">
      <span className="font-lunar text-heading tracking-heading text-obsidian">{letter}</span>
    </div>
  );
}
