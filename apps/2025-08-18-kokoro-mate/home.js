// home.js - ホーム画面制御とナビゲーション管理
import { saveData } from './data/save-data.js';
import { resultsManager } from './results/results.js';
import { promptsManager } from './prompts/prompts.js';

class HomeManager {
  constructor() {
    this.currentScreen = 'home';
    this.gameModule = null;
    this.init();
  }

  init() {
    this.loadPlayerData();
    this.bindEvents();
    this.createParticles();
    this.checkFirstTime();
  }

  bindEvents() {
    document.getElementById('btn-training')?.addEventListener('click', () => this.startTraining());
    document.getElementById('btn-battle')  ?.addEventListener('click', () => this.showComingSoon());
    document.getElementById('btn-results') ?.addEventListener('click', () => this.showResults());
    document.getElementById('btn-prompts') ?.addEventListener('click', () => this.showPrompts());
    // 設定・ヘルプボタンは削除済み

    // ★ ここを popstate から hashchange に変更（戻り誤爆を防ぐ）
    window.addEventListener('hashchange', () => {
      const target = (location.hash || '#home').replace('#', '');
      this.transitionToScreen(target);
    });
  }

  loadPlayerData() {
    const data = saveData.load();
    const home = document.getElementById('home-screen');
    if (!home) return;
    const q = (sel) => home.querySelector(sel);

    // Lv.表示と問題完了数表示は削除済み

    if (data.answeredQuestions > 0) {
      const badge = q('#training-badge');
      if (badge) { badge.textContent = '続きから'; badge.style.background = '#4CAF50'; }
    }
  }

