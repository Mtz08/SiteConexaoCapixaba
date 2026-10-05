import { getImage } from 'astro:assets';
import type { FotoGaleria } from '../../components/islands/Galeria';
import type { FotoResolvida } from './fotos';

const LARGURAS = [480, 720, 960, 1200];

/** Gera no build as versões AVIF/WebP, a ampliada e a miniatura de cada foto. */
export async function fotosParaGaleria(fotos: FotoResolvida[]): Promise<FotoGaleria[]> {
  return Promise.all(
    fotos.map(async (foto) => {
      const [avif, webp, grande, miniatura] = await Promise.all([
        getImage({ src: foto.imagem, widths: LARGURAS, format: 'avif' }),
        getImage({ src: foto.imagem, widths: LARGURAS, format: 'webp' }),
        getImage({ src: foto.imagem, width: 1600, format: 'webp' }),
        getImage({ src: foto.imagem, width: 192, format: 'webp' }),
      ]);
      return {
        avif: avif.srcSet.attribute,
        webp: webp.srcSet.attribute,
        src: webp.src,
        grande: grande.src,
        miniatura: miniatura.src,
        largura: foto.imagem.width,
        altura: foto.imagem.height,
        alt: foto.alt,
        cor: foto.cor,
      };
    }),
  );
}
