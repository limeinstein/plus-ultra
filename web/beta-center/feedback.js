(function () {
  'use strict';

  var API = 'https://api.github.com/repos/limeinstein/plus-ultra';
  var BOARD_URL = 'https://github.com/limeinstein/plus-ultra/issues?q=is%3Aissue+label%3Abeta-feedback';
  var board = document.getElementById('board');
  var status = document.getElementById('board-status');
  var refresh = document.getElementById('refresh');
  var filters = Array.prototype.slice.call(document.querySelectorAll('[data-filter]'));
  var posts = [];
  var activeFilter = 'all';

  function node(tag, className, text) {
    var el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  }

  function date(value) {
    return new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(value));
  }

  function request(url) {
    return fetch(url, {
      headers: { Accept: 'application/vnd.github+json' },
      cache: 'no-store'
    }).then(function (response) {
      if (!response.ok) throw new Error('GitHub API ' + response.status);
      return response.json();
    });
  }

  function link(label, href) {
    var a = node('a', '', label);
    a.href = href; a.target = '_blank'; a.rel = 'noopener';
    return a;
  }

  function loadComments(post, container) {
    if (container.dataset.loaded === 'true') return;
    container.dataset.loaded = 'true';
    var waiting = node('p', 'post-meta', '답변을 불러오는 중입니다…');
    container.appendChild(waiting);
    request(post.comments_url).then(function (comments) {
      waiting.remove();
      if (!comments.length) {
        container.appendChild(node('p', 'post-meta', '아직 등록된 답변이 없습니다.'));
        return;
      }
      comments.forEach(function (item) {
        var article = node('article', 'comment');
        var head = node('header');
        var author = node('b', '', item.user.login + (item.author_association === 'OWNER' ? ' · 개발자' : ''));
        var time = node('time', '', date(item.created_at)); time.dateTime = item.created_at;
        head.append(author, time);
        article.append(head, node('p', '', item.body || ''));
        container.appendChild(article);
      });
    }).catch(function () {
      waiting.className = 'post-meta board-error';
      waiting.textContent = '답변을 불러오지 못했습니다. GitHub에서 확인해 주세요.';
    });
  }

  function render() {
    board.replaceChildren();
    var shown = posts.filter(function (post) {
      if (activeFilter === 'answered') return post.comments > 0;
      if (activeFilter === 'open' || activeFilter === 'closed') return post.state === activeFilter;
      return true;
    });
    status.textContent = '피드백 ' + shown.length + '건 · 최근 수정 순';
    if (!shown.length) {
      var empty = node('p', 'board-empty', '이 조건에 맞는 피드백이 없습니다. 첫 항해 기록을 남겨 주세요.');
      board.appendChild(empty);
      return;
    }
    shown.forEach(function (post) {
      var details = node('details', 'post');
      var summary = node('summary');
      var state = node('span', 'state ' + (post.state === 'closed' ? 'closed' : ''), post.state === 'closed' ? '반영·완료' : '진행 중');
      var title = node('span', 'post-title');
      title.append(node('strong', '', post.title), node('small', '', '#' + post.number + ' · ' + post.user.login + ' · ' + date(post.created_at)));
      var meta = node('span', 'post-meta', post.comments ? '답변 ' + post.comments + '개' : '답변 대기');
      summary.append(state, title, meta);

      var body = node('div', 'post-body');
      body.appendChild(node('div', 'post-text', post.body || '내용이 없습니다.'));
      var links = node('div', 'post-links');
      links.append(link('GitHub에서 답변하기', post.html_url), link('원문 열기', post.html_url));
      body.appendChild(links);
      var comments = node('div', 'comments');
      body.appendChild(comments);
      details.addEventListener('toggle', function () {
        if (details.open) loadComments(post, comments);
      });
      details.append(summary, body);
      board.appendChild(details);
    });
  }

  function load() {
    refresh.disabled = true;
    status.textContent = '게시판을 불러오는 중입니다…';
    request(API + '/issues?state=all&labels=beta-feedback&sort=updated&direction=desc&per_page=50').then(function (items) {
      posts = items.filter(function (item) { return !item.pull_request; });
      render();
    }).catch(function () {
      status.textContent = '게시판을 불러오지 못했습니다.';
      status.className = 'board-status board-error';
      board.replaceChildren();
      var fallback = node('p', 'board-empty');
      fallback.append('잠시 뒤 다시 시도하거나 ', link('GitHub 게시판에서 직접 확인', BOARD_URL), '해 주세요.');
      board.appendChild(fallback);
    }).finally(function () { refresh.disabled = false; });
  }

  filters.forEach(function (button) {
    button.addEventListener('click', function () {
      activeFilter = button.dataset.filter;
      filters.forEach(function (item) { item.classList.toggle('active', item === button); });
      render();
    });
  });
  refresh.addEventListener('click', load);
  load();
})();