  createParticles() {
    const container = document.querySelector('.home-particles');
    if (!container) return;
    for (let i = 0; i < 15; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      p.style.cssText = `
        position:absolute;width:${Math.random()*4+2}px;height:${Math.random()*4+2}px;
        background:rgba(255,255,255,${Math.random()*0.3+0.2});border-radius:50%;
        left:${Math.random()*100}%;top:${Math.random()*100}%;
        animation:particleFloat ${Math.random()*10+15}s linear infinite;
      `;
      container.appendChild(p);
    }
    if (!document.getElementById('particle-styles')) {
      const style = document.createElement('style');
      style.id = 'particle-styles';
      style.textContent = `
        @keyframes particleFloat {
          0% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
          10% { opacity: 1; } 90% { opacity: 1; }
          100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
  }

  checkFirstTime() {
    // ウェルカムメッセージを無効化
  }

  showWelcomeMessage() {
    const message = document.createElement('div');
    message.className = 'welcome-message';
    message.innerHTML = `
      <div class="welcome-content">
        <h2>ようこそ！</h2>
        <p>「決め切るAI」へようこそ！</p>
        <p>100の質問に答えて、AIを成長させましょう。</p>
        <button class="welcome-btn">始める</button>
      </div>`;
    const style = document.createElement('style');
    style.textContent = `
      .welcome-message{position:fixed;inset:0;background:rgba(0,0,0,.8);
        display:flex;align-items:center;justify-content:center;z-index:10000;animation:fadeIn .5s}
      .welcome-content{background:#fff;padding:30px;border-radius:20px;text-align:center;max-width:300px;animation:slideUp .5s}
      .welcome-content h2{color:#667eea;margin-bottom:15px}
      .welcome-content p{color:#666;margin-bottom:10px;line-height:1.5}
      .welcome-btn{margin-top:20px;padding:12px 30px;background:linear-gradient(135deg,#667eea,#764ba2);
        color:#fff;border:none;border-radius:25px;font-size:16px;font-weight:bold;cursor:pointer}
      @keyframes fadeIn{from{opacity:0}to{opacity:1}}
      @keyframes slideUp{from{transform:translateY(30px);opacity:0}to{transform:translateY(0);opacity:1}}
    `;
    document.head.appendChild(style);
    document.body.appendChild(message);
    message.querySelector('.welcome-btn')?.addEventListener('click', () => { message.remove(); this.startTraining(); });
  }

  // ===== 重要：DOM は毎回保証、import は一度だけ =====
  async startTraining() {
    this.transitionToScreen('game');

    // ゲーム用CSSは動的（重複は loadCSS が抑止）
    this.loadCSS('./game/styles.css', 'game-styles');
    this.loadCSS('./game/story.css', 'story-styles');

    // ゲームDOMを必ず用意
    const gameContainer = document.getElementById('game-screen');
    if (!gameContainer) return;
    if (!gameContainer.querySelector('.stage-container')) {
      gameContainer.innerHTML = this.getGameHTML();
      // ★ オーバーレイ中の誤タップ防止：戻るボタンのバインド
      gameContainer.querySelector('#return-home')
        ?.addEventListener('click', (e) => { e.stopPropagation(); if (confirm('進捗を保存してホームに戻りますか？')) { try { this.gameModule?.saveProgress?.(); } catch {} this.returnToHome(); }});
    }

    try {
      if (!this.gameModule) {
        const gameModule = await import('./game/app.js');
        this.gameModule = gameModule;
      }
      
      // セーブデータがあるかチェックして適切な関数を呼び出し
      const saveDataModule = await import('./data/save-data.js');
      const savedData = saveDataModule.saveData.load();
      
      if (savedData && savedData.answeredQuestions > 0) {
        console.log('[DEBUG] セーブデータあり。resumeGame()を呼び出します。');
        this.gameModule.resumeGame?.();
      } else {
        console.log('[DEBUG] セーブデータなし。initGame()を呼び出します。');
        this.gameModule.initGame?.();
      }
    } catch (error) {
      console.error('ゲームモジュールの読み込みエラー:', error);
      console.error('エラー詳細:', error.message, error.stack);
      
      // フォールバック: 直接initGameを呼び出し
      try {
        if (this.gameModule?.initGame) {
          this.gameModule.initGame();
        }
      } catch (fallbackError) {
        console.error('フォールバック初期化も失敗:', fallbackError);
        if (confirm('ゲームの読み込みに失敗しました。ページを再読み込みしますか？')) location.reload();
      }
    }
  }

  loadCSS(href, id) {
    if (document.getElementById(id)) return;
    const link = document.createElement('link'); link.id = id; link.rel = 'stylesheet'; link.href = href;
    document.head.appendChild(link);
  }

  getGameHTML() {
    return `
      <div class="stage-container s1">
        <div class="spotlight"></div>
        <div class="particle-container" id="particles"></div>
        <div class="status-bar">
          <button class="home-btn" id="return-home">‹</button>
          <div class="stage-display"><span id="stage-name">Stage 1: 自己認識の門</span></div>
          <div class="q-counter">Q<span id="q-number">1</span>/100</div>
        </div>
        <div class="battle-stage">
          <div class="battle-row s1">
            <div class="player-side">
              <div class="aw" id="aura-wrapper">
                <div class="ar" style="width:62px;height:62px;border-width:1.5px;animation-delay:0s;"></div>
                <div class="ar" style="width:80px;height:80px;border-width:1px;animation-delay:.5s;"></div>
                <div class="ar" style="width:98px;height:98px;border-width:1px;animation-delay:1s;"></div>
                <img class="pi" id="player-char" src="./char/character1.png" alt="キャラクター"/>
              </div>
              <div class="apct" id="awake-pct">覚醒度 0%</div>
              <div class="agb"><div class="agbg"><div class="agfg" id="awake-bar" style="width:0%"></div></div></div>
            </div>
            <div class="az" id="action-zone">
              <div class="beam"></div>
              <div class="bimpact"></div>
              <div class="rip r1"></div><div class="rip r2"></div><div class="rip r3"></div>
              <div class="feather f1"></div><div class="feather f2"></div><div class="feather f3"></div>
              <div class="feather f4"></div><div class="feather f5"></div>
              <div class="son sn1"></div><div class="son sn2"></div><div class="sctr"></div>
              <svg class="blt" width="18" height="70" viewBox="0 0 18 70" aria-hidden="true">
                <polyline points="9,0 3,28 10,28 2,70" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/>
              </svg>
              <div class="bgl"></div>
              <div class="bst bs1"></div><div class="bst bs2"></div><div class="bst bs3"></div>
              <div class="bcore"></div>
              <div class="pt p1"></div><div class="pt p2"></div><div class="pt p3"></div>
              <div class="pt p4"></div><div class="pt p5"></div><div class="pt p6"></div>
              <div class="pt p7"></div><div class="pt p8"></div>
              <div class="csp cs1"></div><div class="csp cs2"></div><div class="csp cs3"></div>
              <div class="csp cs4"></div><div class="csp cs5"></div>
            </div>
            <div class="enemy-side">
              <div class="ew" id="enemy-wrapper">
                <div class="enemy-sprite" id="enemy-sprite">🎭</div>
                <div class="dmg" id="dmg-number">-30</div>
              </div>
              <span class="boss-tag" id="boss-tag" style="display:none">BOSS</span>
              <span class="enemy-name" id="enemy-name">自己認識の門番</span>
              <span class="enemy-level-wrap">Lv.<span id="enemy-level">1</span></span>
              <div class="enemy-hp-bar">
                <span class="hp-lbl">HP</span>
                <div class="hp-bg"><div class="enemy-hp-fill" id="enemy-hp" style="width:100%"></div></div>
                <span class="hp-val"><span id="enemy-hp-current">200</span>/<span id="enemy-hp-max">200</span></span>
              </div>
            </div>
          </div>
          <div class="question-card">
            <div class="question-header">
              <div class="question-category" id="question-category">性格診断</div>
            </div>
            <div class="question-text" id="question">大勢の人がいるパーティーでは、エネルギーを得る</div>
            <div class="seg-wrap">
              <button class="seg" id="btn-5" data-value="5">とても</button>
              <button class="seg" id="btn-4" data-value="4">やや</button>
              <button class="seg" id="btn-3" data-value="3">どちらでも</button>
              <button class="seg" id="btn-2" data-value="2">あまり</button>
              <button class="seg" id="btn-1" data-value="1">全く</button>
            </div>
            <div class="time-gauge" style="display:none"><div class="time-remaining" id="time-remaining"></div></div>
          </div>
        </div>
        <div class="audience">
          <div class="audience-member" style="--i:0"></div><div class="audience-member" style="--i:1"></div>
          <div class="audience-member" style="--i:2"></div><div class="audience-member" style="--i:3"></div>
          <div class="audience-member" style="--i:4"></div>
        </div>
      </div>
      <div class="character-modal" id="character-modal">
        <div class="character-card">
          <div class="character-rarity" id="character-rarity">★★★</div>
          <div class="character-image-container" id="character-image-container">
            <img class="character-image" id="character-image" src="./char/character_blue1.png" alt="キャラクター画像" />
          </div>
          <div class="character-name" id="character-name">アーティスト</div>
          <div class="character-title" id="character-title">創造の探求者</div>
          <!-- 攻撃力・防御力・特殊能力は削除 -->
          <div class="character-description" id="character-description">創造性と感性を武器に戦う芸術家タイプ。独創的な発想で敵を翻弄する。</div>
          <button class="continue-btn" id="continue-btn">仲間に加える！</button>
        </div>
      </div>
      <div class="result-modal" id="result-modal">
        <div class="result-card">
          <h2 class="result-title">🎊 診断完了！ 🎊</h2>
          <div class="result-content">
            <div class="mbti-result"><h3>MBTIタイプ</h3><div class="mbti-type" id="mbti-type">INTJ</div><div class="mbti-name" id="mbti-name">建築家</div></div>
            <div class="personality-radar"><canvas id="radar-chart"></canvas></div>
            <div class="trait-scores"><h3>性格特性スコア</h3><div class="trait-list" id="trait-list"></div></div>
            <div class="final-stats">
              <div class="stat">仲間: <span id="final-party">0</span>人</div>
            </div>
          </div>
          <button class="restart-btn" id="restart-btn">ホームに戻る</button>
        </div>
      </div>
      <div class="prompt-modal" id="prompt-modal">
        <div class="prompt-card">
          <div class="prompt-header">
            <h2 id="prompt-title">Step完了プロンプト</h2>
            <button class="close-btn" id="prompt-close">×</button>
          </div>
          <div class="prompt-content-area">
            <div class="copy-header">
              <span>生成されたプロンプト</span>
              <button class="copy-btn" id="prompt-copy">📋 コピー</button>
            </div>
            <pre id="prompt-text"></pre>
          </div>
          <button class="continue-btn" id="prompt-continue">次のStepへ</button>
        </div>
      </div>
      <div class="step-complete-modal" id="step-complete-modal">
        <div class="step-complete-card">
          <div class="step-complete-header">
            <div class="step-complete-icon">✨</div>
            <h2 id="step-complete-title">Step 1 完了！</h2>
            <div class="step-complete-subtitle">専用プロンプトを獲得しました</div>
          </div>
          <div class="step-complete-content">
            <div class="step-summary">
              <div class="summary-item">
                <span class="summary-label">完了した質問数</span>
                <span class="summary-value" id="step-questions-count">10</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">獲得キャラクター</span>
                <span class="summary-value" id="step-character">ストラテジスト</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">生成プロンプト</span>
                <span class="summary-value">決断支援AI</span>
              </div>
            </div>
            <div class="step-progress">
              <div class="progress-label">診断進捗</div>
              <div class="progress-bar">
                <div class="progress-fill" id="step-progress-fill"></div>
              </div>
              <div class="progress-text" id="step-progress-text">10/100問完了</div>
            </div>
          </div>
          <div class="step-complete-actions">
            <button class="action-btn secondary" id="step-complete-home">
              <span class="btn-icon">🏠</span>
              <span class="btn-text">ホームに戻る</span>
            </button>
            <button class="action-btn primary" id="step-complete-continue">
              <span class="btn-icon">➡️</span>
              <span class="btn-text">次のStepへ</span>
            </button>
          </div>
        </div>
      </div>`;
  }

  showResults() { this.transitionToScreen('results'); this.loadCSS('./results/results.css','results-styles'); resultsManager.show(); }
  showPrompts() { this.transitionToScreen('prompts'); this.loadCSS('./prompts/prompts.css','prompts-styles'); promptsManager.show(); }
  // 設定・ヘルプ機能は削除済み

  showComingSoon() {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = 'バトルモードは開発中です！';
    toast.style.cssText = `position:fixed;bottom:100px;left:50%;transform:translateX(-50%);
      background:rgba(0,0,0,.8);color:#fff;padding:15px 30px;border-radius:25px;z-index:1000;animation:toastSlide 2s ease;`;
    const style = document.createElement('style');
    style.textContent = `
      @keyframes toastSlide {
        0% { transform: translateX(-50%) translateY(100px); opacity: 0; }
        20% { transform: translateX(-50%) translateY(0); opacity: 1; }
        80% { transform: translateX(-50%) translateY(0); opacity: 1; }
        100% { transform: translateX(-50%) translateY(100px); opacity: 0; }
      }`;
    document.head.appendChild(style);
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  }

  transitionToScreen(screenName) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active')); // 安全に全外し
    const newScreen = document.getElementById(`${screenName}-screen`);
    if (newScreen) {
      newScreen.classList.add('active');
      this.currentScreen = screenName;
      window.location.hash = screenName; // 履歴連携
    }
  }

  returnToHome() {
    this.transitionToScreen('home');
    this.loadPlayerData();
    window.location.hash = '';
  }
}

document.addEventListener('DOMContentLoaded', () => { window.homeManager = new HomeManager(); });
export { HomeManager };
