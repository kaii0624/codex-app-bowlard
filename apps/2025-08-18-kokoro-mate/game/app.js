// game/app.js - ゲームメインロジック

// ES Modules でデータを読み込み
import { questions } from '../data/questions.js';
import { enemies, characters, stageNames } from '../data/entities.js';
import { storyManager } from './story.js';
import { saveData } from '../data/save-data.js';
import { promptsManager } from '../prompts/prompts.js';

// ------------------------------
// ゲーム状態管理
// ------------------------------
const gameState = {
    currentQuestion: 1,
    totalQuestions: 100,
    currentStage: 1,
    answers: [],
    partyMembers: [],
    currentEnemy: null,
    timeRemaining: 0,
    timerInterval: null,
    // 操作制御フラグ
    isProcessing: false,
    isStoryPlaying: false,
    buttonsDisabled: false,
    // プロンプト状態
    currentStepPrompt: null,
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
        const answerScale = document.querySelector('.seg-wrap');
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
    
    console.log('[DEBUG] 診断ボタンを完全無効化（オーバーレイ付き）');
}

function enableAnswerButtons() {
    console.log('[DEBUG] ボタン有効化処理開始');
    
    gameState.buttonsDisabled = false;
    gameState.isProcessing = false; // 確実にフラグをリセット

    // セグメントボタンの選択状態をリセット
    document.querySelectorAll('.seg.on').forEach(s => s.classList.remove('on'));

    for (let i = 1; i <= 5; i++) {
        const btn = document.getElementById(`btn-${i}`);
        if (btn) {
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
            btn.style.pointerEvents = 'auto';
            btn.classList.remove('disabled');
            console.log(`[DEBUG] ボタン${i}を有効化`);
        } else {
            console.warn(`[DEBUG] ボタン${i}が見つからない`);
        }
    }
    
    // オーバーレイを削除
    const overlay = document.getElementById('button-block-overlay');
    if (overlay) {
        overlay.remove();
        console.log('[DEBUG] オーバーレイを削除');
    }
    
    console.log('[DEBUG] 診断ボタンを有効化完了');
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
export function initGame() {
    try {
        // 新規開始：第0章ストーリーから
        // セーブデータがある場合はresumeGame()を使用
        const savedData = saveData.load();
        
        if (savedData && savedData.answeredQuestions > 0) {
            console.warn('[DEBUG] セーブデータあり。resumeGame()を使用してください。');
            resumeGame();
            return;
        }
        
        // 新規ゲーム初期化
        gameState.currentQuestion = 1;
        gameState.answers = [];
        gameState.partyMembers = [];
        gameState.personalityScores = {
            E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0,
            openness: 0, conscientiousness: 0, extraversion: 0, agreeableness: 0, neuroticism: 0,
            leadership: 0, teamwork: 0, creativity: 0, analytical: 0, adaptability: 0
        };
        
        storyManager.playStory(0, () => {
            bindEvents();
            createParticles();
            loadQuestion();
            updateAllUI();
        });
    } catch (error) {
        console.error('ゲーム初期化エラー:', error);
        // フォールバック: 基本的な初期化のみ実行
        try {
            bindEvents();
            createParticles();
            loadQuestion();
            updateAllUI();
        } catch (fallbackError) {
            console.error('フォールバック初期化も失敗:', fallbackError);
        }
    }
}

// ------------------------------
// ゲーム再開
// ------------------------------
export function resumeGame() {
    try {
        const savedData = saveData.load();
        
        if (!savedData || savedData.answeredQuestions === 0) {
            console.log('[DEBUG] セーブデータなし。新規ゲームを開始します。');
            initGame();
            return;
        }
        
        // 保存データから状態復元
        gameState.totalQuestions = savedData.totalQuestions || 100;
        gameState.answers = savedData.answers || [];
        gameState.partyMembers = savedData.partyMembers || [];
        gameState.personalityScores = savedData.personalityScores || gameState.personalityScores;
        
        // 次に回答すべき質問番号を設定
        gameState.currentQuestion = savedData.answeredQuestions + 1;
        
        console.log(`[DEBUG] ゲーム再開: answeredQuestions=${savedData.answeredQuestions}, currentQuestion=${gameState.currentQuestion}`);
        
        // 全ての質問に回答済みの場合は結果画面へ
        if (gameState.currentQuestion > gameState.totalQuestions) {
            window.homeManager.showResults();
            return;
        }
        
        // UIを更新してゲーム再開
        bindEvents();
        createParticles();
        loadQuestion();
        updateAllUI();
        
    } catch (error) {
        console.error('ゲーム再開エラー:', error);
        initGame();
    }
}

// ------------------------------
// 進行状況保存
// ------------------------------
export function saveProgress() {
    try {
        const currentData = {
            answeredQuestions: gameState.answers.length,
            totalQuestions: gameState.totalQuestions,
            answers: gameState.answers,
            partyMembers: gameState.partyMembers,
            personalityScores: gameState.personalityScores
        };
        
        saveData.save(currentData);
        console.log(`[DEBUG] 進行状況保存: answeredQuestions=${currentData.answeredQuestions}`);
        
    } catch (error) {
        console.error('進行状況保存エラー:', error);
    }
}

// ------------------------------
// イベントバインディング
// ------------------------------
function bindEvents() {
    // 5段階ボタン（連打防止とタッチ最適化）
    for (let i = 1; i <= 5; i++) {
        const btn = document.getElementById(`btn-${i}`);
        if (btn) {
            // タッチデバイスの検出
            const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            
            if (isTouchDevice) {
                // タッチイベントの最適化
                let touchStarted = false;
                
                // タッチスタート
                btn.addEventListener('touchstart', (e) => {
                    // cancelableをチェックしてからpreventDefaultを呼ぶ
                    if (e.cancelable) {
                        e.preventDefault();
                    }
                    
                    if (gameState.isProcessing || gameState.isStoryPlaying || gameState.buttonsDisabled) {
                        return false;
                    }
                    
                    touchStarted = true;
                    btn.classList.add('active');
                }, { passive: false });
                
                // タッチエンド
                btn.addEventListener('touchend', (e) => {
                    if (e.cancelable) {
                        e.preventDefault();
                    }
                    
                    btn.classList.remove('active');
                    
                    if (touchStarted && !gameState.isProcessing && !gameState.isStoryPlaying && !gameState.buttonsDisabled) {
                        // 選択状態を視覚的に表示
                        document.querySelectorAll('.seg.on').forEach(s => s.classList.remove('on'));
                        btn.classList.add('on');
                        // 少し遅延を入れて視覚的フィードバックを確保
                        setTimeout(() => answer(i), 50);
                    }
                    touchStarted = false;
                }, { passive: false });
                
                // タッチキャンセル
                btn.addEventListener('touchcancel', () => {
                    touchStarted = false;
                    btn.classList.remove('active');
                });
                
                // タッチムーブ（スクロール検出）
                btn.addEventListener('touchmove', (e) => {
                    // スクロールが発生したらタッチをキャンセル
                    touchStarted = false;
                    btn.classList.remove('active');
                }, { passive: true });
            }
            
            // クリックイベント（デスクトップとタッチデバイスの両方で使用）
            btn.addEventListener('click', (e) => {
                // タッチデバイスでは touchend で処理するため、click は無視
                if (isTouchDevice && e.detail === 0) {
                    return;
                }
                
                if (gameState.isProcessing || gameState.isStoryPlaying || gameState.buttonsDisabled) {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                }
                
                // デスクトップの場合のみクリックで回答
                if (!isTouchDevice) {
                    document.querySelectorAll('.seg.on').forEach(s => s.classList.remove('on'));
                    btn.classList.add('on');
                    answer(i);
                }
            });
        }
    }
    
    // モーダルボタン
    document.getElementById('continue-btn')?.addEventListener('click', closeCharacterModal);
    document.getElementById('restart-btn')?.addEventListener('click', restartGame);
    
    // ホームに戻るボタン
    document.getElementById('return-home')?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('進捗を保存してホームに戻りますか？')) {
            saveProgress();
            window.homeManager?.returnToHome();
        }
    });
    
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
    if (!container) return;
    
    // 既存のパーティクルをクリア
    container.innerHTML = '';
    
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
    if (gameState.currentQuestion > gameState.totalQuestions) {
        showResults();
        return;
    }
    
    const q = questions[gameState.currentQuestion - 1];
    const enemy = enemies[gameState.currentQuestion - 1];

    // ステージテーマ・キャラクターを更新
    updateStage();

    if (!q || !enemy) {
        console.error('質問またはエネミーデータが見つかりません');
        return;
    }
    
    // 覚醒度更新
    updateAwakening();

    // 質問表示
    const qNumberEl = document.getElementById('q-number');
    const questionEl = document.getElementById('question');
    const questionCategoryEl = document.getElementById('question-category');
    
    if (qNumberEl) qNumberEl.textContent = gameState.currentQuestion;
    if (questionEl) questionEl.textContent = q.text;
    if (questionCategoryEl) questionCategoryEl.textContent = q.category || '性格診断';
    
    // 敵の設定
    gameState.currentEnemy = { ...enemy };
    const enemySpriteEl = document.getElementById('enemy-sprite');
    const enemyNameEl = document.getElementById('enemy-name');
    const enemyLevelEl = document.getElementById('enemy-level');
    const enemyHpEl = document.getElementById('enemy-hp');
    const enemyHpCurrentEl = document.getElementById('enemy-hp-current');
    const enemyHpMaxEl = document.getElementById('enemy-hp-max');
    
    if (enemySpriteEl) enemySpriteEl.textContent = enemy.emoji;
    if (enemyNameEl) enemyNameEl.textContent = enemy.name;
    if (enemyLevelEl) enemyLevelEl.textContent = gameState.currentQuestion;
    if (enemyHpEl) enemyHpEl.style.width = '100%';
    if (enemyHpCurrentEl) enemyHpCurrentEl.textContent = enemy.hp;
    if (enemyHpMaxEl) enemyHpMaxEl.textContent = enemy.hp;
    
    // ボス戦演出
    const isBoss = gameState.currentQuestion % 10 === 0;
    const bossTagEl = document.getElementById('boss-tag');
    if (bossTagEl) bossTagEl.style.display = isBoss ? 'inline-block' : 'none';
    if (enemySpriteEl) {
        enemySpriteEl.style.fontSize = isBoss ? '120px' : '100px';
    }
    
    // タイマー開始
    startTimer();
    
    // 敵とUIの表示が完了してからボタンを有効化（遅延実行）
    setTimeout(() => {
        console.log(`[DEBUG] ボタン有効化チェック - ストーリー中: ${gameState.isStoryPlaying}, 処理中: ${gameState.isProcessing}`);
        
        // ストーリーモード中でない限り強制的にボタンを有効化
        if (!gameState.isStoryPlaying) {
            enableAnswerButtons();
            console.log('[DEBUG] 敵表示完了、ボタンを有効化');
        } else {
            console.log('[DEBUG] ストーリーモード中のためボタン有効化をスキップ');
        }
    }, 300); // 0.3秒の遅延で確実に表示完了を待つ
}

