const DEFAULT_OPTS = { credentials: 'include' };

async function parseError(response, fallback) {
  const m = { 400: '요청값을 확인해 주세요.', 401: '로그인이 만료됐습니다.', 403: '권한이 없습니다.', 404: '찾을 수 없습니다.' };
  try {
    const d = await response.json();
    return d.message || d.error || m[response.status] || fallback;
  } catch {
    return (await response.text()) || m[response.status] || fallback;
  }
}

// ── Auth ─────────────────────────────────────────────────────────────────────
export async function register(payload) {
  const r = await fetch('/api/auth/register', { ...DEFAULT_OPTS, method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  if (!r.ok) throw new Error(await parseError(r, '회원가입 실패'));
  return r.json();
}
export async function login(payload) {
  const r = await fetch('/api/auth/login', { ...DEFAULT_OPTS, method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  if (!r.ok) throw new Error(await parseError(r, '로그인 실패'));
  return r.json();
}
export async function logout() {
  await fetch('/api/auth/logout', { ...DEFAULT_OPTS, method: 'POST' });
}

// ── Profile ──────────────────────────────────────────────────────────────────
export async function fetchMyProfile() {
  const r = await fetch('/api/users/me', DEFAULT_OPTS);
  if (!r.ok) throw new Error(await parseError(r, '프로필 로드 실패'));
  return r.json();
}
export async function updateMyProfile(payload) {
  const r = await fetch('/api/users/me', { ...DEFAULT_OPTS, method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload }) });
  if (!r.ok) throw new Error(await parseError(r, '프로필 저장 실패'));
  return r.json();
}
export async function fetchTeams() {
  const r = await fetch('/api/users/teams', DEFAULT_OPTS);
  return r.ok ? r.json() : [];
}

// ── Posts ─────────────────────────────────────────────────────────────────────
export async function fetchPosts() {
  const r = await fetch('/api/companions', DEFAULT_OPTS);
  if (!r.ok) throw new Error(await parseError(r, '게시글 로드 실패'));
  return r.json();
}
export async function fetchMyPosts() {
  const r = await fetch('/api/companions/my', DEFAULT_OPTS);
  if (!r.ok) throw new Error(await parseError(r, '내 게시글 로드 실패'));
  return r.json();
}
function buildFormData(payload) {
  const fd = new FormData();
  ['title','stadium','gameDate','description'].forEach(k => fd.append(k, payload[k]));
  fd.append('totalTickets', String(payload.totalTickets));
  fd.append('wantedCount', String(payload.wantedCount));
  if (payload.ticketImageFile) fd.append('ticketImage', payload.ticketImageFile);
  // 좌석 위치 (값이 있을 때만 전송)
  ['seatZone','seatBlock','seatRow','seatNumber'].forEach(k => {
    if (payload[k]) fd.append(k, payload[k]);
  });
  return fd;
}
export async function createPost(payload) {
  const r = await fetch('/api/companions', { ...DEFAULT_OPTS, method: 'POST', body: buildFormData(payload) });
  if (!r.ok) throw new Error(await parseError(r, '게시글 등록 실패'));
  return r.json();
}
export async function updatePost(id, payload) {
  const r = await fetch(`/api/companions/${id}`, { ...DEFAULT_OPTS, method: 'PUT', body: buildFormData(payload) });
  if (!r.ok) throw new Error(await parseError(r, '게시글 수정 실패'));
  return r.json();
}
export async function deletePost(id) {
  const r = await fetch(`/api/companions/${id}`, { ...DEFAULT_OPTS, method: 'DELETE' });
  if (!r.ok) throw new Error(await parseError(r, '게시글 삭제 실패'));
}
export async function toggleClosePost(postId) {
  const r = await fetch(`/api/companions/${postId}/close`, { ...DEFAULT_OPTS, method: 'POST' });
  if (!r.ok) throw new Error(await parseError(r, '상태 변경 실패'));
  return r.json();
}

// ── Applications ──────────────────────────────────────────────────────────────
export async function applyToPost(postId, message = '') {
  const r = await fetch(`/api/companions/${postId}/apply`, { ...DEFAULT_OPTS, method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message }) });
  if (!r.ok) throw new Error(await parseError(r, '신청 실패'));
  return r.json();
}
export async function cancelApplication(postId) {
  const r = await fetch(`/api/companions/${postId}/apply`, { ...DEFAULT_OPTS, method: 'DELETE' });
  if (!r.ok) throw new Error(await parseError(r, '신청 취소 실패'));
}
export async function fetchMyApplications() {
  const r = await fetch('/api/applications/my', DEFAULT_OPTS);
  if (!r.ok) throw new Error(await parseError(r, '신청 목록 로드 실패'));
  return r.json();
}
export async function fetchPostApplications(postId) {
  const r = await fetch(`/api/companions/${postId}/applications`, DEFAULT_OPTS);
  if (!r.ok) throw new Error(await parseError(r, '신청자 목록 로드 실패'));
  return r.json();
}
export async function acceptApplication(appId) {
  const r = await fetch(`/api/applications/${appId}/accept`, { ...DEFAULT_OPTS, method: 'PUT' });
  if (!r.ok) throw new Error(await parseError(r, '수락 실패'));
  return r.json();
}
export async function rejectApplication(appId) {
  const r = await fetch(`/api/applications/${appId}/reject`, { ...DEFAULT_OPTS, method: 'PUT' });
  if (!r.ok) throw new Error(await parseError(r, '거절 실패'));
  return r.json();
}

// ── Bookmarks ─────────────────────────────────────────────────────────────────
export async function toggleBookmark(postId) {
  const r = await fetch(`/api/companions/${postId}/bookmark`, { ...DEFAULT_OPTS, method: 'POST' });
  if (!r.ok) throw new Error(await parseError(r, '북마크 실패'));
  return r.json();
}
export async function fetchBookmarked() {
  const r = await fetch('/api/companions/bookmarked', DEFAULT_OPTS);
  if (!r.ok) throw new Error(await parseError(r, '찜 목록 로드 실패'));
  return r.json();
}

export async function saveBtiType(btiType) {
  const r = await fetch('/api/users/me/bti', {
    ...DEFAULT_OPTS, method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ btiType }),
  });
  if (!r.ok) throw new Error(await parseError(r, 'BTI 저장 실패'));
  return r.json();
}
