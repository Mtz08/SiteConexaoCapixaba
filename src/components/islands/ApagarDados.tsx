import { useState } from 'preact/hooks';
import { apagarDadosDoAparelho } from '../../stores/carrinho';

/** "Apagar meus dados deste aparelho": carrinho, nome e cidade guardados no navegador. */
export default function ApagarDados() {
  const [feito, setFeito] = useState(false);
  return (
    <div class="flex flex-wrap items-center gap-3">
      <button
        type="button"
        class="botao botao--contorno"
        onClick={() => {
          apagarDadosDoAparelho();
          setFeito(true);
        }}
      >
        Apagar meus dados deste aparelho
      </button>
      <p role="status" class="text-sm text-texto">
        {feito ? 'Pronto: carrinho, nome e cidade foram apagados deste aparelho.' : ''}
      </p>
    </div>
  );
}