// ------------------------------
// タイマー管理
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
    
    console.log('[DEBUG] 診断画面のタイマー制限を完全解除');
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
    
    console.log(`[DEBUG] 回答処理開始 - 値: ${value}, フラグ設定完了`);
    
    // 再度チェック（レースコンディション対策）
    if (gameState.isStoryPlaying) {
        console.log('[DEBUG] ストーリー再生中のため回答処理を中止');
        gameState.isProcessing = false;
        gameState.buttonsDisabled = false;
        return;
    }
    
    // 即座にボタンを無効化
    disableAnswerButtons();
    
    console.log(`[DEBUG] 診断回答処理開始: 値=${value}, 質問=${gameState.currentQuestion}`);
    
    clearInterval(gameState.timerInterval);
    
    const questionIndex = gameState.currentQuestion - 1;
    const question = questions[questionIndex];
    
    if (!question) {
        // エラー時は処理フラグをリセット
        gameState.isProcessing = false;
        enableAnswerButtons();
        return;
    }
    
    // 回答を記録
    gameState.answers.push({
        questionId: questionIndex,
        value: value,
        type: question.type,
        traits: question.traits || []
    });
    
    // スコア更新
    updatePersonalityScores(question, value);
    
    // セーブデータに追加
    saveData.addAnswer(questionIndex, value, question.type, question.traits);
    
    
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
    
    // 敵HP減少
    setTimeout(() => {
        document.getElementById('enemy-hp').style.width = '0%';
        document.getElementById('enemy-hp-current').textContent = '0';
        
        // 報酬処理は削除
        
        updateAllUI();
        
        // 次の処理
        if (gameState.currentQuestion % 10 === 0) {
            // キャラクター獲得
            setTimeout(() => {
                acquireCharacter();
            }, 1000);
        } else if (gameState.currentQuestion === gameState.totalQuestions) {
            // ゲーム完了
            setTimeout(() => {
                showResults();
            }, 1000);
        } else {
            // 次の質問
            setTimeout(() => {
                gameState.currentQuestion++;
                updateStage();
                // loadQuestion()内でisProcessingフラグとボタンが適切に制御される
                loadQuestion();
            }, 1500);
        }
    }, 500);
}

