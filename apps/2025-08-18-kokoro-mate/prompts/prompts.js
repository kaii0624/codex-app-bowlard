// prompts/prompts.js - 学習プロンプト画面

import { saveData } from '../data/save-data.js';

class PromptsManager {
    constructor() {
        this.prompts = this.getPromptDatabase();
    }

    show() {
        const data = saveData.load();
        const container = document.getElementById('prompts-screen');
        const stepPrompts = saveData.getStepPrompts();
        
        container.innerHTML = `
            <div class="prompts-container">
                <!-- ヘッダー -->
                <div class="prompts-header">
                    <button class="back-btn" id="prompts-back">
                        <span>←</span>
                    </button>
                    <h1 class="prompts-title">学習プロンプト</h1>
                    <div class="unlock-count">
                        <span>${stepPrompts.length}</span>/10
                    </div>
                </div>
                
                <!-- スクロール可能なコンテンツエリア -->
                <div class="prompts-content">
                    <!-- プロンプトの説明 -->
                    <div class="prompts-intro">
                        <p>AIが学習した「決め切る」ためのプロンプト技術です。</p>
                        <p>診断を進めると新しいプロンプトが解放されます。</p>
                    </div>
                    
                    <!-- Step完了プロンプト -->
                    ${this.renderStepPrompts(stepPrompts)}
                </div>
            </div>
        `;
        
        // イベントバインド
        this.bindPromptsEvents();
    }

    renderPromptList(data) {
        return this.prompts.map(prompt => {
            const isUnlocked = this.isPromptUnlocked(data, prompt.id);
            const canUnlock = this.canUnlockPrompt(data, prompt);
            
            return `
                <div class="prompt-card ${isUnlocked ? 'unlocked' : ''} ${canUnlock && !isUnlocked ? 'can-unlock' : ''}">
                    <div class="prompt-header">
                        <div class="prompt-icon">${prompt.icon}</div>
                        <div class="prompt-info">
                            <h3 class="prompt-name">${isUnlocked ? prompt.name : '???'}</h3>
                            <div class="prompt-requirement">
                                ${this.renderRequirement(prompt, data)}
                            </div>
                        </div>
                        ${isUnlocked ? '<div class="unlock-badge">✅</div>' : ''}
                    </div>
                    
                    ${isUnlocked ? `
                        <div class="prompt-content">
                            <div class="prompt-description">${prompt.description}</div>
                            <div class="prompt-code">
                                <div class="code-header">
                                    <span>プロンプトコード</span>
                                    <button class="copy-btn" data-prompt="${prompt.id}">📋</button>
                                </div>
                                <pre>${prompt.code}</pre>
                            </div>
                            <div class="prompt-example">
                                <h4>使用例</h4>
                                <p>${prompt.example}</p>
                            </div>
                        </div>
                    ` : `
                        <div class="locked-content">
                            <div class="lock-icon">🔒</div>
                            <div class="unlock-hint">${prompt.hint}</div>
                        </div>
                    `}
                </div>
            `;
        }).join('');
    }

