import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  acceptApplication, applyToPost, cancelApplication,
  createPost, deletePost,
  fetchBookmarked, fetchMyApplications, fetchMyPosts, fetchMyProfile,
  fetchPostApplications, fetchPosts, fetchTeams,
  login, logout as apiLogout, register,
  rejectApplication, saveBtiType, toggleBookmark, toggleClosePost, updateMyProfile, updatePost,
} from './api';
import './styles.css';

// ── Constants ────────────────────────────────────────────────────────────────
const INIT_FORM = { title:'', stadium:'', gameDate:'', description:'', totalTickets:'', wantedCount:'', ticketImageFile:null, seatZone:'', seatBlock:'', seatRow:'', seatNumber:'' };
const INIT_AUTH = { nickname:'', email:'', password:'' };
const INIT_PROFILE = { name:'', age:'', favoriteTeam:'', kakaoId:'' };

const STATUS_LABEL = { PENDING:'검토 중', ACCEPTED:'수락됨', REJECTED:'거절됨' };

const KBO_STADIUMS = [
  { name:'잠실야구장',         location:'서울', teams:'LG 트윈스 · 두산 베어스' },
  { name:'인천SSG랜더스필드',   location:'인천', teams:'SSG 랜더스' },
  { name:'고척스카이돔',        location:'서울', teams:'키움 히어로즈' },
  { name:'수원KT위즈파크',      location:'수원', teams:'KT 위즈' },
  { name:'대전 한화생명 볼파크', location:'대전', teams:'한화 이글스' },
  { name:'대구삼성라이온즈파크', location:'대구', teams:'삼성 라이온즈' },
  { name:'광주기아챔피언스필드', location:'광주', teams:'KIA 타이거즈' },
  { name:'사직야구장',          location:'부산', teams:'롯데 자이언츠' },
  { name:'창원NC파크',          location:'창원', teams:'NC 다이노스' },
];

const SEAT_ZONES = [
  '1루 내야',
  '1루 응원석',
  '내야 중앙',
  '3루 내야',
  '3루 응원석',
  '1루 외야',
  '3루 외야',
  '기타(특별석)',
];

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(d) {
  if (!d) return '';
  const [y, m, day] = String(d).split('-');
  return `${y}.${m}.${day}`;
}