// ------------------------------
// 攻撃アニメーション
// ------------------------------
function attackAnimation() {
    const enemy = document.getElementById('enemy-sprite');
    if (!enemy) return;
    
    enemy.classList.add('damage');
    setTimeout(() => enemy.classList.remove('damage'), 500);
}

// ------------------------------
// ダメージ表示
// ------------------------------
function showDamage(damage) {
    const dmgEl = document.getElementById('dmg-number');
    if (!dmgEl) return;

    dmgEl.textContent = `-${damage}`;
    // アニメーションをリスタートして浮上エフェクトを再生
    dmgEl.style.animation = 'none';
    dmgEl.offsetHeight; // reflow
    dmgEl.style.animation = '';
}


// ------------------------------
// キャラクター獲得
// ------------------------------
function acquireCharacter() {
    const stageIndex = Math.floor((gameState.currentQuestion - 1) / 10);
    const characterPool = getCharacterPool(stageIndex);
    const character = selectCharacterBasedOnPersonality(characterPool);
    
    // ステージに応じた画像を設定（character1.png から character10.png）
    const characterNumber = stageIndex + 1;
    character.image = `./char/character${characterNumber}.png`;
    
    // 仲間に追加
    gameState.partyMembers.push(character);
    
    // セーブデータに保存
    saveData.addPartyMember(character);
    
    // カードデータ作成
    const cardData = {
        name: `${character.name}の力`,
        icon: character.emoji,
        description: character.description,
        evidence: [`Q${gameState.currentQuestion-9}:5`, `Q${gameState.currentQuestion-5}:4`, `Q${gameState.currentQuestion}:5`]
    };
    
    // モーダル表示
    displayCharacterModal(character);
    
    // 仲間リスト更新機能削除
    
    // プロンプト解放チェック
    checkPromptUnlock(character);
    
    // Step完了プロンプト生成（保存のみ、表示はキャラクターモーダル後）
    const stepPrompt = generateStepPrompt(stageIndex + 1);
    gameState.currentStepPrompt = stepPrompt;
}