    renderStepPrompts(stepPrompts) {
        const data = saveData.load();
        const currentStep = Math.floor(data.answeredQuestions / 10);
        
        return `
            <div class="section-divider">
                <h2>✨ あなた専用プロンプト</h2>
                <p>診断結果に基づいて生成されました</p>
            </div>
            <div class="step-prompts-list">
                ${Array.from({length: 10}, (_, i) => {
                    const stepNumber = i + 1;
                    const stepPrompt = stepPrompts.find(p => p.stepNumber === stepNumber);
                    const isCompleted = stepNumber <= currentStep;
                    
                    if (stepPrompt) {
                        // 完了済み・プロンプト生成済み
                        return `
                            <div class="step-prompt-card unlocked">
                                <div class="step-prompt-header">
                                    <div class="step-info">
                                        <div class="step-number">Step ${stepNumber}</div>
                                        <div class="step-theme">${stepPrompt.title}</div>
                                    </div>
                                    <button class="copy-btn" data-content="${this.escapeHtml(stepPrompt.content)}">📋</button>
                                </div>
                                <div class="step-prompt-content">
                                    <pre>${stepPrompt.content}</pre>
                                </div>
                                <div class="step-prompt-meta">
                                    生成日時: ${new Date(stepPrompt.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                        `;
                    } else {
                        // 未完了
                        return `
                            <div class="step-prompt-card locked">
                                <div class="step-prompt-header">
                                    <div class="step-info">
                                        <div class="step-number">Step ${stepNumber}</div>
                                        <div class="step-theme">???</div>
                                    </div>
                                    <div class="lock-icon">🔒</div>
                                </div>
                                <div class="locked-message">
                                    <p>Step ${stepNumber}を完了すると解放されます</p>
                                    <div class="progress-hint">
                                        ${stepNumber > currentStep + 1 ? 
                                            `前のStepを完了してください` : 
                                            `あと${10 - (data.answeredQuestions % 10)}問で解放`
                                        }
                                    </div>
                                </div>
                            </div>
                        `;
                    }
                }).join('')}
            </div>
        `;
    }

    escapeHtml(text) {
        return text.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    renderRequirement(prompt, data) {
        if (prompt.requireQuestions) {
            const progress = Math.min(100, (data.answeredQuestions / prompt.requireQuestions) * 100);
            return `
                <div class="requirement-progress">
                    <span>${data.answeredQuestions}/${prompt.requireQuestions}問</span>
                    <div class="mini-progress-bar">
                        <div class="mini-progress-fill" style="width: ${progress}%"></div>
                    </div>
                </div>
            `;
        }
        
        if (prompt.requireCharacter) {
            const hasCharacter = data.partyMembers.some(m => m.name === prompt.requireCharacter);
            return `
                <div class="requirement-character">
                    ${hasCharacter ? '✅' : '❌'} ${prompt.requireCharacter}が必要
                </div>
            `;
        }
        
        return '';
    }

    isPromptUnlocked(data, promptId) {
        // 実際の解放状態をチェック
        const unlocked = data.unlockedPrompts.find(p => p.id === promptId);
        if (unlocked) return true;
        
        // 自動解放の条件をチェック
        const prompt = this.prompts.find(p => p.id === promptId);
        if (prompt && this.canUnlockPrompt(data, prompt)) {
            // 自動解放して保存
            saveData.unlockPrompt(promptId, {
                name: prompt.name,
                code: prompt.code
            });
            return true;
        }
        
        return false;
    }

    canUnlockPrompt(data, prompt) {
        if (prompt.requireQuestions && data.answeredQuestions < prompt.requireQuestions) {
            return false;
        }
        
        if (prompt.requireCharacter) {
            const hasCharacter = data.partyMembers.some(m => m.name === prompt.requireCharacter);
            if (!hasCharacter) return false;
        }
        
        if (prompt.requireMBTI && data.mbtiType !== prompt.requireMBTI) {
            return false;
        }
        
        return true;
    }

    generateStepPrompt(stepNumber, stepAnswers, allAnswers) {
        const stepThemes = {
            1: { theme: "自己認識", task: "最適な作業環境やスケジュール管理方法を決定する" },
            2: { theme: "価値観", task: "チーム作業の進め方やコミュニケーション方法を選択する" },
            3: { theme: "決断", task: "リスクを伴う重要な判断や問題解決アプローチを決める" },
            4: { theme: "創造", task: "新しい企画やクリエイティブなプロジェクトを立案する" },
            5: { theme: "共感", task: "人間関係の調整や感情に配慮した意思決定を行う" },
            6: { theme: "繋がり", task: "ネットワーキングやコラボレーションの計画を立てる" },
            7: { theme: "信頼", task: "長期的なパートナーシップや信頼関係を構築する" },
            8: { theme: "導き", task: "チームリーダーシップや戦略的意思決定を実行する" },
            9: { theme: "透明性", task: "自己改善計画や透明性のあるコミュニケーションを設計する" },
            10: { theme: "統合", task: "複雑で多面的な統合的意思決定を行う" }
        };

        const stepInfo = stepThemes[stepNumber];
        if (!stepInfo) return null;

        // そのStepの回答から心理プロファイルを生成
        const profile = this.generatePsychologicalProfile(stepAnswers);
        
        return {
            title: `Step ${stepNumber}: ${stepInfo.theme}の決定プロンプト`,
            content: `# 命令書
${stepInfo.task}

# 心理プロファイル結果
${profile}`
        };
    }

    generatePsychologicalProfile(stepAnswers) {
        return stepAnswers.map((answer, index) => {
            const question = answer.questionText || `質問${answer.questionId + 1}`;
            const answerText = ['全く思わない', 'あまり思わない', 'どちらでもない', 'ややそう思う', 'とてもそう思う'][answer.value - 1];
            return `${question}：${answerText}`;
        }).join('\n');
    }

    getPromptDatabase() {
        return [
            {
                id: 'basic_context',
                name: '基本コンテキスト設定',
                icon: '📝',
                description: '外部要因と内部要因を組み合わせる基本形',
                code: `# 外部要因
constraints: {
  deadline: "10:00",
  weather: "雨",
  requirements: ["混雑回避", "屋内優先", "移動制約"]
}

# 内部要因（カード）
user_preferences: {
  crowd_tolerance: "低",
  indoor_priority: "高",
  time_efficiency: "重視"
}

# 決定指示
最適な選択肢を1つに絞って提示してください。`,
                example: '出張計画、会議場所選定、ランチ選択など',
                hint: '最初の10問をクリアすると解放',
                requireQuestions: 10
            },
            {
                id: 'time_blocking',
                name: 'タイムブロッキング',
                icon: '⏰',
                description: 'ストラテジストから学ぶ時間管理術',
                code: `# タイムブロック設定
blocks: [
  { start: "09:00", end: "10:30", type: "deep_work", interruption: false },
  { start: "10:30", end: "11:00", type: "break", flexible: true },
  { start: "11:00", end: "12:00", type: "meeting", priority: "high" }
]

# 最適化指示
- 集中時間を最大化
- 中断を最小化
- バッファ時間を確保`,
                example: '1日のスケジュール最適化、プロジェクト計画',
                hint: 'ストラテジストを仲間にすると解放',
                requireCharacter: 'ストラテジスト'
            },
            {
                id: 'fairness_matrix',
                name: '公平性マトリックス',
                icon: '⚖️',
                description: 'ガーディアンから学ぶ公平な判断',
                code: `# 公平性評価
stakeholders: [
  { name: "参加者A", distance: 5, role: "必須", constraints: ["車椅子"] },
  { name: "参加者B", distance: 10, role: "任意", constraints: [] }
]

# 評価基準
- 移動負担の均等化
- アクセシビリティ確保
- 役割の重み付け

# 決定方法
最も公平な選択肢を数値化して提示`,
                example: '会議場所選定、リソース配分、タスク割り当て',
                hint: 'ガーディアンを仲間にすると解放',
                requireCharacter: 'ガーディアン'
            },
            {
                id: 'risk_assessment',
                name: 'リスクマトリックス',
                icon: '🛡️',
                description: 'リスクレンジャーから学ぶリスク評価',
                code: `# リスク評価
risks: [
  { event: "天候悪化", probability: 0.3, impact: "高", mitigation: "屋内代替" },
  { event: "交通遅延", probability: 0.2, impact: "中", mitigation: "早期出発" }
]

# リスクスコア計算
risk_score = probability × impact_weight

# 対策優先順位
1. 高確率×高影響 → 即対策
2. 低確率×高影響 → 予防策
3. 高確率×低影響 → 受容検討`,
                example: 'イベント計画、投資判断、プロジェクトリスク管理',
                hint: '30問クリアで解放',
                requireQuestions: 30
            },
            {
                id: 'creative_reframe',
                name: '創造的リフレーミング',
                icon: '💡',
                description: 'イノベーターから学ぶ逆転の発想',
                code: `# 問題の再定義
original_problem: "会議室が取れない"
reframed: [
  "そもそも物理的な集合が必要か？",
  "会議の目的は何か？",
  "代替手段で目的を達成できないか？"
]

# 創造的解決策
- VRミーティング
- 非同期コラボレーション
- アウトドアウォーキングミーティング`,
                example: '制約下での問題解決、新規事業アイデア',
                hint: 'イノベーターを仲間にすると解放',
                requireCharacter: 'イノベーター'
            },
            {
                id: 'emotion_weight',
                name: '感情ウェイト調整',
                icon: '❤️',
                description: 'エンパスから学ぶ感情の重み付け',
                code: `# 感情要因の数値化
emotional_factors: {
  team_morale: { current: 3, target: 5, weight: 0.3 },
  stress_level: { current: 7, target: 4, weight: 0.4 },
  motivation: { current: 4, target: 8, weight: 0.3 }
}

# 決定への反映
decision_score = logical_score × 0.6 + emotional_score × 0.4

# 感情的影響の予測
if (decision == "A") {
  morale_change: +2
  stress_change: -1
}`,
                example: 'チーム施策、モチベーション向上策、組織変更',
                hint: '50問クリアで解放',
                requireQuestions: 50
            },
            {
                id: 'network_analysis',
                name: 'ネットワーク分析',
                icon: '🤝',
                description: 'コネクターから学ぶ関係性の可視化',
                code: `# 関係性マップ
connections: {
  "A-B": { strength: 8, type: "協力的" },
  "B-C": { strength: 3, type: "中立" },
  "A-C": { strength: 2, type: "競合" }
}

# チーム編成最適化
optimal_team = maximize(synergy) - minimize(conflict)

# ブリッジ人材の特定
bridge_person = highest_betweenness_centrality()`,
                example: 'チーム編成、プロジェクト体制、組織設計',
                hint: '60問クリアで解放',
                requireQuestions: 60
            },
            {
                id: 'trust_scoring',
                name: '信頼スコアリング',
                icon: '🏰',
                description: 'ロイヤリストから学ぶ信頼性評価',
                code: `# 信頼性指標
trust_metrics: {
  track_record: { success_rate: 0.85, weight: 0.3 },
  consistency: { variance: 0.1, weight: 0.25 },
  transparency: { score: 8, weight: 0.25 },
  alignment: { values_match: 0.9, weight: 0.2 }
}

# 総合信頼スコア
trust_score = Σ(metric_value × weight)

# 閾値判定
if trust_score > 0.7:
  decision = "長期パートナーシップ"`,
                example: 'ベンダー選定、採用判断、投資判断',
                hint: '70問クリアで解放',
                requireQuestions: 70
            },
            {
                id: 'roadmap_planning',
                name: 'ロードマップ設計',
                icon: '🧭',
                description: 'ナビゲーターから学ぶ段階的計画',
                code: `# マイルストーン設定
milestones: [
  { phase: 1, goal: "MVP完成", duration: "3ヶ月", success_criteria: [...] },
  { phase: 2, goal: "市場テスト", duration: "2ヶ月", gate: "継続/中止" }
]

# 不確実性への対応
contingency_plans: {
  "遅延リスク": "スコープ調整",
  "市場変化": "ピボット検討"
}

# 意思決定ポイント
decision_gates: [
  { timing: "Phase1終了", criteria: "達成度70%以上" }
]`,
                example: '長期プロジェクト、製品開発、キャリア計画',
                hint: '80問クリアで解放',
                requireQuestions: 80
            },
            {
                id: 'explanation_framework',
                name: '説明責任フレームワーク',
                icon: '📊',
                description: 'エクスプレイナーから学ぶ透明な説明',
                code: `# 決定の構造化説明
decision_explanation: {
  what: "選択したオプション",
  why: {
    primary_reason: "最重要要因",
    supporting_factors: ["要因2", "要因3"],
    trade_offs: "犠牲にした要素"
  },
  how: {
    process: "評価プロセス",
    criteria: "判断基準",
    weights: "重み付けの根拠"
  },
  evidence: [
    { type: "data", source: "分析結果" },
    { type: "precedent", source: "過去事例" }
  ]
}

# 反対意見への対応
counter_arguments: {
  objection: "代替案Bの方が良いのでは？",
  response: "Bは短期的には有利だが、長期リスクが..."
}`,
                example: '重要決定の説明、ステークホルダー説得',
                hint: '90問クリアで解放',
                requireQuestions: 90
            },
            {
                id: 'master_integration',
                name: 'マスター統合プロンプト',
                icon: '🎯',
                description: '全ての要素を統合した究極の決定プロンプト',
                code: `# 完全統合型決定フレームワーク

## 1. コンテキスト収集
external_context: { constraints, requirements, deadlines }
internal_context: { preferences, values, emotions }

## 2. 多面的分析
analyses: {
  time: strategy_optimization(),
  fairness: equity_check(),
  risk: risk_assessment(),
  creativity: alternative_generation(),
  emotion: sentiment_analysis(),
  network: relationship_impact(),
  trust: reliability_score(),
  roadmap: phased_approach()
}

## 3. 統合スコアリング
final_score = weighted_sum(all_analyses)

## 4. 決定と説明
decision: {
  choice: "最適オプション",
  rationale: structured_explanation(),
  evidence: supporting_data(),
  contingency: backup_plans()
}

## 5. アカウンタビリティ
accountability: {
  decision_record: full_audit_trail(),
  stakeholder_comm: tailored_messages(),
  success_metrics: measurable_outcomes()
}`,
                example: '複雑な組織決定、戦略的意思決定、人生の重要な選択',
                hint: '100問完了で解放',
                requireQuestions: 100
            }
        ];
    }

    bindPromptsEvents() {
        // 戻るボタン
        document.getElementById('prompts-back')?.addEventListener('click', () => {
            window.homeManager.returnToHome();
        });
        
        // コピーボタン（Stepプロンプト）
        document.querySelectorAll('.copy-btn[data-content]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const content = e.target.dataset.content.replace(/&quot;/g, '"').replace(/&#39;/g, "'");
                
                navigator.clipboard.writeText(content).then(() => {
                    e.target.textContent = '✅';
                    setTimeout(() => {
                        e.target.textContent = '📋';
                    }, 2000);
                });
            });
        });
    }
}

// エクスポート
export const promptsManager = new PromptsManager();