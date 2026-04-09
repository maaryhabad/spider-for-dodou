# 🕷️ Spider - Edição Dodou

Uma versão personalizada e balanceada do clássico jogo de cartas Paciência Spider, desenvolvida especialmente para proporcionar uma experiência de jogo fluida, justa e divertida.

## 🎯 Sobre o Projeto

Este projeto nasceu da necessidade de criar uma versão do Spider que fosse ao mesmo tempo desafiadora e relaxante. Diferente de muitas versões online, esta edição utiliza algoritmos de balanceamento inspirados na versão clássica da Microsoft, garantindo que as partidas sejam ganháveis com a estratégia certa.

## ✨ Melhorias Especiais

**Balanceamento Inteligente:** Distribuição de cartas que evita travamentos precoces.

**Espaçamento Dinâmico:** As colunas ajustam-se automaticamente para caberem no ecrã, mesmo com muitas cartas.

**Deck Minimalista:** Interface limpa onde apenas o contador de distribuição é clicável.

**Progressão Visual:** Barra de progresso para acompanhar os naipes concluídos.

**Desfazer (Undo):** Errou? Não há problema, você pode desfazer a jogada.

## 🚀 Tecnologias Utilizadas

**Frontend:** HTML5, CSS3, JavaScript (Vanilla)

**Testes:** Jest com JSDOM.

**CI/CD:** GitHub Actions para testes automáticos e deploy no GitHub Pages.

**Runtime:** Node.js v24.

## 🛠️ Como rodar localmente

Se você quiser executar este projeto localmente, testar ou desenvolver algo novo:

### Clone o repositório:

git clone [https://github.com/teu-usuario/spider-for-dodou.git](https://github.com/teu-usuario/spider-for-dodou.git)


### Instale as dependências de desenvolvimento:

npm install


### Execute os testes unitários:

npm test


### Abra o arquivo index.html no teu navegador (ou usa a extensão Live Server do VS Code).

## 🤖 Pipeline de CI/CD

Este repositório está configurado para garantir que o jogo nunca suba com erros. Sempre que um push é feito para a branch main:

O GitHub Actions inicia um ambiente virtual com Node 24.

Todos os testes unitários (regras de movimento, sequências, etc.) são executados.

Se os testes passarem, o deploy é feito automaticamente para o GitHub Pages.

## 🃏 Como Jogar

O objetivo é remover todas as cartas da mesa criando colunas de sequências completas (do Rei ao Ás) do mesmo naipe.

Você pode mover cartas individuais ou sequências organizadas do mesmo naipe.

Quando não houver mais movimentos, clica no badge vermelho no canto inferior direito para distribuir uma nova fileira de cartas.

Desenvolvido com ❤️ para o Dodou.