// ------------------------------
// Step完了プロンプト生成
// ------------------------------
function generateStepPrompt(stepNumber) {
    // そのStepの質問と回答を取得
    const stepStartIndex = (stepNumber - 1) * 10;
    const stepAnswers = gameState.answers.slice(stepStartIndex, stepStartIndex + 10).map(answer => {
        const questionData = questions[answer.questionId];
        return {
            questionId: answer.questionId,
            questionText: questionData ? questionData.text : `質問${answer.questionId + 1}`,
            value: answer.value
        };
    });

    // プロンプトを生成
    const prompt = promptsManager.generateStepPrompt(stepNumber, stepAnswers, gameState.answers);
    
    // プロンプトを保存
    if (prompt) {
        saveData.saveStepPrompt(stepNumber, prompt);
    }
    
    return prompt;
}

// ------------------------------
// プロンプトモーダル表示
// ------------------------------
function showPromptModal(prompt) {
    document.getElementById('prompt-title').textContent = prompt.title;
    document.getElementById('prompt-text').textContent = prompt.content;
    document.getElementById('prompt-modal').classList.add('show');
    
    // イベントバインド
    bindPromptModalEvents(prompt.content);
}

function bindPromptModalEvents(promptContent) {
    // コピーボタン
    const copyBtn = document.getElementById('prompt-copy');
    copyBtn?.addEventListener('click', () => {
        navigator.clipboard.writeText(promptContent).then(() => {
            copyBtn.textContent = '✅ コピー完了';
            setTimeout(() => {
                copyBtn.textContent = '📋 コピー';
            }, 2000);
        });
    });
    
    // 閉じるボタン
    document.getElementById('prompt-close')?.addEventListener('click', closePromptModal);
    document.getElementById('prompt-continue')?.addEventListener('click', closePromptModal);
}

function closePromptModal() {
    document.getElementById('prompt-modal').classList.remove('show');
    
    // プロンプトモーダル後に確認画面を表示
    setTimeout(() => {
        showStepCompleteModal();
    }, 300);
}