// ── SVG Icons ────────────────────────────────────────────────────────────────
const IconBoard = () => (
  <svg className="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
  </svg>
);
const IconWrite = () => (
  <svg className="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
  </svg>
);
const IconBti = () => (
  <svg className="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
    <path d="M17 3l2 2-2 2"/><path d="M7 3L5 5l2 2"/>
  </svg>
);
const IconUser = () => (
  <svg className="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);

// ── App ───────────────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
//  응BTI
// ══════════════════════════════════════════════════════════════════════════════
const BTI_QUESTIONS = [
  {
    q: "야구장에서 나는 주로...",
    opts: [
      { k: 'A', label: "🎤 응원가를 크게 부르며 목청껏 응원한다" },
      { k: 'B', label: "🔍 선수 플레이를 조용히 분석하며 집중한다" },
      { k: 'C', label: "🎉 규칙은 잘 몰라도 분위기 자체를 즐긴다" },
      { k: 'D', label: "🤝 좋은 플레이는 어느 팀이든 같이 즐긴다" },
    ],
  },
  {
    q: "내 팀이 지고 있을 때 나는?",
    opts: [
      { k: 'A', label: "🔥 더 큰 소리로 응원해 역전을 이끌어낸다" },
      { k: 'B', label: "📊 무엇이 문제인지 전략적으로 분석한다" },
      { k: 'C', label: "😅 점수보다 치킨이 맛있으면 그만이다" },
      { k: 'D', label: "👏 상대팀 잘하는 점도 인정하며 즐긴다" },
    ],
  },
  {
    q: "야구 규칙에 대해 솔직히 말하면?",
    opts: [
      { k: 'A', label: "⚾ 기본 규칙은 알고 응원에 집중한다" },
      { k: 'B', label: "📖 보크·인필드플라이까지 다 안다" },
      { k: 'C', label: "🙋 아직 배우는 중, 3아웃이 뭔지 최근 알았다" },
      { k: 'D', label: "🌊 규칙보다 전체 흐름과 분위기가 중요하다" },
    ],
  },
  {
    q: "경기장 방문 빈도는?",
    opts: [
      { k: 'A', label: "🎟️ 시즌 내내 거의 매주 간다" },
      { k: 'B', label: "🗓️ 중요 경기나 주요 매치업 위주로 고른다" },
      { k: 'C', label: "🌸 시즌에 한두 번, 날씨 좋을 때 간다" },
      { k: 'D', label: "🏟️ 여러 구장을 돌아다니며 다양하게 간다" },
    ],
  },
  {
    q: "응원할 때 선호하는 방식은?",
    opts: [
      { k: 'A', label: "📣 응원단 구호에 맞춰 열렬히 함께한다" },
      { k: 'B', label: "🤫 조용히 집중하며 혼자 관전한다" },
      { k: 'C', label: "📸 인증샷 찍고 분위기 즐기는 게 우선이다" },
      { k: 'D', label: "💬 옆 사람과 대화하며 느긋하게 즐긴다" },
    ],
  },
  {
    q: "집에서 야구를 즐기는 방식은?",
    opts: [
      { k: 'A', label: "📺 중계방송을 빠짐없이 챙겨보고 응원한다" },
      { k: 'B', label: "📈 기록지·통계 사이트를 즐겨 분석한다" },
      { k: 'C', label: "🎬 유명 경기 하이라이트만 가끔 본다" },
      { k: 'D', label: "🔀 여러 팀 경기를 두루두루 찾아본다" },
    ],
  },
  {
    q: "동행을 구할 때 가장 중요한 것은?",
    opts: [
      { k: 'A', label: "🏳️ 반드시 같은 팀 팬이어야 한다" },
      { k: 'B', label: "🧠 경기를 깊이 이해하고 대화할 수 있어야 한다" },
      { k: 'C', label: "😊 야구 몰라도 같이 즐길 수 있으면 된다" },
      { k: 'D', label: "🌈 다른 팀 팬도 환영, 다양한 관점이 재밌다" },
    ],
  },
  {
    q: "나에게 야구란?",
    opts: [
      { k: 'A', label: "❤️‍🔥 온 에너지를 쏟는 삶의 일부" },
      { k: 'B', label: "♟️ 전략과 통계로 즐기는 지적 스포츠" },
      { k: 'C', label: "🌟 가끔 즐기는 설레는 새로운 취미" },
      { k: 'D', label: "🎊 사람들과 어울리는 즐거운 사교 활동" },
    ],
  },
];

const BTI_RESULTS = {
  A: {
    type: '열정형',
    emoji: '🔥',
    badge: '열정 응원단',
    color: '#E63030',
    bg: '#FFF0F0',
    desc: '경기장에서 가장 큰 목소리를 내는 건 바로 당신! 응원가는 물론 선수 이름까지 외치며 에너지를 쏟아붓는 진정한 열혈 팬입니다. 당신의 응원이 있어야 팀도 힘이 나죠. 같은 팀 팬과 함께라면 시너지는 배로 올라갑니다.',
    tags: ['#열혈팬', '#응원가달인', '#성대혹사', '#12번째선수'],
    match: '분석형과 함께라면 경기를 더 깊이 즐길 수 있어요!',
  },
  B: {
    type: '분석형',
    emoji: '📊',
    badge: '데이터 야구통',
    color: '#1B3D6F',
    bg: '#EFF3F8',
    desc: '타율, 방어율, WAR 수치까지 꿰뚫고 있는 당신! 감독의 선수 기용 하나하나에 고개를 끄덕이는 진짜 야구 마니아입니다. 경기 흐름을 읽는 눈이 남다르며, 함께 가면 숨겨진 재미를 두 배로 느낄 수 있습니다.',
    tags: ['#야구통계마니아', '#전술분석', '#조용한집중', '#해설가급'],
    match: '초보자와 함께라면 멋진 선생님이 될 수 있어요!',
  },
  C: {
    type: '초보자',
    emoji: '🌱',
    badge: '야구 새내기',
    color: '#16A34A',
    bg: '#F0FDF4',
    desc: '야구의 매력을 이제 막 발견하기 시작한 신선한 팬! 규칙보다 분위기, 점수보다 맛있는 치킨이 더 기억에 남는 당신. 걱정 마세요, 모든 레전드 팬도 처음이 있었습니다. 지금 이 순간이 야구 인생의 시작점이에요!',
    tags: ['#야구새내기', '#분위기최고', '#배우는중', '#치킨필수'],
    match: '분석형 동행을 만나면 야구가 더 재밌어질 거예요!',
  },
  D: {
    type: '어울림형',
    emoji: '🤝',
    badge: '화합의 아이콘',
    color: '#7C3AED',
    bg: '#F5F3FF',
    desc: '어느 팀 경기든, 어느 팬이든 다 좋아요! 야구를 통해 다양한 사람을 만나고 새로운 이야기를 나누는 것을 즐기는 당신. 특정 팀에 얽매이지 않아 어떤 자리에서도 분위기 메이커가 됩니다. 다양한 구장 원정을 도전해 보세요!',
    tags: ['#팀불문', '#인싸형', '#원정다니기', '#야구는사람'],
    match: '열정형과 함께라면 새로운 응원의 재미를 느낄 수 있어요!',
  },
};

function calcBtiResult(answers) {
  const count = { A: 0, B: 0, C: 0, D: 0 };
  answers.forEach(a => { if (count[a] !== undefined) count[a]++; });
  return Object.entries(count).sort((x, y) => y[1] - x[1])[0][0];
}

function BtiPage({ btiStep, setBtiStep, btiAnswers, setBtiAnswers, onSave }) {
  function handleAnswer(key) {
    const next = [...btiAnswers, key];
    setBtiAnswers(next);
    setBtiStep(btiStep + 1);
  }

  function restart() {
    setBtiAnswers([]);
    setBtiStep(0);
  }

  const q = btiStep >= 1 && btiStep <= BTI_QUESTIONS.length ? BTI_QUESTIONS[btiStep - 1] : null;
  const result = btiStep > BTI_QUESTIONS.length ? BTI_RESULTS[calcBtiResult(btiAnswers)] : null;
  const progress = btiStep === 0 ? 0 : Math.min((btiStep / BTI_QUESTIONS.length) * 100, 100);

  // ── Intro ────────────────────────────────────────────────────────────────
  if (btiStep === 0) return (
    <div className="bti-page">
      <div className="bti-intro-card">
        <div className="bti-intro-emoji">⚾</div>
        <h2 className="bti-intro-title">응BTI</h2>
        <p className="bti-intro-sub">나의 야구 응원 유형은?</p>
        <p className="bti-intro-desc">
          8가지 질문으로 알아보는 나만의 야구 관람 스타일!<br/>
          <strong>열정형 · 분석형 · 초보자 · 어울림형</strong> 중 어디에 속할까요?
        </p>
        <div className="bti-type-preview">
          {Object.values(BTI_RESULTS).map(r => (
            <div key={r.type} className="bti-type-chip" style={{background: r.bg, color: r.color, borderColor: r.color + '44'}}>
              {r.emoji} {r.type}
            </div>
          ))}
        </div>
        <button className="bti-start-btn" onClick={() => setBtiStep(1)}>검사 시작하기 →</button>
      </div>
    </div>
  );

  // ── Question ─────────────────────────────────────────────────────────────
  if (q) return (
    <div className="bti-page">
      <div className="bti-progress-wrap">
        <div className="bti-progress-label">{btiStep} / {BTI_QUESTIONS.length}</div>
        <div className="bti-progress-bar">
          <div className="bti-progress-fill" style={{width: progress + '%'}} />
        </div>
      </div>
      <div className="bti-question-card">
        <p className="bti-q-num">Q{btiStep}</p>
        <h3 className="bti-q-text">{q.q}</h3>
        <div className="bti-options">
          {q.opts.map(o => (
            <button key={o.k} className="bti-option-btn" onClick={() => handleAnswer(o.k)}>
              {o.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // ── Result ────────────────────────────────────────────────────────────────
  if (result) return (
    <div className="bti-page">
      <div className="bti-result-card" style={{borderColor: result.color + '55', background: result.bg}}>
        <div className="bti-result-emoji">{result.emoji}</div>
        <div className="bti-result-badge" style={{background: result.color}}>{result.badge}</div>
        <h2 className="bti-result-type" style={{color: result.color}}>{result.type}</h2>
        <p className="bti-result-desc">{result.desc}</p>
        <div className="bti-result-tags">
          {result.tags.map(t => <span key={t} className="bti-tag" style={{color: result.color, background: result.color + '18'}}>{t}</span>)}
        </div>
        <div className="bti-result-match">💡 {result.match}</div>
        {onSave && <button className="bti-save-btn" onClick={() => onSave(calcBtiResult(btiAnswers))}>내 유형으로 저장하기 💾</button>}
        <button className="bti-restart-btn" onClick={restart}>다시 검사하기</button>
      </div>
    </div>
  );

  return null;
}


// ── BTI 유형 정보 맵 (공용) ──────────────────────────────────────────────────
const BTI_INFO = {
  '열정형': { emoji:'🔥', color:'#E63030', bg:'#FFF0F0', badge:'열정 응원단',
    desc:'경기장에서 가장 큰 목소리를 내는 열혈 팬! 응원가를 크게 부르며 에너지를 쏟아붓는 진정한 응원 고수입니다. 당신의 응원이 있어야 팀도 힘이 납니다.',
    tags:['#열혈팬','#응원가달인','#성대혹사','#12번째선수'] },
  '분석형': { emoji:'📊', color:'#1B3D6F', bg:'#EFF3F8', badge:'데이터 야구통',
    desc:'타율·방어율·WAR까지 꿰뚫고 있는 야구 마니아! 감독의 선수 기용 하나하나에 고개를 끄덕이는 진짜 야구 팬입니다. 함께 가면 숨겨진 재미를 두 배로 느낄 수 있어요.',
    tags:['#야구통계마니아','#전술분석','#조용한집중','#해설가급'] },
  '초보자': { emoji:'🌱', color:'#16A34A', bg:'#F0FDF4', badge:'야구 새내기',
    desc:'야구의 매력을 이제 막 발견하기 시작한 신선한 팬! 규칙보다 분위기, 점수보다 맛있는 치킨이 더 기억에 남는 분입니다. 지금이 야구 인생의 시작점이에요!',
    tags:['#야구새내기','#분위기최고','#배우는중','#치킨필수'] },
  '어울림형': { emoji:'🤝', color:'#7C3AED', bg:'#F5F3FF', badge:'화합의 아이콘',
    desc:'어느 팀 경기든, 어느 팬이든 다 환영! 야구를 통해 다양한 사람을 만나고 새로운 이야기를 나누는 걸 즐기는 분입니다. 어떤 자리에서도 분위기 메이커가 됩니다.',
    tags:['#팀불문','#인싸형','#원정다니기','#야구는사람'] },
};

// ── BTI 유형 설명 모달 ────────────────────────────────────────────────────────
function BtiInfoModal({ type, onClose }) {
  const R = BTI_INFO[type];
  if (!R) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card bti-info-modal" style={{borderTop:`4px solid ${R.color}`, background: R.bg}} onClick={e => e.stopPropagation()}>
        <div className="bti-info-emoji">{R.emoji}</div>
        <div className="bti-info-badge" style={{background: R.color}}>{R.badge}</div>
        <h3 className="bti-info-type" style={{color: R.color}}>{type}</h3>
        <p className="bti-info-desc">{R.desc}</p>
        <div className="bti-info-tags">
          {R.tags.map(t => <span key={t} className="bti-tag" style={{color:R.color, background:R.color+'18'}}>{t}</span>)}
        </div>
        <button className="modal-close-btn" onClick={onClose}>닫기</button>
      </div>
    </div>
  );
}

// ── 마이페이지 BTI 결과 박스 ──────────────────────────────────────────────────
function ProfileBtiBox({ btiType, onGo }) {
  const R = btiType ? BTI_INFO[btiType] : null;
  return (
    <div className="profile-bti-box">
      <div className="profile-bti-label">나의 응BTI</div>
      {R ? (
        <div className="profile-bti-result" style={{background: R.bg, borderColor: R.color + '44'}}>
          <span className="profile-bti-emoji">{R.emoji}</span>
          <span className="profile-bti-type" style={{color: R.color}}>{btiType}</span>
          <button className="profile-bti-retest" style={{color: R.color}} onClick={onGo}>재검사</button>
        </div>
      ) : (
        <div className="profile-bti-empty">
          <span>아직 검사하지 않았어요</span>
          <button className="profile-bti-go" onClick={onGo}>검사하러 가기 →</button>
        </div>
      )}
    </div>
  );
}


export default function App() {
  const ticketRef = useRef(null);
  const editTicketRef = useRef(null);

  // ── Session
  const [session, setSession] = useState(null);
  const [sessionChecked, setSessionChecked] = useState(false);

  // ── Posts
  const [posts, setPosts] = useState([]);
  const [teams, setTeams] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState('');

  // ── Board filters
  const [filterType, setFilterType] = useState('team');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [btiFilter, setBtiFilter] = useState('ALL');

  // ── Write form
  const [form, setForm] = useState(INIT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [writeError, setWriteError] = useState('');

  // ── Auth
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState(INIT_AUTH);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // ── Profile
  const [profile, setProfile] = useState(null);
  const [profileForm, setProfileForm] = useState(INIT_PROFILE);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileMsg, setProfileMsg] = useState('');

  // ── My posts
  const [myPosts, setMyPosts] = useState([]);
  const [myPostsLoading, setMyPostsLoading] = useState(false);
  const [myPostsError, setMyPostsError] = useState('');
  const [editingPostId, setEditingPostId] = useState(null);
  const [editForm, setEditForm] = useState(INIT_FORM);
  const [postApplicants, setPostApplicants] = useState({});  // postId → applicants[]

  // ── My applications
  const [myApps, setMyApps] = useState([]);

  // ── Bookmarks
  const [bookmarked, setBookmarked] = useState([]);

  // ── 응BTI
  const [btiModal, setBtiModal] = useState(null);
  const [btiStep, setBtiStep] = useState(0);      // 0=intro, 1-8=question, 9=result
  const [btiAnswers, setBtiAnswers] = useState([]); // 'A'|'B'|'C'|'D' per question

  // ── Navigation
  const [page, setPage] = useState('board');
  const [selectedPost, setSelectedPost] = useState(null);
  const [showKakao, setShowKakao] = useState(false);
  const [applyModal, setApplyModal] = useState(null); // { post }
  const [mypageTab, setMypageTab] = useState('profile');

  // ─────────────────────────────────────────────────────────────────────────────
  // Init: restore session from cookie
  useEffect(() => {
    fetchMyProfile()
      .then(data => {
        setSession({ nickname: data.nickname, email: data.email });
        applyProfileData(data);
      })
      .catch(() => setSession(null))
      .finally(() => setSessionChecked(true));
  }, []);

  function applyProfileData(data) {
    setProfile(data);
    setProfileForm({ name: data.name || '', age: data.age == null ? '' : String(data.age), favoriteTeam: data.favoriteTeam || '', kakaoId: data.kakaoId || '' });
  }

  // Load profile when session changes
  useEffect(() => {
    if (!session) { setProfile(null); setProfileForm(INIT_PROFILE); return; }
    if (profile) return;
    setProfileLoading(true);
    fetchMyProfile()
      .then(applyProfileData)
      .catch(e => setProfileError(e.message))
      .finally(() => setProfileLoading(false));
  }, [session]);

  // Load posts
  const loadPosts = useCallback(async () => {
    setPostsLoading(true); setPostsError('');
    try { setPosts(await fetchPosts()); }
    catch (e) { setPostsError(e.message); }
    finally { setPostsLoading(false); }
  }, []);
  // 초기 로드 + 세션 변경(로그인/로그아웃) 시마다 재로드 → owner 최신화
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (sessionChecked) loadPosts(); }, [sessionChecked, session]);

  // Load teams
  useEffect(() => { fetchTeams().then(setTeams).catch(() => setTeams([])); }, []);

  // Load my applications when logged in
  useEffect(() => {
    if (session) fetchMyApplications().then(setMyApps).catch(() => setMyApps([]));
    else setMyApps([]);
  }, [session]);

  // Load bookmarks when logged in
  useEffect(() => {
    if (session) fetchBookmarked().then(setBookmarked).catch(() => setBookmarked([]));
    else setBookmarked([]);
  }, [session]);

  // Load my posts when on mypage > my-posts tab
  const loadMyPosts = useCallback(async () => {
    if (!session) return;
    setMyPostsLoading(true); setMyPostsError('');
    try { setMyPosts(await fetchMyPosts()); }
    catch (e) { setMyPostsError(e.message); }
    finally { setMyPostsLoading(false); }
  }, [session]);

  useEffect(() => {
    if (page === 'mypage' && mypageTab === 'posts' && session) loadMyPosts();
  }, [page, mypageTab, session, loadMyPosts]);

  // ── Derived: filtered + sorted posts
  const filteredPosts = useMemo(() => {
    let result = posts.filter(post => {
      if (activeFilter !== 'ALL') {
        if (filterType === 'team' && post.authorPreferredTeam !== activeFilter) return false;
        if (filterType === 'stadium' && post.stadium !== activeFilter) return false;
      }
      if (btiFilter !== 'ALL' && post.authorBtiType !== btiFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!post.title.toLowerCase().includes(q) && !post.stadium.toLowerCase().includes(q)) return false;
      }
      return true;
    });
    if (sortOrder === 'newest') return [...result].reverse();
    if (sortOrder === 'gameDate') return [...result].sort((a, b) => String(a.gameDate).localeCompare(String(b.gameDate)));
    return result;
  }, [posts, activeFilter, filterType, searchQuery, sortOrder, btiFilter]);

  const activeCategories = useMemo(
    () => filterType === 'team' ? teams : KBO_STADIUMS.map(s => s.name),
    [filterType, teams]
  );

  // my-applications map: postId → status
  const myAppMap = useMemo(
    () => Object.fromEntries(myApps.map(a => [a.postId, a])),
    [myApps]
  );

  // ── Handlers ─────────────────────────────────────────────────────────────────
  async function handleApply(postId) {
    try {
      await applyToPost(postId);
      const [apps, freshPosts] = await Promise.all([fetchMyApplications(), fetchPosts()]);
      setMyApps(apps); setPosts(freshPosts);
      return freshPosts;
    } catch (e) { alert(e.message); }
  }

  async function handleCancelApply(postId) {
    if (!window.confirm('신청을 취소하시겠습니까?')) return;
    try {
      await cancelApplication(postId);
      const [apps, freshPosts] = await Promise.all([fetchMyApplications(), fetchPosts()]);
      setMyApps(apps); setPosts(freshPosts);
    } catch (e) { alert(e.message); }
  }

  async function handleToggleClose(postId) {
    try {
      await toggleClosePost(postId);
      await Promise.all([loadMyPosts(), loadPosts()]);
    } catch (e) { alert(e.message); }
  }

  async function handleLoadApplicants(postId) {
    if (postApplicants[postId]) { setPostApplicants(prev => { const n = {...prev}; delete n[postId]; return n; }); return; }
    try {
      const list = await fetchPostApplications(postId);
      setPostApplicants(prev => ({ ...prev, [postId]: list }));
    } catch (e) { alert(e.message); }
  }

  async function handleAccept(postId, appId) {
    try {
      await acceptApplication(appId);
      const list = await fetchPostApplications(postId);
      setPostApplicants(prev => ({ ...prev, [postId]: list }));
      await loadMyPosts();
    } catch (e) { alert(e.message); }
  }

  async function handleReject(postId, appId) {
    try {
      await rejectApplication(appId);
      const list = await fetchPostApplications(postId);
      setPostApplicants(prev => ({ ...prev, [postId]: list }));
    } catch (e) { alert(e.message); }
  }

  async function handleDeletePost(postId) {
    if (!window.confirm('공고를 삭제하시겠습니까?')) return;
    try {
      await deletePost(postId);
      setMyPosts(prev => prev.filter(p => p.id !== postId));
      await loadPosts();
    } catch (e) { setMyPostsError(e.message); }
  }

  async function handleUpdatePost(e, postId) {
    e.preventDefault();
    try {
      await updatePost(postId, editForm);
      setEditingPostId(null);
      await Promise.all([loadMyPosts(), loadPosts()]);
    } catch (e) { setMyPostsError(e.message); }
  }

  async function handleBookmark(e, postId) {
    e.stopPropagation();
    if (!session) { setPage('mypage'); return; }
    try {
      const updated = await toggleBookmark(postId);
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, bookmarked: updated.bookmarked } : p));
      if (updated.bookmarked) {
        setBookmarked(prev => [...prev.filter(p => p.id !== postId), updated]);
      } else {
        setBookmarked(prev => prev.filter(p => p.id !== postId));
      }
      if (selectedPost?.id === postId) setSelectedPost(updated);
    } catch (e) { alert(e.message); }
  }

  async function handleSaveBti(typeKey) {
    if (!session) { alert('로그인 후 저장할 수 있습니다.'); return; }
    try {
      const typeLabel = { A: '열정형', B: '분석형', C: '초보자', D: '어울림형' }[typeKey];
      const saved = await saveBtiType(typeLabel);
      setProfile(saved);
      alert(`'${typeLabel}' 유형이 저장되었습니다! 마이페이지에서 확인하세요.`);
    } catch (e) { alert(e.message); }
  }

  async function handleLogout() {
    await apiLogout();
    setSession(null); setProfile(null); setMyApps([]); setPage('board');
  }

  async function onAuthSubmit(e) {
    e.preventDefault(); setAuthError(''); setAuthLoading(true);
    try {
      const p = { email: authForm.email, password: authForm.password };
      if (authMode === 'register') p.nickname = authForm.nickname;
      const r = authMode === 'register' ? await register(p) : await login(p);
      setSession({ nickname: r.nickname, email: r.email });
      setProfile(null); setAuthForm(INIT_AUTH); setProfileMsg('');
    } catch (e) { setAuthError(e.message); }
    finally { setAuthLoading(false); }
  }

  async function onProfileSubmit(e) {
    e.preventDefault();
    setProfileSaving(true); setProfileError(''); setProfileMsg('');
    try {
      const saved = await updateMyProfile({ name: profileForm.name, age: Number(profileForm.age), favoriteTeam: profileForm.favoriteTeam, kakaoId: profileForm.kakaoId || null });
      applyProfileData(saved); setProfileMsg('정보가 저장되었습니다.');
    } catch (e) { setProfileError(e.message); }
    finally { setProfileSaving(false); }
  }

  async function onSubmit(e) {
    e.preventDefault();
    setWriteError(''); setSubmitting(true);
    try {
      await createPost(form);
      setForm(INIT_FORM);
      if (ticketRef.current) ticketRef.current.value = '';
      setPage('board'); await loadPosts();
    } catch (e) { setWriteError(e.message); }
    finally { setSubmitting(false); }
  }

  // page 이동 헬퍼 — 게시판 이동 시 선택 공고 초기화
  function goPage(p) {
    setPage(p);
    if (p !== 'detail') setSelectedPost(null);
  }

  // ── Field change helpers
  const onFormChange = e => {
    const { name, value, files, type } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'file' ? files?.[0] || null : value }));
  };
  const onEditChange = e => {
    const { name, value, files, type } = e.target;
    setEditForm(prev => ({ ...prev, [name]: type === 'file' ? files?.[0] || null : value }));
  };
  function startEdit(post) {
    setEditingPostId(post.id);
    setEditForm({ title: post.title, stadium: post.stadium, gameDate: post.gameDate, description: post.description, totalTickets: String(post.totalTickets), wantedCount: String(post.wantedCount), ticketImageFile: null, seatZone: post.seatZone || '', seatBlock: post.seatBlock || '', seatRow: post.seatRow || '', seatNumber: post.seatNumber || '' });
    if (editTicketRef.current) editTicketRef.current.value = '';
  }

  // ── Disabled helpers
  const writeDisabled = !form.title.trim() || !form.stadium || !form.gameDate || !form.description.trim() || !form.totalTickets || !form.wantedCount || !form.seatZone || !form.ticketImageFile || submitting;
  const authDisabled = !authForm.email.trim() || !authForm.password.trim() || authLoading || (authMode === 'register' && !authForm.nickname.trim());
  const profileDisabled = !profileForm.name.trim() || !profileForm.age || !profileForm.favoriteTeam || !profileForm.kakaoId.trim() || profileSaving;

  // ── Apply button logic for a given post
  function ApplyButton({ post }) {
    // session 체크를 먼저: 로그아웃 후 stale owner 값이 "내 공고"를 표시하는 버그 방지
    if (session && post.owner) return <div className="btn-apply-wrap"><button className="btn-apply own-post" disabled>내 공고</button></div>;
    if (post.closed) return <div className="btn-apply-wrap"><button className="btn-apply closed" disabled>모집이 마감됐습니다</button></div>;
    if (!session) return <div className="btn-apply-wrap"><button className="btn-apply default" onClick={() => setPage('mypage')}>로그인 후 신청하기</button></div>;

    const myApp = myAppMap[post.id];
    if (!myApp) return <div className="btn-apply-wrap"><button className="btn-apply default" onClick={async e => { e.stopPropagation(); try { const fresh = await handleApply(post.id); const freshPost = fresh?.find(p => p.id === post.id) || post; setApplyModal({ post: freshPost }); } catch {} }}>⚾ 동행 신청하기</button></div>;
    if (myApp.status === 'PENDING') return (
      <div className="btn-apply-wrap">
        <button className="btn-apply pending" disabled>⏳ 신청 완료 · 검토 중</button>
        <button className="btn-apply-cancel" onClick={() => handleCancelApply(post.id)}>신청 취소</button>
      </div>
    );
    if (myApp.status === 'ACCEPTED') return <div className="btn-apply-wrap"><button className="btn-apply accepted" disabled>🎉 동행 수락됨!</button></div>;
    return <div className="btn-apply-wrap"><button className="btn-apply rejected" disabled>이번엔 함께하기 어렵게 됐어요</button></div>;
  }

  // ── Auth section (reused)
  const AuthSection = (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">⚾</div>
        <h2 className="auth-title">{authMode === 'login' ? '로그인' : '회원가입'}</h2>
        <p className="auth-sub">{authMode === 'login' ? '야구동행을 시작해볼까요?' : '계정을 만들고 동행을 구해보세요.'}</p>
        <form className="form" onSubmit={onAuthSubmit}>
          {authMode === 'register' && (
            <div className="field"><label className="field-label">닉네임</label>
              <input className="field-input" name="nickname" value={authForm.nickname} onChange={e => setAuthForm(p => ({...p, nickname: e.target.value}))} placeholder="야구광팬" /></div>
          )}
          <div className="field"><label className="field-label">이메일</label>
            <input className="field-input" type="email" name="email" value={authForm.email} onChange={e => setAuthForm(p => ({...p, email: e.target.value}))} placeholder="you@example.com" /></div>
          <div className="field"><label className="field-label">비밀번호</label>
            <input className="field-input" type="password" name="password" value={authForm.password} onChange={e => setAuthForm(p => ({...p, password: e.target.value}))} placeholder="4자 이상" /></div>
          <button className="btn-primary" type="submit" disabled={authDisabled}>
            {authLoading ? '처리 중...' : authMode === 'login' ? '로그인' : '회원가입'}
          </button>
        </form>
        {authError && <p className="msg-error" style={{marginTop:10}}>{authError}</p>}
        <button className="btn-link" onClick={() => { setAuthMode(p => p === 'login' ? 'register' : 'login'); setAuthError(''); }}>
          {authMode === 'login' ? '계정이 없나요? 회원가입' : '이미 계정이 있나요? 로그인'}
        </button>
      </div>
    </div>
  );

  if (!sessionChecked) return null;

  // ── 신청 완료 모달 (카카오 아이디 안내)
  const ApplyModal = applyModal && (
    <div className="modal-overlay" onClick={() => setApplyModal(null)}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <p className="modal-title">✅ 신청이 완료되었습니다!</p>
        <p className="modal-desc">아래 카카오톡 아이디로 작성자에게 연락해 주세요.</p>
        <div className="modal-kakao-box">
          <span className="modal-kakao-label">💬 카카오톡 아이디</span>
          {applyModal.post.authorKakaoId
            ? <span className="modal-kakao-id">{applyModal.post.authorKakaoId}</span>
            : <span className="modal-kakao-empty">등록된 아이디 없음</span>}
        </div>
        <div className="modal-actions">
          <button className="btn-primary modal-confirm-btn" onClick={() => setApplyModal(null)}>확인</button>
        </div>
      </div>
    </div>
  );

  // ── Ticket count selector
  function TicketSelect({ nameT, nameW, valueT, valueW, onChangeT, onChange }) {
    return (
      <div className="field-row">
        <div className="field">
          <label className="field-label">총 티켓 수</label>
          <select className="field-input" name={nameT} value={valueT} onChange={e => {
            const v = e.target.value;
            onChangeT && onChangeT(v);
          }}>
            <option value="">선택</option>
            {Array.from({length:10},(_,i)=>i+1).map(n=><option key={n} value={n}>{n}장</option>)}
          </select>
        </div>
        <div className="field">
          <label className="field-label">모집 인원</label>
          <select className="field-input" name={nameW} value={valueW} onChange={onChange} disabled={!valueT}>
            <option value="">선택</option>
            {valueT && Array.from({length:Number(valueT)},(_,i)=>i+1).map(n=><option key={n} value={n}>{n}명</option>)}
          </select>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="app">

      {ApplyModal}
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="app-header">
        <div className="header-brand">
          <span className="brand-icon">⚾</span>
          <span className="brand-name">야구동행</span>
        </div>
        {session ? (
          <div className="header-session">
            <span className="session-nick">{session.nickname}</span>
            <button className="btn-ghost-sm" onClick={handleLogout}>로그아웃</button>
          </div>
        ) : (
          <span className="header-hint">로그인 후 공고 등록 · 신청</span>
        )}
      </header>

      {/* ── Main ────────────────────────────────────────────────────────────── */}
      <main className="app-main">

        {/* ════ BOARD ════════════════════════════════════════════════════════ */}
        {page === 'board' && (
          <div>
            {/* Search + sort */}
            <div className="board-toolbar">
              <div className="search-wrap">
                <span className="search-icon">🔍</span>
                <input className="search-input" placeholder="제목, 구장으로 검색" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              </div>
              <select className="sort-select" value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
                <option value="newest">최신순</option>
                <option value="gameDate">경기일순</option>
              </select>
            </div>

            {/* Filters */}
            <div className="cat-section">
              <div className="cat-type-row">
                {['team','stadium'].map(t => (
                  <button key={t} className={`cat-type-btn${filterType===t?' active':''}`}
                    onClick={() => { setFilterType(t); setActiveFilter('ALL'); }}>
                    {t === 'team' ? '선호 팀' : '경기 구장'}
                  </button>
                ))}
              </div>
              <div className="cat-chips-row">
                {filterType === 'bti' ? (
                  <>
                    <button className={`cat-chip${btiFilter==='ALL'?' active':''}`} onClick={() => setBtiFilter('ALL')}>전체</button>
                    {['열정형','분석형','초보자','어울림형'].map(t => (
                      <button key={t} className={`cat-chip${btiFilter===t?' active':''}`} onClick={() => setBtiFilter(t)}>
                        {t==='열정형'?'🔥':t==='분석형'?'📊':t==='초보자'?'🌱':'🤝'} {t}
                      </button>
                    ))}
                  </>
                ) : (
                  <>
                    <button className={`cat-chip${activeFilter==='ALL'?' active':''}`} onClick={() => setActiveFilter('ALL')}>전체</button>
                    {activeCategories.map(cat => (
                      <button key={cat} className={`cat-chip${activeFilter===cat?' active':''}`} onClick={() => setActiveFilter(cat)}>{cat}</button>
                    ))}
                  </>
                )}
              </div>
            </div>

            {/* Posts */}
            {postsLoading && <div className="empty-state"><p className="empty-text">공고 불러오는 중...</p></div>}
            {!postsLoading && filteredPosts.length === 0 && (
              <div className="empty-state"><p className="empty-icon">🔍</p><p className="empty-text">조건에 맞는 공고가 없습니다.</p></div>
            )}
            {!postsLoading && filteredPosts.length > 0 && (
              <ul className="post-list">
                {filteredPosts.map(post => (
                  <li key={post.id} className="post-card" onClick={() => { setSelectedPost(post); setShowKakao(false); setPage('detail'); }} style={{cursor:'pointer'}}>
                    {post.ticketImageUrl && <img className="post-card-img" src={post.ticketImageUrl} alt="티켓" loading="lazy" />}
                    <div className="post-card-body">
                      <div className="post-card-top">
                        <span className="post-date">📅 {formatDate(post.gameDate)}</span>
                        <span className="post-stadium-badge">📍 {post.stadium}</span>
                        {post.closed && <span className="closed-badge">마감</span>}
                      </div>
                      <h3 className="post-title">{post.title}</h3>
                      {post.authorBtiType && <span className="author-bti-badge">{{"열정형":"🔥","분석형":"📊","초보자":"🌱","어울림형":"🤝"}[post.authorBtiType] || ""} {post.authorBtiType}</span>}
                      {post.seatZone && (
                        <div className="card-seat-row">
                          <span className="seat-zone-badge">🪑 {post.seatZone}</span>
                          {(post.seatBlock || post.seatRow || post.seatNumber) && (
                            <span className="seat-detail">
                              {[post.seatBlock && `${post.seatBlock}블록`, post.seatRow && `${post.seatRow}열`, post.seatNumber && `${post.seatNumber}번`].filter(Boolean).join(' · ')}
                            </span>
                          )}
                        </div>
                      )}
                      <div className="post-tags">
                        <span className="tag tag-team">{post.authorPreferredTeam}</span>
                        <span className="tag tag-ticket">🎟 {post.totalTickets}장</span>
                        <span className="tag tag-recruit">👥 {post.wantedCount}명 모집</span>
                      </div>

                      <p className="post-desc">{post.description}</p>
                    </div>
                    <div className="post-meta">
                      <span className="post-author">by {post.authorName}</span>
                      {post.applicantCount > 0 && <span className="post-applicant-count">✋ {post.applicantCount}명 신청 중</span>}
                    </div>
                    <ApplyButton post={post} />
                  </li>
                ))}
              </ul>
            )}
            {postsError && <p className="msg-error" style={{margin:'8px 16px'}}>{postsError}</p>}
          </div>
        )}

        {/* ════ DETAIL ══════════════════════════════════════════════════════ */}
        {page === 'detail' && selectedPost && (
            <div className="detail-page">
              <button className="detail-back" onClick={() => goPage('board')}>← 목록으로</button>

              {selectedPost.ticketImageUrl && (
                <img className="detail-img" src={selectedPost.ticketImageUrl} alt="티켓" />
              )}

              <div className="detail-body">
                {/* 상태 배지 */}
                <div className="detail-badges">
                  {selectedPost.closed && <span className="closed-badge">마감</span>}
                  {session && selectedPost.owner && <span className="own-badge">내 공고</span>}
                </div>

                <div className="detail-title-row">
                  <h2 className="detail-title">{selectedPost.title}</h2>
                  <button className={`bookmark-btn-lg${selectedPost.bookmarked ? ' active' : ''}`} onClick={e => handleBookmark(e, selectedPost.id)}>{selectedPost.bookmarked ? '❤️' : '🤍'}</button>
                </div>

                {/* 기본 정보 */}
                <div className="detail-info-grid">
                  <div className="detail-info-item">
                    <span className="detail-info-label">📅 경기 날짜</span>
                    <span className="detail-info-value">{formatDate(selectedPost.gameDate)}</span>
                  </div>
                  <div className="detail-info-item">
                    <span className="detail-info-label">📍 경기장</span>
                    <span className="detail-info-value">{selectedPost.stadium}</span>
                  </div>
                  <div className="detail-info-item">
                    <span className="detail-info-label">🎟 총 티켓</span>
                    <span className="detail-info-value">{selectedPost.totalTickets}장</span>
                  </div>
                  <div className="detail-info-item">
                    <span className="detail-info-label">👥 모집 인원</span>
                    <span className="detail-info-value">{selectedPost.wantedCount}명</span>
                  </div>
                </div>

                {/* 좌석 정보 — 항상 표시 */}
                <div className="detail-seat-box">
                  <p className="detail-seat-title">🪑 좌석 위치</p>
                  <div className="detail-seat-grid">
                    <div className="detail-seat-item">
                      <span className="detail-seat-label">구역</span>
                      <span className="detail-seat-value">{selectedPost.seatZone || '-'}</span>
                    </div>
                    <div className="detail-seat-item">
                      <span className="detail-seat-label">블록</span>
                      <span className="detail-seat-value">{selectedPost.seatBlock || '-'}</span>
                    </div>
                    <div className="detail-seat-item">
                      <span className="detail-seat-label">열</span>
                      <span className="detail-seat-value">{selectedPost.seatRow || '-'}</span>
                    </div>
                    <div className="detail-seat-item">
                      <span className="detail-seat-label">좌석번호</span>
                      <span className="detail-seat-value">{selectedPost.seatNumber || '-'}</span>
                    </div>
                  </div>
                </div>

                {/* 작성자 */}
                <div className="detail-author-box">
                  <div className="detail-author-avatar">{selectedPost.authorName.charAt(0)}</div>
                  <div>
                    <p className="detail-author-name">{selectedPost.authorName}</p>
                    <span className="tag tag-team" style={{fontSize:'0.75rem'}}>{selectedPost.authorPreferredTeam}</span>
                    {selectedPost.authorBtiType && <span className="author-bti-badge sm clickable" onClick={e=>{e.stopPropagation();setBtiModal(selectedPost.authorBtiType);}}>{selectedPost.authorBtiType==="열정형"?"🔥":selectedPost.authorBtiType==="분석형"?"📊":selectedPost.authorBtiType==="초보자"?"🌱":"🤝"} {selectedPost.authorBtiType}</span>}
                  </div>
                  {selectedPost.applicantCount > 0 && (
                    <span className="post-applicant-count" style={{marginLeft:'auto'}}>✋ {selectedPost.applicantCount}명 신청 중</span>
                  )}
                </div>

                {/* 공고 내용 */}
                <div className="detail-desc-box">
                  <p className="detail-desc-label">📝 공고 내용</p>
                  <p className="detail-desc">{selectedPost.description}</p>
                </div>

                {/* 신청 버튼 */}
                <div style={{marginTop:16}}>
                  <ApplyButton post={selectedPost} />
                </div>
              </div>
            </div>
          )}

        {/* ════ WRITE ════════════════════════════════════════════════════════ */}
        {page === 'write' && (
          session ? (
            <div className="write-page">
              <h2 className="page-title">동행 공고 등록</h2>
              {!profile?.profileCompleted && (
                <div className="info-box">
                  <p>📋 마이페이지에서 이름, 나이, 선호 구단을 먼저 저장해 주세요.</p>
                  <button className="btn-ghost" onClick={() => setPage('mypage')}>마이페이지로 이동</button>
                </div>
              )}
              {profile?.profileCompleted && (
                <form className="form" onSubmit={onSubmit}>
                  <div className="field"><label className="field-label">제목</label>
                    <input className="field-input" name="title" value={form.title} onChange={onFormChange} placeholder="함께 직관 가실 분 구해요" /></div>
                  <div className="field"><label className="field-label">경기 장소</label>
                    <select className="field-input" name="stadium" value={form.stadium} onChange={onFormChange}>
                      <option value="">구장 선택</option>
                      {KBO_STADIUMS.map(s=><option key={s.name} value={s.name}>{s.name} ({s.location})</option>)}
                    </select></div>
                  <div className="field"><label className="field-label">경기 날짜</label>
                    <input className="field-input" type="date" name="gameDate" value={form.gameDate} onChange={onFormChange} /></div>
                  <TicketSelect nameT="totalTickets" nameW="wantedCount" valueT={form.totalTickets} valueW={form.wantedCount}
                    onChangeT={v => setForm(p => ({...p, totalTickets:v, wantedCount: p.wantedCount && Number(p.wantedCount)>Number(v)?v:p.wantedCount}))}
                    onChange={onFormChange} />
                  <div className="field"><label className="field-label">내용</label>
                    <textarea className="field-input" name="description" value={form.description} onChange={onFormChange} rows={4} placeholder="만남 장소, 희망 좌석, 연락 방법 등을 적어주세요." /></div>
                  {/* 좌석 위치 */}
                  <div className="field"><label className="field-label">좌석 구역</label>
                    <select className="field-input" name="seatZone" value={form.seatZone} onChange={onFormChange}>
                      <option value="">구역 선택</option>
                      {SEAT_ZONES.map(z => <option key={z} value={z}>{z}</option>)}
                    </select>
                  </div>
                  {form.seatZone && (
                    <div className="field-row seat-detail-row">
                      <div className="field">
                        <label className="field-label">블록</label>
                        <input className="field-input" name="seatBlock" value={form.seatBlock} onChange={onFormChange} placeholder="예) 304" />
                      </div>
                      <div className="field">
                        <label className="field-label">열</label>
                        <input className="field-input" name="seatRow" value={form.seatRow} onChange={onFormChange} placeholder="예) 12" />
                      </div>
                      <div className="field">
                        <label className="field-label">좌석번호</label>
                        <input className="field-input" name="seatNumber" value={form.seatNumber} onChange={onFormChange} placeholder="예) 45 ~ 51" />
                      </div>
                    </div>
                  )}
                  <div className="field"><label className="field-label">티켓 이미지</label>
                    <input className="field-input" ref={ticketRef} type="file" name="ticketImageFile" accept="image/*" onChange={onFormChange} />
                    {form.ticketImageFile && <span className="file-hint">{form.ticketImageFile.name}</span>}</div>
                  <button className="btn-primary" type="submit" disabled={writeDisabled}>
                    {submitting ? '등록 중...' : '공고 등록하기'}
                  </button>
                  {writeError && <p className="msg-error">{writeError}</p>}
                </form>
              )}
            </div>
          ) : AuthSection
        )}


        {/* ════ BTI ════════════════════════════════════════════════════════ */}
        {page === 'bti' && <BtiPage btiStep={btiStep} setBtiStep={setBtiStep} btiAnswers={btiAnswers} setBtiAnswers={setBtiAnswers} onSave={handleSaveBti} />}

        {/* ════ MYPAGE ═══════════════════════════════════════════════════════ */}
        {page === 'mypage' && (
          session ? (
            <div>
              {/* Hero */}
              <div className="profile-hero">
                <div className="profile-avatar">{session.nickname.charAt(0)}</div>
                <div>
                  <p className="profile-nick">{session.nickname}</p>
                  <p className="profile-email">{session.email}</p>
                </div>
              </div>

              {/* Tabs */}
              <div className="mypage-tabs">
                {[['profile','내 정보'],['posts','내 공고'],['applications','내 신청'],['bookmarks','내 찜']].map(([t,l]) => (
                  <button key={t} className={`mypage-tab${mypageTab===t?' active':''}`}
                    onClick={() => setMypageTab(t)}>{l}</button>
                ))}
              </div>

              <div className="mypage-content">
                {/* ─ 내 정보 ─ */}
                {mypageTab === 'profile' && (
                  <>
                    {profileLoading ? <p className="empty-text">불러오는 중...</p> : (
                      <form className="form" onSubmit={onProfileSubmit}>
                        <div className="field"><label className="field-label">이름</label>
                          <input className="field-input" name="name" value={profileForm.name} onChange={e=>setProfileForm(p=>({...p,name:e.target.value}))} placeholder="홍길동" /></div>
                        <div className="field"><label className="field-label">나이</label>
                          <input className="field-input" type="number" name="age" min="1" max="120" value={profileForm.age} onChange={e=>setProfileForm(p=>({...p,age:e.target.value}))} placeholder="25" /></div>
                        <div className="field"><label className="field-label">선호 구단</label>
                          <select className="field-input" name="favoriteTeam" value={profileForm.favoriteTeam} onChange={e=>setProfileForm(p=>({...p,favoriteTeam:e.target.value}))}>
                            <option value="">구단 선택</option>
                            {teams.map(t=><option key={t} value={t}>{t}</option>)}
                          </select></div>
                        <div className="field"><label className="field-label">카카오톡 아이디</label>
                          <input className="field-input" name="kakaoId" value={profileForm.kakaoId} onChange={e=>setProfileForm(p=>({...p,kakaoId:e.target.value}))} placeholder="kakao_id" /></div>
                        <button className="btn-primary" type="submit" disabled={profileDisabled}>
                          {profileSaving ? '저장 중...' : '내 정보 저장'}
                        </button>
                      </form>
                    )}
                    {profileMsg && <p className="msg-success" style={{marginTop:8}}>{profileMsg}</p>}
                    {profileError && <p className="msg-error" style={{marginTop:8}}>{profileError}</p>}
                    {/* BTI 결과 박스 */}
                    <ProfileBtiBox btiType={profile?.btiType} onGo={() => { setBtiStep(0); setBtiAnswers([]); goPage('bti'); }} />
                  </>
                )}

                {/* ─ 내 공고 ─ */}
                {mypageTab === 'posts' && (
                  <>
                    {myPostsLoading && <div className="empty-state"><p className="empty-text">불러오는 중...</p></div>}
                    {!myPostsLoading && myPosts.length === 0 && <div className="empty-state"><p className="empty-icon">📋</p><p className="empty-text">등록한 공고가 없습니다.</p></div>}
                    {myPosts.map(post => (
                      editingPostId === post.id ? (
                        <div key={post.id} className="edit-form-card">
                          <p className="edit-form-title">✏️ 공고 수정</p>
                          <form className="form" onSubmit={e => handleUpdatePost(e, post.id)}>
                            <div className="field"><label className="field-label">제목</label>
                              <input className="field-input" name="title" value={editForm.title} onChange={onEditChange} /></div>
                            <div className="field"><label className="field-label">경기 장소</label>
                              <select className="field-input" name="stadium" value={editForm.stadium} onChange={onEditChange}>
                                <option value="">구장 선택</option>
                                {KBO_STADIUMS.map(s=><option key={s.name} value={s.name}>{s.name} ({s.location})</option>)}
                              </select></div>
                            <div className="field"><label className="field-label">경기 날짜</label>
                              <input className="field-input" type="date" name="gameDate" value={editForm.gameDate} onChange={onEditChange} /></div>
                            <TicketSelect nameT="totalTickets" nameW="wantedCount" valueT={editForm.totalTickets} valueW={editForm.wantedCount}
                              onChangeT={v => setEditForm(p => ({...p, totalTickets:v, wantedCount:p.wantedCount&&Number(p.wantedCount)>Number(v)?v:p.wantedCount}))}
                              onChange={onEditChange} />
                            <div className="field"><label className="field-label">내용</label>
                              <textarea className="field-input" name="description" value={editForm.description} onChange={onEditChange} rows={3} /></div>
                            {/* 좌석 위치 수정 */}
                            <div className="field"><label className="field-label">좌석 구역</label>
                              <select className="field-input" name="seatZone" value={editForm.seatZone} onChange={onEditChange}>
                                <option value="">구역 선택</option>
                                {SEAT_ZONES.map(z => <option key={z} value={z}>{z}</option>)}
                              </select>
                            </div>
                            <div className="field-row seat-detail-row">
                                <div className="field">
                                  <label className="field-label">블록</label>
                                  <input className="field-input" name="seatBlock" value={editForm.seatBlock} onChange={onEditChange} placeholder="예) 304" />
                                </div>
                                <div className="field">
                                  <label className="field-label">열</label>
                                  <input className="field-input" name="seatRow" value={editForm.seatRow} onChange={onEditChange} placeholder="예) 12" />
                                </div>
                                <div className="field">
                                  <label className="field-label">좌석번호</label>
                                  <input className="field-input" name="seatNumber" value={editForm.seatNumber} onChange={onEditChange} placeholder="예) 45 ~ 51" />
                                </div>
                              </div>
                            <div className="field"><label className="field-label">티켓 이미지 교체 <span className="field-optional">(선택)</span></label>
                              <input className="field-input" ref={editTicketRef} type="file" name="ticketImageFile" accept="image/*" onChange={onEditChange} /></div>
                            <div className="edit-actions">
                              <button className="btn-primary" style={{flex:1}} type="submit" disabled={!editForm.title.trim()||!editForm.stadium||!editForm.gameDate||!editForm.description.trim()||!editForm.totalTickets||!editForm.wantedCount||!editForm.seatZone}>저장</button>
                              <button className="btn-ghost" type="button" onClick={() => setEditingPostId(null)}>취소</button>
                            </div>
                          </form>
                        </div>
                      ) : (
                        <div key={post.id} className="my-post-card">
                          {post.ticketImageUrl && <img style={{width:'100%',height:120,objectFit:'cover',borderRadius:8,marginBottom:10}} src={post.ticketImageUrl} alt="티켓" loading="lazy" />}
                          <div className="my-post-header">
                            <h3 className="my-post-title">{post.title}</h3>
                            {post.closed && <span className="closed-badge">마감</span>}
                          </div>
                          <p className="my-post-meta">📅 {formatDate(post.gameDate)} · 📍 {post.stadium} · 👥 {post.wantedCount}명 모집</p>
                          <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:8}}>
                            <span className="tag tag-team">{post.authorPreferredTeam}</span>
                            {post.applicantCount > 0 && <span className="post-applicant-count" style={{fontSize:'0.8rem'}}>✋ {post.applicantCount}명 신청</span>}
                          </div>

                          {/* Applicants panel toggle */}
                          {post.applicantCount > 0 && (
                            <button className="btn-ghost" style={{width:'100%',marginBottom:8,fontSize:'0.82rem',padding:'7px'}}
                              onClick={() => handleLoadApplicants(post.id)}>
                              {postApplicants[post.id] ? '신청자 목록 닫기 ▲' : `신청자 ${post.applicantCount}명 보기 ▼`}
                            </button>
                          )}
                          {postApplicants[post.id] && (
                            <div className="applicants-panel">
                              <p className="applicants-panel-title">신청자 목록</p>
                              {postApplicants[post.id].map(app => (
                                <div key={app.id} className="applicant-row">
                                  <span className="applicant-name">👤 {app.applicantName}</span>
                                  <span className={`status-badge status-${app.status.toLowerCase()}`}>{STATUS_LABEL[app.status]}</span>
                                  {app.message && <span className="applicant-msg">💬 {app.message}</span>}
                                  {app.status === 'ACCEPTED' && app.applicantKakaoId && (
                                    <div className="accepted-kakao">
                                      <span className="accepted-kakao-label">💬 카카오톡</span>
                                      <span className="accepted-kakao-id">{app.applicantKakaoId}</span>
                                    </div>
                                  )}
                                  {app.status === 'PENDING' && (
                                    <div style={{display:'flex',gap:5,marginLeft:'auto'}}>
                                      <button className="btn-sm btn-accept" onClick={() => handleAccept(post.id, app.id)}>수락</button>
                                      <button className="btn-sm btn-reject" onClick={() => handleReject(post.id, app.id)}>거절</button>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="my-post-actions">
                            <button className="btn-sm btn-edit" onClick={() => startEdit(post)}>✏️ 수정</button>
                            <button className="btn-sm btn-delete" onClick={() => handleDeletePost(post.id)}>🗑 삭제</button>
                            <button className={`btn-sm ${post.closed ? 'btn-reopen-post' : 'btn-close-post'}`}
                              onClick={() => handleToggleClose(post.id)}>
                              {post.closed ? '🔓 모집 재개' : '🔒 마감하기'}
                            </button>
                          </div>
                        </div>
                      )
                    ))}
                    {myPostsError && <p className="msg-error">{myPostsError}</p>}
                  </>
                )}

                {/* ─ 내 찜 ─ */}
                {mypageTab === 'bookmarks' && (
                  <>
                    {bookmarked.length === 0 && <div className="empty-state"><p className="empty-icon">🤍</p><p className="empty-text">찜한 공고가 없습니다.</p></div>}
                    <ul className="post-list">
                      {bookmarked.map(post => (
                        <li key={post.id} className="post-card" onClick={() => { setSelectedPost(post); setShowKakao(false); setPage('detail'); }} style={{cursor:'pointer'}}>
                          {post.ticketImageUrl && <img className="post-card-img" src={post.ticketImageUrl} alt="티켓" loading="lazy" />}
                          <div className="post-card-body">
                            <div className="post-card-top">
                              <span className="post-date">📅 {formatDate(post.gameDate)}</span>
                              <span className="post-stadium-badge">📍 {post.stadium}</span>
                              {post.closed && <span className="closed-badge">마감</span>}
                              <button className={`bookmark-btn${post.bookmarked ? ' active' : ''}`} onClick={e => handleBookmark(e, post.id)} title="찜하기">{post.bookmarked ? '❤️' : '🤍'}</button>
                            </div>
                            <h3 className="post-title">{post.title}</h3>
                            {post.seatZone && <div className="card-seat-row"><span className="seat-zone-badge">🪑 {post.seatZone}</span></div>}
                          </div>
                          <div className="post-meta">
                            <span className="post-author">by {post.authorName}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                {/* ─ 내 신청 ─ */}
                {mypageTab === 'applications' && (
                  <>
                    {myApps.length === 0 && <div className="empty-state"><p className="empty-icon">📝</p><p className="empty-text">신청한 공고가 없습니다.</p></div>}
                    <div style={{display:'flex',flexDirection:'column',gap:10}}>
                      {myApps.map(app => (
                        <div key={app.id} className="application-card">
                          <div className="application-card-top">
                            <div>
                              <p className="application-post-title">{app.postTitle}</p>
                              <p className="application-post-meta">📍 {app.postStadium} · 📅 {formatDate(app.postGameDate)}</p>
                            </div>
                            <span className={`status-badge status-${app.status.toLowerCase()}`}>{STATUS_LABEL[app.status]}</span>
                          </div>
                          {app.status === 'PENDING' && (
                            <button className="btn-apply-cancel" onClick={() => handleCancelApply(app.postId)}>신청 취소</button>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : AuthSection
        )}
      </main>


      {/* ── BTI 유형 설명 모달 ───────────────────────────────────────────────── */}
      {btiModal && <BtiInfoModal type={btiModal} onClose={() => setBtiModal(null)} />}
      {/* ── Bottom Nav ──────────────────────────────────────────────────────── */}
      <nav className="bottom-nav">
        {[['board',<IconBoard key="b"/>,'공고'],['write',<IconWrite key="w"/>,'글쓰기'],['bti',<IconBti key="bti"/>,'응BTI'],['mypage',<IconUser key="u"/>,'마이']].map(([id,icon,label]) => (
          <button key={id} className={`tab-item${page===id?' active':''}`} onClick={() => goPage(id)}>
            {icon}<span className="tab-label">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
