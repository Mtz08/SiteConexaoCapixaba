import type { AstroIntegration } from 'astro';
import { numeroWhatsappFicticio, numeroWhatsappValido, site } from '../config/site';

/**
 * Impede que o site vá ao ar com número de WhatsApp inválido ou de exemplo.
 * - Número com formato inválido: falha sempre (dev e build).
 * - Número de exemplo: aviso em dev; falha no build, a menos que PERMITIR_NUMERO_FICTICIO=true.
 */
export function verificarWhatsapp(permitirFicticio: boolean): AstroIntegration {
  return {
    name: 'conexao:verificar-whatsapp',
    hooks: {
      'astro:config:setup': ({ command, logger }) => {
        if (!numeroWhatsappValido(site.whatsapp)) {
          throw new Error(
            `[site.ts] O número de WhatsApp "${site.whatsapp}" é inválido. ` +
              'Use só dígitos, com 55 + DDD + número. Ex.: 5527912345678.',
          );
        }
        if (!numeroWhatsappFicticio(site.whatsapp)) return;

        if (command === 'build' && !permitirFicticio) {
          throw new Error(
            '[site.ts] O número de WhatsApp ainda é o de exemplo. ' +
              'Troque `whatsapp` em src/config/site.ts antes de publicar, ' +
              'ou defina PERMITIR_NUMERO_FICTICIO=true para um build de teste.',
          );
        }
        logger.warn('O número de WhatsApp em src/config/site.ts ainda é o de exemplo (TODO).');
      },
    },
  };
}
