# Muneri · Academia ∂

**Muneri** é um assistente de pesquisa acadêmica de elite, projetado para auxiliar estudantes e pesquisadores na elaboração de TCCs, monografias e artigos científicos. A plataforma combina o poder da inteligência artificial (Gemini 1.5 Flash) com rigor metodológico para entregar resultados precisos, citados e organizados.

## 🚀 Funcionalidades Principais

- **Pesquisa Acadêmica com Grounding**: Utiliza o Google Search para encontrar fontes reais, artigos científicos e repositórios governamentais.
- **Normas APA 7ª Edição**: Todo o conteúdo gerado inclui citações no corpo do texto e uma seção de referências formatada estritamente conforme a APA 7.
- **Sessões Cumulativas**: Pesquisas realizadas na mesma sessão mantêm o contexto histórico, permitindo uma investigação progressiva sem perda de dados.
- **Fichas Técnicas Incrementais**: Organize suas descobertas em uma ficha técnica unificada que acumula informações ao longo da sessão, evitando duplicatas.
- **Exportação em Markdown**: Baixe sua ficha técnica consolidada em formato Markdown, pronta para ser integrada ao seu editor de texto acadêmico.
- **Interface Muneri Design**: UI minimalista, focada na legibilidade e produtividade, inspirada em padrões editoriais modernos.
- **Modo Escuro/Claro**: Suporte completo a temas, preservando a preferência do usuário entre sessões.

## 🛠️ Tecnologias Utilizadas

- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router)
- **IA**: [Google Gemini API](https://ai.google.dev/) (Model: `gemini-1.5-flash`)
- **Estilização**: [Tailwind CSS](https://tailwindcss.com/)
- **Animações**: [Framer Motion](https://www.framer.com/motion/)
- **Componentes**: [Radix UI](https://www.radix-ui.com/) & [Lucide React](https://lucide.dev/)
- **Tipografia**: Inter & Serif acadêmica

## 📖 Como Usar

1. **Inicie uma Pesquisa**: Digite seu tema ou pergunta de pesquisa na barra inferior.
2. **Explore os Resultados**: Leia o relatório gerado, verifique as citações APA e acesse as fontes originais através dos cards de "Grounding".
3. **Organize na Ficha**: Clique em "+ Ficha Técnica" para adicionar o resultado atual à sua ficha técnica acumulada.
4. **Continue Investigando**: Faça novas perguntas. O assistente lembrará do que foi discutido na sessão atual.
5. **Exporte seu Trabalho**: Na barra lateral, aba "Fichas", clique no ícone de download para baixar seu relatório consolidado.

## ⚙️ Configuração

Para rodar o projeto localmente, você precisará de uma chave de API do Google AI Studio:

1. Crie um arquivo `.env.local` na raiz do projeto.
2. Adicione sua chave:
   ```env
   NEXT_PUBLIC_GEMINI_API_KEY=sua_chave_aqui
   ```

## 📄 Licença

Este projeto foi desenvolvido como uma ferramenta de apoio educacional e editorial.

---
*Desenvolvido com rigor acadêmico pela Academia Muneri.*