// ------------------------------
// Step完了確認モーダル
// ------------------------------
function showStepCompleteModal() {
    const stepNumber = Math.floor(gameState.currentQuestion / 10);
    const lastCharacter = gameState.partyMembers[gameState.partyMembers.length - 1];
    const progressPercent = (gameState.currentQuestion / gameState.totalQuestions) * 100;
    
    // モーダル内容を更新
    document.getElementById('step-complete-title').textContent = `Step ${stepNumber} 完了！`;
    document.getElementById('step-questions-count').textContent = '10';
    document.getElementById('step-character').textContent = lastCharacter ? lastCharacter.name : 'キャラクター';
    document.getElementById('step-progress-fill').style.width = `${progressPercent}%`;
    document.getElementById('step-progress-text').textContent = `${gameState.currentQuestion}/100問完了`;
    
    // モーダル表示
    document.getElementById('step-complete-modal').classList.add('show');
    
    // イベントバインド
    bindStepCompleteEvents();
}

function bindStepCompleteEvents() {
    // ホームに戻るボタン
    document.getElementById('step-complete-home')?.addEventListener('click', () => {
        document.getElementById('step-complete-modal').classList.remove('show');
        gameState.currentStepPrompt = null;
        
        // Step完了状態を正しく保存
        saveProgress();
        
        window.homeManager.returnToHome();
    });
    
    // 次のStepへボタン
    document.getElementById('step-complete-continue')?.addEventListener('click', () => {
        document.getElementById('step-complete-modal').classList.remove('show');
        gameState.currentStepPrompt = null;
        continueAfterPrompt();
    });
}

function continueAfterPrompt() {
    // チャプター番号を計算（10問ごとに1章進む）
    const chapterNumber = Math.floor(gameState.currentQuestion / 10);
    
    // ストーリーがある場合は再生
    if (chapterNumber <= 10) {
        // カードデータを作成
        const lastCharacter = gameState.partyMembers[gameState.partyMembers.length - 1];
        const cardData = {
            name: `${lastCharacter.name}の力`,
            icon: lastCharacter.emoji,
            description: lastCharacter.description,
            evidence: [`Q${gameState.currentQuestion-9}:5`, `Q${gameState.currentQuestion-5}:4`, `Q${gameState.currentQuestion}:5`]
        };
        
        // ストーリー再生（カード獲得演出付き）
        setStoryMode(true);
        storyManager.playChapterTransition(chapterNumber, cardData, () => {
            setStoryMode(false);
            if (gameState.currentQuestion < gameState.totalQuestions) {
                gameState.currentQuestion++;
                updateStage();
                loadQuestion();
            } else {
                showResults();
            }
        });
    } else {
        // ストーリーがない場合は通常処理
        if (gameState.currentQuestion < gameState.totalQuestions) {
            gameState.currentQuestion++;
            updateStage();
            loadQuestion();
        } else {
            showResults();
        }
    }
}

// ------------------------------
// プロンプト解放チェック
// ------------------------------
function checkPromptUnlock(character) {
    const promptsToUnlock = {
        'ストラテジスト': 'time_blocking',
        'ガーディアン': 'fairness_matrix',
        'イノベーター': 'creative_reframe',
        'エンパス': 'emotion_weight',
        'コネクター': 'network_analysis',
        'ロイヤリスト': 'trust_scoring',
        'ナビゲーター': 'roadmap_planning',
        'エクスプレイナー': 'explanation_framework'
    };
    
    const promptId = promptsToUnlock[character.name];
    if (promptId) {
        saveData.unlockPrompt(promptId, {
            name: character.name + 'のプロンプト',
            unlockedBy: 'character'
        });
    }
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
        if (character.affinities) {
            character.affinities.forEach(affinity => {
                score += gameState.personalityScores[affinity] || 0;
            });
        }
        
        if (score > bestScore) {
            bestScore = score;
            bestMatch = character;
        }
    });
    
    return bestMatch || pool[0];
}

