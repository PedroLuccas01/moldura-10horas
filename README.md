# Faça sua Moldura

Site estático em que a pessoa escolhe uma foto, ajusta o enquadramento (arrastar + zoom) sob a moldura e baixa a imagem final (1080×1080, JPG). Tudo roda no navegador: nenhuma foto é enviada a servidor.

## Arquivos
- `index.html`, `style.css`, `app.js` — a aplicação
- `assets/moldura.png` — a moldura (PNG 1080×1080 com área transparente)
- `assets/preview.jpg` — imagem de prévia para links compartilhados

## Trocar a moldura
Substitua `assets/moldura.png` por outro PNG quadrado de 1080×1080 com a área da foto transparente.

## Rodar localmente
Qualquer servidor estático, por ex.: `npx serve .`

## Publicar
Projeto estático, sem build. Na Vercel: Framework Preset = **Other**, sem comando de build, diretório raiz = esta pasta.
