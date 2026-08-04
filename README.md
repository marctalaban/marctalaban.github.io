# marctalaban.github.io

Portfolio personal. Un solo fichero estático, sin build, sin dependencias.

```
index.html   ← todo: HTML + CSS + ~200 líneas de JS vanilla
```

## Antes de publicar

1. **Formulario de contacto.** En el `<script>`, busca `FORM_ENDPOINT`.
   - Vacío (por defecto) → el formulario abre el cliente de correo del visitante con todo relleno. Funciona siempre, pero depende de que tenga mail configurado.
   - Con endpoint → los mensajes te llegan al inbox. Crea un formulario gratis en [formspree.io](https://formspree.io) y pega la URL:
     ```js
     var FORM_ENDPOINT = "https://formspree.io/f/xxxxxxxx";
     ```
     El JS ya hace POST en JSON, valida los campos y tiene honeypot antispam. Si el POST falla, cae al mailto solo.

2. **Números.** El 33% y el "3 países" están redactados como cifras del cliente, no como mérito propio directo. Revísalo si prefieres otra formulación.

3. **Modo por defecto.** Claro. Se guarda la preferencia del visitante en `localStorage`.

## Deploy — GitHub Pages

```bash
git init
git add index.html README.md
git commit -m "portfolio"
git branch -M main
git remote add origin git@github.com:<usuario>/<usuario>.github.io.git
git push -u origin main
```

Settings → Pages → branch `main`, carpeta `/ (root)`. En ~1 min está en
`https://<usuario>.github.io`. Cada push republica.

Dominio propio: Settings → Pages → Custom domain + `CNAME` en tu DNS.

## Deploy — Netlify (alternativa)

`app.netlify.com/drop`, arrastras la carpeta, URL al instante. Sin repo detrás.

## Personalización

Todo el color y la tipografía sale de las variables en `:root` y
`html[data-theme="dark"]`. Cambiar `--klein` cambia el acento de la página entera.

Los modales de proyecto son `<div class="detail">` dentro de cada card:
HTML estático (indexable por Google), clonado dentro de un `<dialog>` nativo al abrir.
Para añadir un proyecto, duplica un `<article class="card">` y dale un `data-detail` nuevo.