// ------------------------------
// キャラクターモーダル表示
// ------------------------------
function displayCharacterModal(character) {
    document.getElementById('character-rarity').textContent = '★'.repeat(character.rarity || 3);
    const characterImage = document.getElementById('character-image');
    if (characterImage && character.image) {
        characterImage.src = character.image;
        characterImage.alt = character.name;
    }
    document.getElementById('character-name').textContent = character.name;
    document.getElementById('character-title').textContent = character.title || '';
    // 攻撃力・防御力・特殊能力の設定は削除
    document.getElementById('character-description').textContent = character.description || '';
    
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
function closeCharacterModal() {
    document.getElementById('character-modal').classList.remove('show');
    
    // モーダル閉じる時にオーバーレイを復元（処理中の場合のみ）
    if (gameState.isProcessing || gameState.buttonsDisabled) {
        const overlay = document.getElementById('button-block-overlay');
        if (overlay) {
            overlay.style.pointerEvents = 'auto';
            console.log('[DEBUG] キャラクターモーダル閉じる時にオーバーレイを復元');
        }
    }
    
    // Stepプロンプトを表示
    if (gameState.currentStepPrompt) {
        setTimeout(() => {
            showPromptModal(gameState.currentStepPrompt);
        }, 500);
        return;
    }
    
    // プロンプトがない場合は通常継続処理
    continueAfterPrompt();
}

// ------------------------------
// 仲間リスト更新
// ------------------------------
// 仲間リスト表示機能削除済み

// ------------------------------
// レアリティクラス取得
// ------------------------------
function getRarityClass(rarity) {
    const classes = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
    return classes[(rarity || 1) - 1] || 'common';
}

// ------------------------------
// ステージ更新
// ------------------------------
function updateStage() {
    try {
        const stageIndex = Math.floor((gameState.currentQuestion - 1) / 10);
        const stageNum = Math.min(10, stageIndex + 1);

        // ステージ名更新
        const stageName = document.getElementById('stage-name');
        if (stageName && stageNames[stageIndex]) {
            stageName.textContent = stageNames[stageIndex];
        }

        // バトル行のステージクラス更新 (s1-s10)
        const battleRow = document.querySelector('.battle-row');
        if (battleRow) {
            for (let s = 1; s <= 10; s++) battleRow.classList.remove(`s${s}`);
            battleRow.classList.add(`s${stageNum}`);
        }

        // プレイヤーキャラクター画像更新
        const playerChar = document.getElementById('player-char');
        if (playerChar) {
            playerChar.src = `./char/character${stageNum}.png`;
        }
    } catch (error) {
        console.warn('ステージ更新エラー:', error);
    }
}

function updateAwakening() {
    const awakePercent = Math.round(
        (gameState.currentQuestion - 1) / (gameState.totalQuestions - 1) * 100
    );

    // プレイヤーキャラへの覚醒フィルタークラスを更新
    const playerChar = document.getElementById('player-char');
    if (playerChar) {
        for (let a = 10; a <= 90; a += 10) playerChar.classList.remove(`aw${a}`);
        if (awakePercent < 100) {
            const awLevel = Math.min(90, Math.max(10, Math.round(awakePercent / 10) * 10));
            playerChar.classList.add(`aw${awLevel}`);
        }
    }

    // 覚醒度テキストとバーを更新
    const awakePct = document.getElementById('awake-pct');
    const awakeBar = document.getElementById('awake-bar');
    if (awakePct) awakePct.textContent = `覚醒度 ${awakePercent}%`;
    if (awakeBar) awakeBar.style.width = `${awakePercent}%`;
}

// ------------------------------
// 全UI更新
// ------------------------------
function updateAllUI() {
    updateStage();
}

// ------------------------------
// 最終結果表示
// ------------------------------
function showResults() {
    // MBTI判定
    const mbtiType = calculateMBTI();
    const mbtiInfo = getMBTIInfo(mbtiType);
    
    // 結果表示
    document.getElementById('mbti-type').textContent = mbtiType;
    document.getElementById('mbti-name').textContent = mbtiInfo.name;
    
    // 特性スコア表示
    displayTraitScores();
    
    // 最終統計
    const finalPartyElement = document.getElementById('final-party');
    if (finalPartyElement) {
        finalPartyElement.textContent = gameState.partyMembers.length;
    }
    
    // セーブ
    saveProgress();
    
    // 100問完了の場合はMBTIも保存
    if (gameState.currentQuestion === 100) {
        saveData.calculateAndSaveMBTI();
        
        // エンディングストーリーを再生してから結果モーダル表示
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
    if (!traitList) return;
    
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
    // セーブしてホームに戻る
    saveProgress();
    
    // ホームに戻る
    if (window.homeManager) {
        window.homeManager.returnToHome();
    } else {
        // homeManagerがない場合はページリロード
        location.href = '../index.html';
    }
}


// ------------------------------
// エクスポート
// ------------------------------