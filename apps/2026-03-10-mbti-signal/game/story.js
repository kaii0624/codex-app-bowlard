// game/story.js - ストーリー管理モジュール（完全版 / 章トランジション付き）
import { storyData } from '../data/story-data.js';
import { saveData } from '../data/save-data.js';
import { characters } from '../data/entities.js';

class StoryManager {
  constructor() {
    this.currentChapter = 0;
    this.currentDialogue = 0;
    this.isPlaying = false;
    this.onStoryComplete = null;

    // DOM refs
    this.overlay = null;
    this.speakerEl = null;
    this.textEl = null;
    this.nextIndicator = null;
    this.skipBtn = null;

    // キー操作（Enter/Spaceで進行）
    this._keyHandler = (e) => {
      if (!this.isPlaying) return;
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        this.nextDialogue();
      }
    };

    this.createStoryOverlay();
  }

  /* ================= Overlay ================= */
  createStoryOverlay() {
    const exist = document.getElementById('story-overlay');
    if (exist) {
      this.overlay = exist;
      this.cacheNodes();
      return;
    }

    const overlay = document.createElement('div');
    overlay.id = 'story-overlay';
    overlay.className = 'story-overlay'; // story.css と連動
    overlay.innerHTML = `
      <div class="story-overlay-inner">
        <div class="story-container">
          <div class="story-scene" id="story-scene"></div>

          <div class="story-dialogue-box">
            <div class="story-speaker-name" id="story-speaker">...</div>
            <div class="story-dialogue-text" id="story-text">...</div>
            <div class="story-next-indicator" id="story-next">▼</div>
          </div>

          <button class="story-skip-btn" id="story-skip" type="button" aria-label="スキップ">スキップ ≫</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    // 念のための前面化（CSSでも指定済み） + 強制スタイル
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.zIndex = '10000';
    overlay.style.pointerEvents = 'none';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.background = 'rgba(0, 0, 0, 0.95)';
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.3s ease';

    this.overlay = overlay;
    this.cacheNodes();

    // クリックは確実にここで消費（裏のボタンに伝播させない）
    this.overlay.addEventListener('click', (e) => {
      if (!(e.target instanceof Element)) return;
      if (e.target.closest('#story-skip')) return; // スキップは別ハンドラ
      e.stopPropagation();
      this.nextDialogue();
    });

    // スキップ
    this.skipBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.completeStory();
    });
  }

  cacheNodes() {
    this.speakerEl = this.overlay.querySelector('#story-speaker');
    this.textEl = this.overlay.querySelector('#story-text');
    this.nextIndicator = this.overlay.querySelector('#story-next');
    this.skipBtn = this.overlay.querySelector('#story-skip');
  }

  /* ================= 再生制御 ================= */
  playStory(chapterIndex = 0, callback) {
    const chapter = storyData?.chapters?.[chapterIndex];
    if (!chapter || !Array.isArray(chapter.dialogues)) {
      console.warn('[story] 指定章が見つかりません:', chapterIndex, chapter);
      if (typeof callback === 'function') callback();
      return;
    }

    console.log(`[DEBUG] ストーリー再生開始: 第${chapterIndex}章`, chapter.title);
    this.currentChapter = chapterIndex;
    this.currentDialogue = 0;
    this.onStoryComplete = typeof callback === 'function' ? callback : null;
    this.isPlaying = true;

    console.log('[DEBUG] activeクラス追加前:', this.overlay.className);
    this.overlay.classList.add('active');
    // 強制的にスタイルを適用
    this.overlay.style.opacity = '1';
    this.overlay.style.pointerEvents = 'auto';
    console.log('[DEBUG] activeクラス追加後:', this.overlay.className);
    
    window.addEventListener('keydown', this._keyHandler, { passive: false });
    this.showDialogue();
  }

  showDialogue() {
    const chapter = storyData.chapters[this.currentChapter];
    const dialogue = chapter.dialogues[this.currentDialogue];

    console.log(`[DEBUG] showDialogue: 第${this.currentChapter}章 - ${this.currentDialogue}番目`, dialogue);

    if (!dialogue) {
      console.log('[DEBUG] ダイアログが見つからない、ストーリー完了');
      this.completeStory();
      return;
    }

    // シーンの設定とキャラクター表示
    const scene = this.overlay.querySelector('#story-scene');
    scene.className = 'story-scene';
    if (dialogue.effect) scene.classList.add(`effect-${dialogue.effect}`);
    
    // シーンにキャラクターを表示
    this.setupScene(scene, dialogue);

    console.log('[DEBUG] DOM要素確認:', {
      speakerEl: this.speakerEl,
      textEl: this.textEl,
      nextIndicator: this.nextIndicator
    });

    this.speakerEl.textContent = dialogue.speaker ?? '';
    this.textEl.textContent = dialogue.text ?? '';
    this.nextIndicator.style.opacity = '1';
    
    console.log(`[DEBUG] ダイアログ設定完了: "${dialogue.speaker}" - "${dialogue.text}"`);
  }

  setupScene(scene, dialogue) {
    // 初回セットアップの場合のみシーンを初期化
    if (!scene.querySelector('.story-room')) {
      scene.innerHTML = '';
      
      // 基本的な部屋の背景を作成
      const room = document.createElement('div');
      room.className = 'story-room';
      
      // 窓を追加
      const window = document.createElement('div');
      window.className = 'story-window';
      room.appendChild(window);
      
      scene.appendChild(room);
      
      // モバイルとデスクトップ兼用キャラクターコンテナを作成
      const charactersContainer = document.createElement('div');
      charactersContainer.className = 'story-characters';
      
      // 基本キャラクター（ご主人様とAI）を作成
      const master = this.createMasterCharacter();
      const aiRobot = this.createAIRobotCharacter();
      
      // キャラクターコンテナに追加（CSSでモバイル/デスクトップ切り替え）
      charactersContainer.appendChild(master);
      charactersContainer.appendChild(aiRobot);
      
      // 仲間キャラクターコンテナを追加
      const alliesContainer = this.createAlliesContainer();
      charactersContainer.appendChild(alliesContainer);
      
      scene.appendChild(charactersContainer);
      
    }
    
    // 仲間キャラクターを更新
    this.updateAlliesDisplay(scene, dialogue);
    
    // 話者に応じてキャラクターを強調表示
    this.highlightSpeaker(scene, dialogue.speaker);
    
    console.log('[DEBUG] シーン設定完了:', dialogue.speaker);
  }

  highlightSpeaker(scene, speaker) {
    // キャラクターを取得
    const master = scene.querySelector('.story-master');
    const aiRobot = scene.querySelector('.story-ai-robot');
    
    // 全キャラクターをリセット（通常状態）
    if (master) {
      master.style.filter = 'brightness(0.7) saturate(0.5)';
      master.style.transform = 'scale(1)';
    }
    if (aiRobot) {
      aiRobot.style.filter = 'brightness(0.7) saturate(0.5)';
      if (window.innerWidth <= 480) {
        aiRobot.style.transform = 'scale(0.8) translateX(-25px)';
      } else {
        aiRobot.style.transform = 'scale(1)';
      }
    }
    
    // 話者を強調表示
    if ((speaker === 'ご主人様' || speaker.includes('主人')) && master) {
      master.style.filter = 'brightness(1) saturate(1)';
      master.style.transform = 'scale(1.1)';
    }
    
    if ((speaker === 'AI' || speaker === 'AI（心の声）') && aiRobot) {
      aiRobot.style.filter = 'brightness(1) saturate(1)';
      if (window.innerWidth <= 480) {
        aiRobot.style.transform = 'scale(0.88) translateX(-25px)';
      } else {
        aiRobot.style.transform = 'scale(1.1)';
      }
    }
    
    // ナレーションの場合は両方を通常表示
    if (speaker === 'ナレーション') {
      if (master) {
        master.style.filter = 'brightness(1) saturate(1)';
        master.style.transform = 'scale(1)';
      }
      if (aiRobot) {
        aiRobot.style.filter = 'brightness(1) saturate(1)';
        if (window.innerWidth <= 480) {
          aiRobot.style.transform = 'scale(0.8) translateX(-25px)';
        } else {
          aiRobot.style.transform = 'scale(1)';
        }
      }
    }
  }

  createAlliesContainer() {
    const alliesContainer = document.createElement('div');
    alliesContainer.className = 'story-allies-container';
    alliesContainer.style.cssText = `
      position: absolute;
      top: calc(50% + 150px);
      left: calc(80% + 30px);
      transform: translate(-50%, -50%);
      width: 300px;
      height: 200px;
      z-index: 15;
      pointer-events: none;
    `;
    return alliesContainer;
  }

  updateAlliesDisplay(scene, dialogue) {
    const alliesContainer = scene.querySelector('.story-allies-container');
    if (!alliesContainer) return;
    
    // 現在の仲間を取得
    const gameData = saveData.load();
    const partyMembers = gameData.partyMembers || [];
    
    // BOSS撃破数に応じて表示数を決定（10問ごとに1体ずつ増加、最大10体）
    const answeredQuestions = gameData.answers ? gameData.answers.length : 0;
    const bossesDefeated = Math.floor(answeredQuestions / 10);
    const maxDisplayCount = Math.min(bossesDefeated, 10);
    
    // character1.png から character10.png まで順番に表示するキャラクターを生成
    const displayCharacters = [];
    for (let i = 1; i <= maxDisplayCount; i++) {
      displayCharacters.push({
        id: i,
        name: `キャラクター${i}`,
        image: `./char/character${i}.png`,
        acquiredAt: i // 順番用
      });
    }
    
    // コンテナをクリア
    alliesContainer.innerHTML = '';
    
    // キャラクターがいる場合のみ表示
    if (displayCharacters.length > 0) {
      displayCharacters.forEach((character, index) => {
        // 最後に取得したキャラクター（配列の最後）を強調表示
        const isLatest = (index === displayCharacters.length - 1);
        const allyElement = this.createStoryAllyElement(character, isLatest, index);
        alliesContainer.appendChild(allyElement);
      });
    }
    
    // 話者によるフォーカス処理
    this.highlightRelevantAlly(alliesContainer, dialogue.speaker);
  }

  createStoryAllyElement(allyData, isLatest = false, index = 0) {
    const ally = document.createElement('div');
    ally.className = `story-ally ${isLatest ? 'latest' : ''}`;
    ally.dataset.allyName = allyData.name;
    
    // ロボット中心からの左右対称配置を計算
    // ロボットの想定横幅: 120px (画面の約12%)
    const robotWidth = 120;
    
    // キャラクター配置パターン（ロボット中心からの距離％）- 中心線寄りに調整
    const positions = [
      { x: -30, y: -15 },  // 1体目: 左上（30px中心寄り）
      { x: 30, y: -15 },   // 2体目: 右上（30px中心寄り）
      { x: -75, y: 15 },   // 3体目: 左下
      { x: 75, y: 15 },    // 4体目: 右下
      { x: -45, y: -70 },  // 5体目: 左上遠（30px上）
      { x: 45, y: -70 },   // 6体目: 右上遠（30px上）
      { x: -90, y: -38 },  // 7体目: 左中遠（30px上）
      { x: 90, y: -38 },   // 8体目: 右中遠（30px上）
      { x: -90, y: 70 },   // 9体目: 左下遠（40px下+30px遠く）
      { x: 90, y: 70 }     // 10体目: 右下遠
    ];
    
    const position = positions[index] || { x: 0, y: 0 };
    
    ally.style.cssText = `
      position: absolute;
      width: 80px;
      height: 80px;
      text-align: center;
      transition: all 0.3s ease;
      filter: ${isLatest ? 'brightness(1.2) saturate(1.2)' : 'brightness(0.8) saturate(0.7)'};
      animation: character-float 3s ease-in-out infinite;
      left: calc(50% + ${position.x}px);
      top: calc(50% + ${position.y}px);
      --character-scale: ${isLatest ? '1.1' : '0.9'};
      transform: translate(-50%, -50%) scale(var(--character-scale));
      transform-origin: center;
      z-index: ${isLatest ? '20' : '16'};
    `;
    
    ally.innerHTML = `
      <div style="
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
        display: flex;
        justify-content: center;
      ">
        <img src="${allyData.image || './char/character_blue1.png'}" alt="${allyData.name}" style="
          width: 64px;
          height: 64px;
          object-fit: contain;
          border-radius: 4px;
        " />
      </div>
    `;
    
    return ally;
  }

  highlightRelevantAlly(alliesContainer, speaker) {
    // 全ての仲間をリセット
    const allies = alliesContainer.querySelectorAll('.story-ally');
    allies.forEach(ally => {
      ally.style.filter = ally.classList.contains('latest') ? 
        'brightness(1.2) saturate(1.2)' : 'brightness(0.8) saturate(0.7)';
      ally.style.transform = ally.classList.contains('latest') ? 'scale(1.1)' : 'scale(0.9)';
    });
    
    // 話者に合致する仲間をハイライト
    const speakingAlly = alliesContainer.querySelector(`[data-ally-name="${speaker}"]`);
    if (speakingAlly) {
      speakingAlly.style.filter = 'brightness(1.5) saturate(1.5)';
      speakingAlly.style.transform = 'scale(1.3)';
      speakingAlly.style.animation = 'story-bounce 1s ease-in-out infinite';
    }
  }

  createMasterCharacter() {
    const master = document.createElement('div');
    master.className = 'story-master';
    master.style.transition = 'all 0.3s ease';
    master.innerHTML = `
      <div class="story-master-head">
        <div class="story-master-hair"></div>
        <div class="story-master-eyes">
          <div class="story-eye"></div>
          <div class="story-eye"></div>
        </div>
        <div class="story-master-mouth"></div>
      </div>
      <div class="story-master-body"></div>
    `;
    return master;
  }

  createAIRobotCharacter() {
    const aiRobot = document.createElement('div');
    aiRobot.className = 'story-ai-robot';
    aiRobot.style.transition = 'all 0.3s ease';
    
    // 強制的に位置を設定（30px左移動済み）
    if (window.innerWidth <= 480) {
      // モバイル版：translateX(-25px) で5px左移動
      aiRobot.style.position = 'relative';
      aiRobot.style.transform = 'scale(0.8) translateX(-25px)';
      aiRobot.style.margin = '0 auto';
    } else {
      // デスクトップ版：right: calc(20% + 75px) で5px左移動
      aiRobot.style.position = 'absolute';
      aiRobot.style.bottom = '-40px';
      aiRobot.style.right = 'calc(20% + 75px)';
    }
    
    aiRobot.innerHTML = `
      <img src="./char/robot.png" alt="AI Robot" style="
        width: 100%;
        height: 100%;
        object-fit: contain;
        display: block;
      " />
    `;
    return aiRobot;
  }


  // 旧い仲間キャラ作成関数は新しいシステムに置き換え済み

  nextDialogue() {
    if (!this.isPlaying) return;
    const chapter = storyData.chapters[this.currentChapter];
    const nextIndex = this.currentDialogue + 1;
    if (nextIndex >= chapter.dialogues.length) {
      this.completeStory();
    } else {
      this.currentDialogue = nextIndex;
      this.showDialogue();
    }
  }

  completeStory() {
    if (!this.isPlaying) return;
    console.log('[DEBUG] ストーリー完了処理開始');
    this.isPlaying = false;

    window.removeEventListener('keydown', this._keyHandler);

    // フェードアウト → 非表示 → コールバック
    this.overlay.style.transition = 'opacity .25s ease';
    this.overlay.style.opacity = '1';
    requestAnimationFrame(() => {
      this.overlay.style.opacity = '0';
      setTimeout(() => {
        this.overlay.classList.remove('active');
        this.overlay.style.pointerEvents = 'none';
        this.overlay.style.opacity = '0';
        this.overlay.style.transition = '';
        console.log('[DEBUG] ストーリー完了、コールバック実行');
        if (typeof this.onStoryComplete === 'function') {
          const cb = this.onStoryComplete;
          this.onStoryComplete = null;
          cb(); // ここで性格診断など次の処理へ
        }
      }, 250);
    });
  }

  /* ============= ★ 章トランジション（app.js から呼ばれる） ============= */
  // app.js: storyManager.playChapterTransition(chapterNumber, cardData, callback)
  playChapterTransition(chapterNumber, cardData, callback) {
    // chapterNumberに対応するストーリーを再生
    if (storyData?.chapters?.[chapterNumber]) {
      this.playStory(chapterNumber, callback);
      return;
    }
    
    // ストーリーデータがない場合はトランジション演出のみ
    const text = `Stage ${chapterNumber}`;
    
    // カード獲得演出も含める
    this.showCardAcquisition(cardData, () => {
      this.showStageTransition(text, callback);
    });
  }
  
  showCardAcquisition(cardData, callback) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: absolute; inset: 0; z-index: 10020;
      display: flex; align-items: center; justify-content: center;
      background: rgba(0,0,0,0.8); opacity: 0; transition: opacity 0.3s ease;
    `;
    
    overlay.innerHTML = `
      <div style="background: white; padding: 30px; border-radius: 20px; text-align: center; max-width: 300px;">
        <div style="font-size: 60px; margin-bottom: 15px;">${cardData.icon}</div>
        <h3 style="margin: 10px 0; color: #333;">${cardData.name}</h3>
        <p style="color: #666; margin-bottom: 20px;">${cardData.description}</p>
        <button style="padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 10px; cursor: pointer;">
          続ける
        </button>
      </div>
    `;
    
    document.body.appendChild(overlay);
    
    // 表示
    requestAnimationFrame(() => {
      overlay.style.opacity = '1';
    });
    
    // ボタンクリックまたは3秒後に自動進行
    const button = overlay.querySelector('button');
    const autoClose = setTimeout(() => {
      this.closeOverlay(overlay, callback);
    }, 3000);
    
    button.addEventListener('click', () => {
      clearTimeout(autoClose);
      this.closeOverlay(overlay, callback);
    });
  }
  
  showStageTransition(text, callback) {
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.zIndex = '10020';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.background = 'rgba(0,0,0,.72)';
    overlay.style.backdropFilter = 'blur(4px)';
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity .25s ease';

    const pill = document.createElement('div');
    pill.textContent = text;
    pill.style.padding = '14px 28px';
    pill.style.borderRadius = '999px';
    pill.style.background = 'linear-gradient(135deg,#667eea,#764ba2)';
    pill.style.color = '#fff';
    pill.style.fontSize = '22px';
    pill.style.fontWeight = '800';
    pill.style.boxShadow = '0 10px 30px rgba(0,0,0,.35)';
    pill.style.letterSpacing = '.5px';

    overlay.appendChild(pill);
    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
      overlay.style.opacity = '1';
      setTimeout(() => {
        this.closeOverlay(overlay, callback);
      }, 800);
    });
  }
  
  closeOverlay(overlay, callback) {
    overlay.style.opacity = '0';
    setTimeout(() => {
      overlay.remove();
      if (typeof callback === 'function') callback();
    }, 250);
  }
}

/* ========= エクスポート ========= */
export const storyManager = new StoryManager();

// 使いやすいエイリアス
export function playStory(chapterIndex, callback) {
  storyManager.playStory(chapterIndex, callback);
}
export function playIntro(callback) {
  storyManager.playStory(0, callback);
}
export function playChapterTransition(labelOrNumber, callback) {
  storyManager.playChapterTransition(labelOrNumber, callback);
}
