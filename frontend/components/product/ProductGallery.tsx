interface ProductGalleryProps {
  letter: string;
}

// Одно плейсхолдер-фото вместо галереи с миниатюрами из ТЗ — нескольких
// изображений на товар пока нет (появятся с загрузкой в Cloudinary,
// backend, пункт 16 плана).
export function ProductGallery({ letter }: ProductGalleryProps) {
  return (
    <div className="flex aspect-square items-center justify-center bg-chalk">
      <span className="font-gp text-heading tracking-heading text-soot">{letter}</span>
    </div>
  );
}
