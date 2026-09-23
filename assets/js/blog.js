(function () {

  const REPO = 'tomsoftwar/tomgames';
  const BRANCH = 'main';
  const POSTS_PATH = 'Posts';

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, function (c) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      }[c];
    });
  }

  function parseFrontMatter(text) {
    const result = {
      title: '',
      image: '',
      description: '',
      body: '',
      date: ''
    };

    const match = text.match(/^---\s*([\s\S]*?)\s*---\s*([\s\S]*)$/);

    if (!match) {
      result.body = text;
      return result;
    }

    const front = match[1];
    result.body = match[2].trim();

    front.split(/\r?\n/).forEach(function (line) {

      const pos = line.indexOf(':');

      if (pos === -1) return;

      const key = line.substring(0, pos).trim();
      let value = line.substring(pos + 1).trim();

      value = value.replace(/^["']|["']$/g, '');

      if (key === 'title') result.title = value;
      if (key === 'image') result.image = value;
      if (key === 'description') result.description = value;
      if (key === 'date') result.date = value;
    });

    return result;
  }

  function markdownToHtml(text) {

    let html = esc(text);

    html = html.replace(/^### (.*)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.*)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.*)$/gm, '<h1>$1</h1>');

    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener">$1</a>'
    );

    html = html.replace(/\r?\n\r?\n/g, '</p><p>');
    html = html.replace(/\r?\n/g, '<br>');

    return '<p>' + html + '</p>';
  }

  let all = [];

  async function load() {

    const response = await fetch(
      `https://api.github.com/repos/${REPO}/contents/${POSTS_PATH}?ref=${BRANCH}`
    );

    if (!response.ok) {
      throw new Error('Não foi possível acessar a pasta posts.');
    }

    const files = await response.json();

    const markdownFiles = files.filter(function (file) {
      return file.type === 'file' &&
        file.name.toLowerCase().endsWith('.md');
    });

    all = await Promise.all(
      markdownFiles.map(async function (file) {

        const r = await fetch(file.download_url);

        if (!r.ok) {
          throw new Error('Erro ao carregar ' + file.name);
        }

        const text = await r.text();

        const post = parseFrontMatter(text);

        post.filename = file.name;

        return post;
      })
    );

    all.sort(function (a, b) {
      return new Date(b.date || 0) - new Date(a.date || 0);
    });

    render('');
  }

  function render(filter) {

    const box = document.getElementById('posts');
    const empty = document.getElementById('empty');

    if (!box) return;

    const q = (filter || '').toLowerCase();

    const list = all.filter(function (post) {

      return (
        post.title + ' ' +
        post.description + ' ' +
        post.body
      ).toLowerCase().includes(q);

    });

    box.innerHTML = list.map(function (post, index) {

      const date = post.date
        ? new Date(post.date).toLocaleDateString('pt-BR')
        : '';

      const image = post.image
        ? `<img src="${esc(post.image)}" alt="${esc(post.title)}">`
        : '';

      return `
        <article class="post-card">

          ${image}

          <span class="tag">TECNOLOGIA</span>

          <h2>${esc(post.title)}</h2>

          <small>${esc(date)}</small>

          <p>${esc(post.description)}</p>

          <button
            class="btn small"
            data-read="${index}">
            LER ARTIGO
          </button>

          <div
            class="post-full"
            id="full-${index}"
            style="display:none">

            ${markdownToHtml(post.body)}

          </div>

        </article>
      `;

    }).join('');

    empty.style.display = list.length ? 'none' : 'block';

    box.querySelectorAll('[data-read]').forEach(function (button) {

      button.addEventListener('click', function () {

        const id = button.getAttribute('data-read');
        const article = document.getElementById('full-' + id);

        if (!article) return;

        if (article.style.display === 'none') {

          article.style.display = 'block';
          button.textContent = 'FECHAR';

        } else {

          article.style.display = 'none';
          button.textContent = 'LER ARTIGO';

        }

      });

    });

  }

  document.addEventListener('DOMContentLoaded', function () {

    load().catch(function (error) {

      console.error(error);

      const empty = document.getElementById('empty');

      if (empty) {

        empty.textContent =
          'Não foi possível carregar as matérias do blog.';

        empty.style.display = 'block';

      }

    });

    const search = document.getElementById('blogSearch');

    if (search) {

      search.addEventListener('input', function () {
        render(search.value);
      });

    }

  });

})();
