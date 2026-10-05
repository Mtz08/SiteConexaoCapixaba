import { describe, expect, it } from 'vitest';
import { NUMERO_WHATSAPP_FICTICIO, numeroWhatsappFicticio, numeroWhatsappValido, site } from './site';

describe('numeroWhatsappValido', () => {
  it.each(['5527912345678', '552733334444', '5511987654321'])('aceita %s', (numero) => {
    expect(numeroWhatsappValido(numero)).toBe(true);
  });

  it.each(['27912345678', '+5527912345678', '55 27 91234-5678', '552791234567890', ''])(
    'recusa %s',
    (numero) => {
      expect(numeroWhatsappValido(numero)).toBe(false);
    },
  );

  it('o número configurado tem formato válido', () => {
    expect(numeroWhatsappValido(site.whatsapp)).toBe(true);
  });
});

describe('numeroWhatsappFicticio', () => {
  it('identifica o número de exemplo', () => {
    expect(numeroWhatsappFicticio(NUMERO_WHATSAPP_FICTICIO)).toBe(true);
    expect(numeroWhatsappFicticio('5527912345678')).toBe(false);
  });
});
