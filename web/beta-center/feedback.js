(function () {
  'use strict';

  var API = 'https://api.github.com/repos/limeinstein/plus-ultra';
  var FEEDBACK_API = 'https://plus-ultra-telemetry.luminary121284.chatgpt.site/api/feedback';
  var FEEDBACK_ADMIN = 'https://plus-ultra-telemetry.luminary121284.chatgpt.site/admin';
  var BOARD_URL = 'https://github.com/limeinstein/plus-ultra/issues?q=is%3Aissue+label%3Abeta-feedback';
  var board = document.getElementById('board');
  var status = document.getElementById('board-status');
  var refresh = document.getElementById('refresh');
  var form = document.getElementById('feedback-form');
  var formStatus = document.getElementById('feedback-form-status');
  var submit = document.getElementById('feedback-submit');
  var filters = Array.prototype.slice.call(document.querySelectorAll('[data-filter]'));
  var posts = [];
  var activeFilter = 'all';
  var startedAt = Date.now();

  var CATEGORY_LABELS = {
    bug: '오류 제보', suggestion: '개선 제안', balance: '밸런스', question: '질문', other: '기타'
  };

  function node(tag, className, text) {
    var el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  }

  function date(value) {
    return new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(value));
  }

  function request(url, options) {
    return fetch(url, options || { cache: 'no-store' }).then(function (response) {
      if (!response.ok) throw new Error('request ' + response.status);
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
    if (post.source === 'anonymous') {
      if (!post.reply) {
        container.appendChild(node('p', 'post-meta', '아직 등록된 답변이 없습니다.'));
        return;
      }
      var reply = node('article', 'comment');
      var replyHead = node('header');
      var replyTime = node('time', '', date(post.replied_at)); replyTime.dateTime = post.replied_at;
      replyHead.append(node('b', '', '개발팀 · 관리자 답변'), replyTime);
      reply.append(replyHead, node('p', '', post.reply));
      container.appendChild(reply);
      return;
    }
    var waiting = node('p', 'post-meta', '답변을 불러오는 중입니다…');
    container.appendChild(waiting);
    request(post.comments_url, { headers: { Accept: 'application/vnd.github+json' }, cache: 'no-store' }).then(function (comments) {
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

  function postBody(post) {
    if (post.source === 'github') return post.body || '내용이 없습니다.';
    var body = post.detail || '내용이 없습니다.';
    if (post.steps) body += '\n\n[재현 순서]\n' + post.steps;
    if (post.environment) body += '\n\n[실행 환경]\n' + post.environment;
    return body;
  }

  function renderPost(post) {
    var details = node('details', 'post');
    var summary = node('summary');
    var state = node('span', 'state ' + (post.state === 'closed' ? 'closed' : ''), post.state === 'closed' ? '반영·완료' : '진행 중');
    var title = node('span', 'post-title');
    var prefix = post.category ? '[' + (CATEGORY_LABELS[post.category] || '기타') + '] ' : '';
    var byline = post.source === 'github' ? '#' + post.number + ' · ' + post.user.login : '익명 #' + post.id;
    title.append(node('strong', '', prefix + post.title), node('small', '', byline + ' · ' + date(post.created_at)));
    var meta = node('span', 'post-meta', post.comments ? '답변 ' + post.comments + '개' : '답변 대기');
    summary.append(state, title, meta);

    var body = node('div', 'post-body');
    body.appendChild(node('div', 'post-text', postBody(post)));
    if (post.source === 'github') {
      var links = node('div', 'post-links');
      links.append(link('GitHub에서 답변하기', post.html_url), link('원문 열기', post.html_url));
      body.appendChild(links);
    } else {
      body.appendChild(node('p', 'post-meta', '로그인 없이 등록된 공개 피드백입니다.'));
      var adminLinks = node('div', 'post-links');
      adminLinks.appendChild(link('관리자 답변하기', FEEDBACK_ADMIN + '#feedback-' + post.id));
      body.appendChild(adminLinks);
    }
    var comments = node('div', 'comments');
    body.appendChild(comments);
    details.addEventListener('toggle', function () {
      if (details.open) loadComments(post, comments);
    });
    details.append(summary, body);
    return details;
  }

  function renderCompleted(posts) {
    var archive = node('details', 'completed-board');
    var summary = node('summary', 'completed-board-summary');
    var heading = node('span', 'completed-board-title');
    heading.append(node('strong', '', '완료된 피드백'), node('small', '', '반영하거나 처리를 마친 글을 모았습니다.'));
    summary.append(heading, node('span', 'completed-board-count', posts.length + '건'), node('span', 'completed-board-action', '클릭해서 보기'));
    var list = node('div', 'completed-board-posts');
    posts.forEach(function (post) { list.appendChild(renderPost(post)); });
    archive.append(summary, list);
    board.appendChild(archive);
  }

  function render() {
    board.replaceChildren();
    var shown = posts.filter(function (post) {
      if (activeFilter === 'answered') return post.comments > 0;
      if (activeFilter === 'open') return post.state === 'open';
      return true;
    });
    var openPosts = shown.filter(function (post) { return post.state !== 'closed'; });
    var completedPosts = shown.filter(function (post) { return post.state === 'closed'; });
    status.className = 'board-status';
    status.textContent = '피드백 ' + shown.length + '건 · 진행 중 ' + openPosts.length + '건 · 완료 ' + completedPosts.length + '건';
    if (!shown.length) {
      board.appendChild(node('p', 'board-empty', '이 조건에 맞는 피드백이 없습니다. 첫 항해 기록을 남겨 주세요.'));
      return;
    }
    openPosts.forEach(function (post) { board.appendChild(renderPost(post)); });
    if (completedPosts.length) renderCompleted(completedPosts);
  }

  function normalizeGithub(items) {
    return items.filter(function (item) { return !item.pull_request; }).map(function (item) {
      item.source = 'github';
      return item;
    });
  }

  function normalizeAnonymous(data) {
    return (data.posts || []).map(function (item) {
      return {
        source: 'anonymous', id: item.id, category: item.category, title: item.title,
        detail: item.detail, steps: item.steps, environment: item.environment,
        state: item.status === 'closed' ? 'closed' : 'open', comments: item.reply ? 1 : 0,
        reply: item.reply || '', replied_at: item.repliedAt || item.createdAt,
        created_at: item.createdAt, updated_at: item.repliedAt || item.createdAt
      };
    });
  }

  function load() {
    refresh.disabled = true;
    status.textContent = '게시판을 불러오는 중입니다…';
    var github = request(API + '/issues?state=all&labels=beta-feedback&sort=updated&direction=desc&per_page=50', {
      headers: { Accept: 'application/vnd.github+json' }, cache: 'no-store'
    }).then(normalizeGithub);
    var anonymous = request(FEEDBACK_API, { cache: 'no-store' }).then(normalizeAnonymous);

    Promise.allSettled([anonymous, github]).then(function (results) {
      posts = [];
      results.forEach(function (result) {
        if (result.status === 'fulfilled') posts = posts.concat(result.value);
      });
      posts.sort(function (a, b) { return new Date(b.updated_at) - new Date(a.updated_at); });
      if (!posts.length && results.every(function (result) { return result.status === 'rejected'; })) {
        throw new Error('board unavailable');
      }
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

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    if (!form.reportValidity()) return;
    submit.disabled = true;
    formStatus.className = 'form-status';
    formStatus.textContent = '피드백을 등록하는 중입니다…';
    var data = new FormData(form);
    request(FEEDBACK_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: data.get('category'), title: data.get('title'), detail: data.get('detail'),
        steps: data.get('steps'), environment: data.get('environment'), website: data.get('website'),
        startedAt: startedAt
      })
    }).then(function () {
      form.reset();
      startedAt = Date.now();
      formStatus.textContent = '등록되었습니다. 공개 게시판에 곧 표시됩니다.';
      load();
    }).catch(function (error) {
      formStatus.className = 'form-status error';
      formStatus.textContent = /429/.test(error.message) ? '등록이 몰리고 있습니다. 잠시 뒤 다시 시도해 주세요.' : '등록하지 못했습니다. 내용을 확인하고 잠시 뒤 다시 시도해 주세요.';
    }).finally(function () { submit.disabled = false; });
  });

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
