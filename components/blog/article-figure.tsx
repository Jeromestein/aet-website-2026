import Image from 'next/image';
import type { ArticleImage } from '@/lib/authored-blog-posts';
import styles from './authored-article.module.css';

export function ArticleFigure({ image, lead = false }: { image: ArticleImage; lead?: boolean }) {
  return <figure className={`${styles.figure} ${lead ? styles.leadFigure : ''}`}>
    <div className={styles.imageFrame}>
      <Image src={image.src} alt={image.alt} width={image.width} height={image.height}
        sizes="(max-width: 760px) 90vw, (max-width: 1000px) 65vw, 780px"
        style={{ objectPosition: image.objectPosition ?? 'center' }} />
    </div>
    <figcaption>{image.caption}</figcaption>
  </figure>;
}
