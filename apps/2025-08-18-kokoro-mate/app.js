// ES Modules で辞書データを読み込み
import { questions } from './data/questions.js';
import { enemies, characters, stageNames } from './data/entities.js';
import { storyManager } from './game/story.js';

// ------------------------------
// ゲーム状態管理
// ------------------------------
const gameState = {
    currentQuestion: 1,
    totalQuestions: 100,
    currentStage: 1,
    hp: 100,
    maxHp: 100,
    fp: 50,
    maxFp: 50,
    coins: 0,
    totalPower: 0,
    answers: [],
    partyMembers: [],
    currentEnemy: null,
    timeRemaining: 0,
    timerInterval: null,
    // 操作制御フラグ
    isProcessing: false,
    isStoryPlaying: false,
    buttonsDisabled: false,
    // 性格スコア
    personalityScores: {
        // MBTI
        E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0,
        // Big Five
        openness: 0,
        conscientiousness: 0,
        extraversion: 0,
        agreeableness: 0,
        neuroticism: 0,
        // 働き方スタイル
        leadership: 0,
        teamwork: 0,
        creativity: 0,
        analytical: 0,
        adaptability: 0
    }
};

// ------------------------------
// ボタン制御関数
// ------------------------------
function disableAnswerButtons() {
    gameState.buttonsDisabled = true;
    for (let i = 1; i <= 5; i++) {
        const btn = document.getElementById(`btn-${i}`);
        if (btn) {
            btn.disabled = true;
            btn.style.opacity = '0.3';
            btn.style.cursor = 'not-allowed';
            btn.style.pointerEvents = 'none';
            btn.classList.add('disabled');
        }
    }
    
    // 診断ボタンエリアのみをブロックするオーバーレイ
    let overlay = document.getElementById('button-block-overlay');
    if (!overlay) {
        const answerScale = document.querySelector('.answer-scale');
        if (answerScale) {
            overlay = document.createElement('div');
            overlay.id = 'button-block-overlay';
            overlay.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 100;
                pointer-events: auto;
                background: transparent;
            `;
            answerScale.style.position = 'relative';
            answerScale.appendChild(overlay);
        }
    }
    
    console.log('[DEBUG] 回答ボタンを完全無効化（オーバーレイ付き）');
}

function enableAnswerButtons() {
    gameState.buttonsDisabled = false;
    for (let i = 1; i <= 5; i++) {
        const btn = document.getElementById(`btn-${i}`);
        if (btn) {
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
            btn.style.pointerEvents = 'auto';
            btn.classList.remove('disabled');
        }
    }
    
    // オーバーレイを削除
    const overlay = document.getElementById('button-block-overlay');
    if (overlay) {
        overlay.remove();
    }
    
    console.log('[DEBUG] 回答ボタンを有効化（オーバーレイ削除）');
}

function setStoryMode(isPlaying) {
    gameState.isStoryPlaying = isPlaying;
    if (isPlaying) {
        disableAnswerButtons();
        console.log('[DEBUG] ストーリーモード開始');
    } else {
        enableAnswerButtons();
        console.log('[DEBUG] ストーリーモード終了');
    }
}

// ------------------------------
// 初期化
// ------------------------------
// 2. initGame関数を修正
function initGame() {
    // ストーリーモード：第0章を再生してから開始
    setStoryMode(true);
    storyManager.playStory(0, () => {
        // ストーリー終了後にゲーム開始
        setStoryMode(false);
        bindEvents();
        createParticles();
        loadQuestion();
        updateAllUI();
    });
}




// ------------------------------
// イベントバインディング
// ------------------------------
function bindEvents() {
    // 5段階ボタン（連打防止付き）
    for (let i = 1; i <= 5; i++) {
        const btn = document.getElementById(`btn-${i}`);
        btn.addEventListener('click', (e) => {
            // イベントレベルでも連打防止
            if (gameState.isProcessing || gameState.isStoryPlaying || gameState.buttonsDisabled) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
            answer(i);
        });
    }
    
    // モーダルボタン
    document.getElementById('continue-btn').addEventListener('click', closeCharacterModal);
    document.getElementById('restart-btn').addEventListener('click', restartGame);
    
    // キーボードショートカット（連打防止対応）
    document.addEventListener('keydown', (e) => {
        if (e.key >= '1' && e.key <= '5') {
            // 同じ防止ロジックを適用
            if (!gameState.isProcessing && !gameState.isStoryPlaying && !gameState.buttonsDisabled) {
                answer(parseInt(e.key));
            }
        }
    });
}

// ------------------------------
// パーティクルエフェクト
// ------------------------------
function createParticles() {
    const container = document.getElementById('particles');
    for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 3 + 's';
        particle.style.animationDuration = (3 + Math.random() * 2) + 's';
        container.appendChild(particle);
    }
}

// ------------------------------
// 質問読み込み
// ------------------------------
function loadQuestion() {
    const q = questions[gameState.currentQuestion - 1];
    const enemy = enemies[gameState.currentQuestion - 1];
    
    // 質問表示
    document.getElementById('q-number').textContent = gameState.currentQuestion;
    document.getElementById('question').textContent = q.text;
    document.getElementById('question-category').textContent = q.category || '性格診断';
    
    // 敵の設定（現在のHPも初期化）
    gameState.currentEnemy = { 
        ...enemy,
        currentHp: enemy.hp // 現在のHPを追加
    };
    document.getElementById('enemy-sprite').textContent = enemy.emoji;
    document.getElementById('enemy-name').textContent = enemy.name;
    document.getElementById('enemy-level').textContent = gameState.currentQuestion;
    document.getElementById('enemy-hp').style.width = '100%';
    document.getElementById('enemy-hp-current').textContent = enemy.hp;
    document.getElementById('enemy-hp-max').textContent = enemy.hp;
    
    // ボス戦演出
    const isBoss = gameState.currentQuestion % 10 === 0;
    const enemySprite = document.getElementById('enemy-sprite');
    if (isBoss) {
        enemySprite.style.fontSize = '120px';
        document.getElementById('action-command').textContent = '⚡ ボスバトル！慎重に選ぼう！';
    } else {
        enemySprite.style.fontSize = '100px';
        document.getElementById('action-command').textContent = '⚡ 直感で選択しよう！';
    }
    
    // タイマー開始
    startTimer();
    
    // 敵とUIの表示が完了してからボタンを有効化（遅延実行）
    setTimeout(() => {
        if (!gameState.isStoryPlaying && !gameState.isProcessing) {
            enableAnswerButtons();
            console.log('[DEBUG] 敵表示完了、ボタンを有効化');
        }
    }, 300); // 0.3秒の遅延で確実に表示完了を待つ
}

// ------------------------------
// タイマー管理（制限解除版）
// ------------------------------
function startTimer() {
    // タイマー制限を完全解除
    const timeBar = document.getElementById('time-remaining');
    if (timeBar) {
        timeBar.style.width = '100%';
        timeBar.style.display = 'none'; // タイマーバーを非表示
    }
    
    // タイマーintervalをクリア（制限なし）
    clearInterval(gameState.timerInterval);
    gameState.timerInterval = null;
    
    // 時間制限を無効化
    gameState.timeRemaining = 0;
    
    console.log('[DEBUG] タイマー制限を完全解除');
}

// ------------------------------
// 回答処理
// ------------------------------
function answer(value) {
    // 連打防止とストーリー中の操作防止（複数回チェック）
    if (gameState.isProcessing || gameState.isStoryPlaying || gameState.buttonsDisabled) {
        console.log('[DEBUG] 回答処理をスキップ - 処理中またはストーリー再生中');
        return;
    }
    
    // 即座に処理開始フラグを設定（連打完全防止）
    gameState.isProcessing = true;
    gameState.buttonsDisabled = true;
    
    // 再度チェック（レースコンディション対策）
    if (gameState.isStoryPlaying) {
        console.log('[DEBUG] ストーリー再生中のため回答処理を中止');
        gameState.isProcessing = false;
        gameState.buttonsDisabled = false;
        return;
    }
    
    // 即座にボタンを無効化
    disableAnswerButtons();
    
    console.log(`[DEBUG] 回答処理開始: 値=${value}, 質問=${gameState.currentQuestion}`);
    
    clearInterval(gameState.timerInterval);
    
    const questionIndex = gameState.currentQuestion - 1;
    const question = questions[questionIndex];
    
    // 回答を記録
    gameState.answers.push({
        questionId: questionIndex,
        value: value,
        type: question.type,
        traits: question.traits || []
    });
    
    // スコア更新
    updatePersonalityScores(question, value);
    
    
    // 戦闘処理
    performBattle(value);
}

// ------------------------------
// 性格スコア更新
// ------------------------------
function updatePersonalityScores(question, value) {
    // MBTI処理
    if (question.type) {
        const types = question.type.split('/');
        const score = (value - 3) * 2; // -4 to +4の範囲に変換
        
        if (score > 0) {
            gameState.personalityScores[types[0]] += Math.abs(score);
        } else if (score < 0) {
            gameState.personalityScores[types[1]] += Math.abs(score);
        }
    }
    
    // その他の特性処理
    if (question.traits) {
        question.traits.forEach(trait => {
            const traitScore = (value - 3) * trait.weight;
            gameState.personalityScores[trait.name] += traitScore;
        });
    }
}

// ------------------------------
// 戦闘処理
// ------------------------------
function performBattle(value) {
    // ダメージ計算（十分に敵を倒せるよう調整）
    const baseDamage = 250 * value; // 250-1250（最大HP1000の敵も一撃で倒せる）
    const totalDamage = baseDamage;
    
    // アニメーション
    attackAnimation();
    showDamage(totalDamage);
    
    // 敵HP減少（実際のダメージ計算）
    setTimeout(() => {
        const enemy = gameState.currentEnemy;
        enemy.currentHp = Math.max(0, enemy.currentHp - totalDamage);
        
        // HPバーとテキストを更新
        const hpPercentage = (enemy.currentHp / enemy.hp) * 100;
        document.getElementById('enemy-hp').style.width = hpPercentage + '%';
        document.getElementById('enemy-hp-current').textContent = enemy.currentHp;
        
        console.log(`[DEBUG] ダメージ: ${totalDamage}, 敵HP: ${enemy.currentHp}/${enemy.hp}`);
        
        // 敵が倒されたかチェック
        if (enemy.currentHp <= 0) {
            console.log('[DEBUG] 敵を倒しました！');
            
            // 報酬
            const isBoss = gameState.currentQuestion % 10 === 0;
            const baseCoins = isBoss ? 50 : 10;
            const bonus = 0;
            gameState.coins += baseCoins + bonus;
            
            // HP/FP回復
            if (value >= 4) {
                gameState.hp = Math.min(gameState.maxHp, gameState.hp + 5);
                gameState.fp = Math.min(gameState.maxFp, gameState.fp + 3);
            }
        } else {
            console.log('[DEBUG] 敵はまだ生きています。続行...');
            
            // 敵が生きている場合でも少しの報酬とHP回復
            const minCoins = 2;
            gameState.coins += minCoins;
            
            if (value >= 3) {
                gameState.hp = Math.min(gameState.maxHp, gameState.hp + 1);
                gameState.fp = Math.min(gameState.maxFp, gameState.fp + 1);
            }
        }
        
        updateAllUI();
        
        // 次の処理（敵が倒された場合のみ進行）
        if (enemy.currentHp <= 0) {
            console.log(`[DEBUG] 現在の質問: ${gameState.currentQuestion}, 10で割った余り: ${gameState.currentQuestion % 10}`);
            
            if (gameState.currentQuestion % 10 === 0) {
                // キャラクター獲得
                console.log(`[DEBUG] キャラクター獲得条件満了: ${gameState.currentQuestion}問目`);
                setTimeout(() => {
                    acquireCharacter();
                }, 1000);
            } else if (gameState.currentQuestion === gameState.totalQuestions) {
                // ゲーム完了
                console.log('[DEBUG] ゲーム完了');
                setTimeout(() => {
                    showResults();
                }, 1000);
            } else {
                // 次の質問
                console.log('[DEBUG] 次の質問へ');
                setTimeout(() => {
                    gameState.currentQuestion++;
                    updateProgress();
                    // 処理完了フラグをリセット
                    gameState.isProcessing = false;
                    // loadQuestion()内で適切なタイミングでボタンが有効化される
                    loadQuestion();
                }, 1500);
            }
        } else {
            // 敵がまだ生きている場合は同じ質問を継続
            console.log('[DEBUG] 敵が生きているため同じ質問を継続');
            setTimeout(() => {
                // 処理完了フラグをリセット
                gameState.isProcessing = false;
                // ボタンを再度有効化（同じ質問を継続）
                enableAnswerButtons();
            }, 1000);
        }
    }, 500);
}

// ------------------------------
// 攻撃アニメーション
// ------------------------------
function attackAnimation() {
    const enemy = document.getElementById('enemy-sprite');
    enemy.classList.add('damage');
    setTimeout(() => enemy.classList.remove('damage'), 500);
}

// ------------------------------
// ダメージ表示
// ------------------------------
function showDamage(damage) {
    const damageText = document.createElement('div');
    damageText.className = 'damage-text';
    damageText.textContent = damage;
    damageText.style.left = '50%';
    damageText.style.top = '40%';
    document.querySelector('.battle-area').appendChild(damageText);
    setTimeout(() => damageText.remove(), 1000);
}


// ------------------------------
// キャラクター獲得
// ------------------------------
// 3. acquireCharacter関数を修正（10問ごとのキャラクター獲得時）
function acquireCharacter() {
    console.log(`[DEBUG] acquireCharacter() 開始: 質問${gameState.currentQuestion}問目`);
    const stageIndex = Math.floor((gameState.currentQuestion - 1) / 10);
    console.log(`[DEBUG] ステージインデックス: ${stageIndex}`);
    const characterPool = getCharacterPool(stageIndex);
    console.log(`[DEBUG] キャラクタープール:`, characterPool);
    const character = selectCharacterBasedOnPersonality(characterPool);
    console.log(`[DEBUG] 選択されたキャラクター:`, character);
    
    // ステージに応じた画像を設定（character1.png から character10.png）
    const characterNumber = stageIndex + 1;
    character.image = `./char/character${characterNumber}.png`;
    
    // 仲間に追加
    gameState.partyMembers.push(character);
    gameState.totalPower += character.power;
    
    // カードデータ作成（ストーリー用）
    const cardData = {
        name: `${character.name}の力`,
        icon: character.emoji,
        description: character.description,
        evidence: [`Q${gameState.currentQuestion-9}:5`, `Q${gameState.currentQuestion-5}:4`, `Q${gameState.currentQuestion}:5`]
    };
    
    // モーダル表示
    displayCharacterModal(character);
    
    // 仲間リスト更新
    updatePartyList();
}

// ------------------------------
// キャラクタープール取得
// ------------------------------
function getCharacterPool(stageIndex) {
    // ステージに応じたキャラクターを返す
    return characters.filter(c => c.stage === stageIndex + 1);
}

// ------------------------------
// 性格に基づくキャラクター選択
// ------------------------------
function selectCharacterBasedOnPersonality(pool) {
    // 現在の性格スコアに最も合うキャラクターを選択
    let bestMatch = pool[0];
    let bestScore = 0;
    
    pool.forEach(character => {
        let score = 0;
        character.affinities.forEach(affinity => {
            score += gameState.personalityScores[affinity] || 0;
        });
        
        if (score > bestScore) {
            bestScore = score;
            bestMatch = character;
        }
    });
    
    return bestMatch;
}

// ------------------------------
// キャラクターモーダル表示
// ------------------------------
function displayCharacterModal(character) {
    document.getElementById('character-rarity').textContent = '★'.repeat(character.rarity);
    document.getElementById('character-emoji').textContent = character.emoji;
    document.getElementById('character-name').textContent = character.name;
    document.getElementById('character-title').textContent = character.title;
    document.getElementById('character-attack').textContent = character.attack;
    document.getElementById('character-defense').textContent = character.defense;
    document.getElementById('character-skill').textContent = character.skill;
    document.getElementById('character-description').textContent = character.description;
    
    // モーダル表示時にオーバーレイを一時的に削除
    const overlay = document.getElementById('button-block-overlay');
    if (overlay) {
        overlay.style.pointerEvents = 'none';
        console.log('[DEBUG] キャラクターモーダル表示時にオーバーレイを無効化');
    }
    
    document.getElementById('character-modal').classList.add('show');
}

// ------------------------------
// キャラクターモーダルを閉じる
// ------------------------------
// 4. closeCharacterModal関数を修正
function closeCharacterModal() {
    console.log('[DEBUG] closeCharacterModal() 開始');
    document.getElementById('character-modal').classList.remove('show');
    
    // モーダル閉じる時にオーバーレイを復元（処理中の場合のみ）
    if (gameState.isProcessing || gameState.buttonsDisabled) {
        const overlay = document.getElementById('button-block-overlay');
        if (overlay) {
            overlay.style.pointerEvents = 'auto';
            console.log('[DEBUG] キャラクターモーダル閉じる時にオーバーレイを復元');
        }
    }
    
    // チャプター番号を計算（10問ごとに1章進む）
    const chapterNumber = Math.floor(gameState.currentQuestion / 10);
    console.log(`[DEBUG] チャプター番号: ${chapterNumber}, 現在の質問: ${gameState.currentQuestion}`);
    
    // ストーリーがある場合は再生
    if (chapterNumber <= 10) {  // 最大10章まで
        console.log('[DEBUG] ストーリー再生条件を満たしています');
        // カードデータを作成
        const lastCharacter = gameState.partyMembers[gameState.partyMembers.length - 1];
        const cardData = {
            name: `${lastCharacter.name}の力`,
            icon: lastCharacter.emoji,
            description: lastCharacter.description,
            evidence: [`Q${gameState.currentQuestion-9}:5`, `Q${gameState.currentQuestion-5}:4`, `Q${gameState.currentQuestion}:5`]
        };
        
        // ストーリー再生（カード獲得演出付き）
        console.log('[DEBUG] storyManager.playChapterTransition() 呼び出し中...');
        setStoryMode(true);
        storyManager.playChapterTransition(chapterNumber, cardData, () => {
            console.log('[DEBUG] ストーリー完了、次の処理に進む');
            setStoryMode(false);
            if (gameState.currentQuestion < gameState.totalQuestions) {
                gameState.currentQuestion++;
                updateProgress();
                // 処理完了フラグをリセット
                gameState.isProcessing = false;
                // loadQuestion()内で適切なタイミングでボタンが有効化される
                loadQuestion();
            } else {
                showResults();
            }
        });
    } else {
        // ストーリーがない場合は通常処理
        if (gameState.currentQuestion < gameState.totalQuestions) {
            gameState.currentQuestion++;
            updateProgress();
            // 処理完了フラグをリセット
            gameState.isProcessing = false;
            // loadQuestion()内で適切なタイミングでボタンが有効化される
            loadQuestion();
        } else {
            showResults();
        }
    }
}


// ------------------------------
// 仲間リスト更新
// ------------------------------
function updatePartyList() {
    const partyList = document.getElementById('party-list');
    partyList.innerHTML = '';
    
    gameState.partyMembers.forEach(member => {
        const card = document.createElement('div');
        card.className = `party-member ${getRarityClass(member.rarity)}`;
        card.innerHTML = `
            <div class="power">${member.power}</div>
            <div class="emoji">${member.emoji}</div>
            <div class="name">${member.name}</div>
            <div class="level">Lv.${member.level}</div>
        `;
        partyList.appendChild(card);
    });
    
    document.getElementById('total-power').textContent = gameState.totalPower;
}

// ------------------------------
// レアリティクラス取得
// ------------------------------
function getRarityClass(rarity) {
    const classes = ['', '', 'rare', 'epic', 'legendary'];
    return classes[rarity - 1] || '';
}

// ------------------------------
// プログレス更新
// ------------------------------
function updateProgress() {
    const progress = (gameState.currentQuestion / gameState.totalQuestions) * 100;
    document.getElementById('progress').style.width = progress + '%';
    document.getElementById('progress-text').textContent = 
        `${gameState.currentQuestion}/${gameState.totalQuestions}`;
    
    // マイルストーン更新
    const milestones = document.querySelectorAll('.milestone');
    milestones.forEach((milestone, index) => {
        if ((index + 1) * 10 <= gameState.currentQuestion) {
            milestone.classList.add('completed');
        }
    });
    
    // ステージ更新
    const stageIndex = Math.floor((gameState.currentQuestion - 1) / 10);
    document.getElementById('stage-name').textContent = stageNames[stageIndex];
}

// ------------------------------
// 全UI更新
// ------------------------------
function updateAllUI() {
    document.getElementById('hp-value').textContent = `${gameState.hp}/${gameState.maxHp}`;
    document.getElementById('fp-value').textContent = `${gameState.fp}/${gameState.maxFp}`;
    document.getElementById('coins-value').textContent = gameState.coins;
    updateProgress();
}

// ------------------------------
// 最終結果表示
// ------------------------------
function showResults() {
    // 既存の結果表示処理...
    
    // MBTI判定
    const mbtiType = calculateMBTI();
    const mbtiInfo = getMBTIInfo(mbtiType);
    
    // 結果表示
    document.getElementById('mbti-type').textContent = mbtiType;
    document.getElementById('mbti-name').textContent = mbtiInfo.name;
    
    // 特性スコア表示
    displayTraitScores();
    
    // 最終統計
    document.getElementById('final-coins').textContent = gameState.coins;
    document.getElementById('final-party').textContent = gameState.partyMembers.length;
    document.getElementById('final-power').textContent = gameState.totalPower;
    
    // エンディングストーリーを再生してから結果モーダル表示
    if (gameState.currentQuestion === 100) {
        storyManager.playStory(10, () => {
            document.getElementById('result-modal').classList.add('show');
        });
    } else {
        document.getElementById('result-modal').classList.add('show');
    }
}
// ------------------------------
// MBTI計算
// ------------------------------
function calculateMBTI() {
    const scores = gameState.personalityScores;
    let type = '';
    
    type += scores.E > scores.I ? 'E' : 'I';
    type += scores.S > scores.N ? 'S' : 'N';
    type += scores.T > scores.F ? 'T' : 'F';
    type += scores.J > scores.P ? 'J' : 'P';
    
    return type;
}

// ------------------------------
// MBTI情報取得
// ------------------------------
function getMBTIInfo(type) {
    const mbtiTypes = {
        'INTJ': { name: '建築家' },
        'INTP': { name: '論理学者' },
        'ENTJ': { name: '指揮官' },
        'ENTP': { name: '討論者' },
        'INFJ': { name: '提唱者' },
        'INFP': { name: '仲介者' },
        'ENFJ': { name: '主人公' },
        'ENFP': { name: '運動家' },
        'ISTJ': { name: '管理者' },
        'ISFJ': { name: '擁護者' },
        'ESTJ': { name: '幹部' },
        'ESFJ': { name: '領事' },
        'ISTP': { name: '巨匠' },
        'ISFP': { name: '冒険家' },
        'ESTP': { name: '起業家' },
        'ESFP': { name: 'エンターテイナー' }
    };
    
    return mbtiTypes[type] || { name: '探求者' };
}

// ------------------------------
// 特性スコア表示
// ------------------------------
function displayTraitScores() {
    const traitList = document.getElementById('trait-list');
    const traits = [
        { name: '外向性', score: gameState.personalityScores.extraversion },
        { name: '開放性', score: gameState.personalityScores.openness },
        { name: '協調性', score: gameState.personalityScores.agreeableness },
        { name: '誠実性', score: gameState.personalityScores.conscientiousness },
        { name: 'リーダーシップ', score: gameState.personalityScores.leadership },
        { name: '創造性', score: gameState.personalityScores.creativity }
    ];
    
    traitList.innerHTML = '';
    traits.forEach(trait => {
        const item = document.createElement('div');
        item.className = 'trait-item';
        item.innerHTML = `
            <span class="trait-name">${trait.name}</span>
            <span class="trait-score">${Math.round(trait.score)}</span>
        `;
        traitList.appendChild(item);
    });
}

// ------------------------------
// ゲームリスタート
// ------------------------------
function restartGame() {
    location.reload();
}

// ------------------------------
// ゲーム開始
// ------------------------------
document.addEventListener('DOMContentLoaded', initGame);