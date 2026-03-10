// results/results.js - 診断結果画面

import { saveData } from '../data/save-data.js';
import { questions } from '../data/questions.js';

class ResultsManager {
    constructor() {
        this.container = null;
        this.chartCanvas = null;
    }

    show() {
        const data = saveData.load();
        const container = document.getElementById('results-screen');
        
        if (data.answeredQuestions === 0) {
            this.showNoDataMessage(container);
            return;
        }
        
        container.innerHTML = `
            <div class="results-container">
                <!-- ヘッダー -->
                <div class="results-header">
                    <button class="back-btn" id="results-back">
                        <span>←</span>
                    </button>
                    <h1 class="results-title">診断結果詳細</h1>
                    <button class="export-btn" id="results-export">
                        <span>📤</span>
                    </button>
                </div>
                
                <!-- スクロール可能なコンテンツエリア -->
                <div class="results-content">
                    <!-- サマリーカード -->
                    <div class="summary-card">
                        <div class="summary-icon">📊</div>
                        <div class="summary-info">
                            <div class="summary-label">回答済み質問数</div>
                            <div class="summary-value">${data.answeredQuestions}/100問</div>
                            <div class="summary-bar">
                                <div class="summary-bar-fill" style="width: ${data.answeredQuestions}%"></div>
                            </div>
                        </div>
                    </div>
                    
                    
                    <!-- 獲得した仲間 -->
                    ${data.partyMembers.length > 0 ? this.renderPartyMembers(data) : ''}
                    
                    <!-- 質問ごとの詳細結果 -->
                    <div class="detailed-results">
                        <h2 class="section-title">🔍 回答詳細 (Stepごと)</h2>
                        <div class="questions-list">
                            ${this.renderDetailedQuestions(data)}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // イベントバインド
        this.bindResultsEvents();
        
        // レーダーチャート描画
        if (data.answeredQuestions > 0) {
            this.drawRadarChart(data.personalityScores);
        }
    }

    showNoDataMessage(container) {
        container.innerHTML = `
            <div class="results-container">
                <div class="results-header">
                    <button class="back-btn" id="results-back">
                        <span>←</span>
                    </button>
                    <h1 class="results-title">診断結果</h1>
                </div>
                
                <div class="no-data-message">
                    <div class="no-data-icon">📭</div>
                    <h2>まだ診断データがありません</h2>
                    <p>「育成」から心理診断を始めましょう！</p>
                    <button class="start-btn" id="start-from-results">
                        診断を始める
                    </button>
                </div>
            </div>
        `;
        
        // イベントバインド
        this.bindResultsEvents();
    }

    renderMBTIResult(data) {
        const mbtiType = data.mbtiType || this.calculateMBTI(data.personalityScores);
        const mbtiInfo = this.getMBTIInfo(mbtiType);
        
        return `
            <div class="mbti-card">
                <h2 class="card-title">MBTIタイプ</h2>
                <div class="mbti-content">
                    <div class="mbti-type">${mbtiType}</div>
                    <div class="mbti-name">${mbtiInfo.name}</div>
                    <div class="mbti-description">${mbtiInfo.description}</div>
                </div>
                <div class="mbti-traits">
                    <div class="trait ${data.personalityScores.E > data.personalityScores.I ? 'active' : ''}">
                        外向型 (E)
                    </div>
                    <div class="trait ${data.personalityScores.I > data.personalityScores.E ? 'active' : ''}">
                        内向型 (I)
                    </div>
                    <div class="trait ${data.personalityScores.S > data.personalityScores.N ? 'active' : ''}">
                        感覚型 (S)
                    </div>
                    <div class="trait ${data.personalityScores.N > data.personalityScores.S ? 'active' : ''}">
                        直観型 (N)
                    </div>
                    <div class="trait ${data.personalityScores.T > data.personalityScores.F ? 'active' : ''}">
                        思考型 (T)
                    </div>
                    <div class="trait ${data.personalityScores.F > data.personalityScores.T ? 'active' : ''}">
                        感情型 (F)
                    </div>
                    <div class="trait ${data.personalityScores.J > data.personalityScores.P ? 'active' : ''}">
                        判断型 (J)
                    </div>
                    <div class="trait ${data.personalityScores.P > data.personalityScores.J ? 'active' : ''}">
                        知覚型 (P)
                    </div>
                </div>
            </div>
        `;
    }

    renderTraitList(scores) {
        const traits = [
            { name: '外向性', key: 'extraversion', icon: '🗣️' },
            { name: '開放性', key: 'openness', icon: '🌟' },
            { name: '協調性', key: 'agreeableness', icon: '🤝' },
            { name: '誠実性', key: 'conscientiousness', icon: '✅' },
            { name: 'リーダーシップ', key: 'leadership', icon: '👑' },
            { name: '創造性', key: 'creativity', icon: '🎨' }
        ];
        
        return traits.map(trait => {
            const score = Math.round(scores[trait.key] || 0);
            const percentage = Math.min(100, Math.max(0, score + 50));
            
            return `
                <div class="trait-item">
                    <div class="trait-header">
                        <span class="trait-icon">${trait.icon}</span>
                        <span class="trait-name">${trait.name}</span>
                        <span class="trait-score">${score}</span>
                    </div>
                    <div class="trait-bar">
                        <div class="trait-bar-fill" style="width: ${percentage}%"></div>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderPartyMembers(data) {
        if (data.partyMembers.length === 0) {
            return '';
        }
        
        return `
            <div class="party-card">
                <h2 class="section-title">✨ 獲得した仲間</h2>
                <div class="party-grid">
                    ${data.partyMembers.map(member => `
                        <div class="party-member-card">
                            <div class="member-image-container">
                                <img class="member-image" src="${member.image || './char/character_blue1.png'}" alt="${member.name}" />
                            </div>
                            <div class="member-name">${member.name}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderDetailedQuestions(data) {
        if (!data.answers || data.answers.length === 0) {
            return '<div class="no-answers">まだ回答がありません</div>';
        }
        
        return data.answers.map((answer, index) => {
            const questionData = questions[answer.questionId] || {};
            const questionNumber = answer.questionId + 1;
            const answerEmoji = ['😞', '🙁', '😐', '🙂', '😄'][answer.value - 1];
            const answerText = ['全く思わない', 'あまり思わない', 'どちらでもない', 'ややそう思う', 'とてもそう思う'][answer.value - 1];
            
            // 10問ごとのステップ計算
            const step = Math.floor((questionNumber - 1) / 10) + 1;
            const stepQuestion = ((questionNumber - 1) % 10) + 1;
            
            return `
                <div class="question-detail-card">
                    <div class="question-header">
                        <div class="question-number">
                            <span class="step-indicator">Step ${step}</span>
                            <span class="question-index">${stepQuestion}/10</span>
                            <span class="global-number">Q${questionNumber}</span>
                        </div>
                        <div class="answer-indicator">
                            <span class="answer-emoji">${answerEmoji}</span>
                            <span class="answer-value">${answer.value}/5</span>
                        </div>
                    </div>
                    
                    <div class="question-content">
                        <div class="question-text">${questionData.text || '質問データなし'}</div>
                        <div class="answer-text">回答: ${answerText}</div>
                    </div>
                    
                    <div class="question-metadata">
                        ${questionData.category ? `<span class="category-tag">${questionData.category}</span>` : ''}
                        ${questionData.type ? `<span class="type-tag">${questionData.type}</span>` : ''}
                        ${answer.traits && answer.traits.length > 0 ? 
                            `<div class="traits-info">
                                関連特性: ${answer.traits.map(t => t.name).join(', ')}
                            </div>` : ''
                        }
                    </div>
                </div>
            `;
        }).join('');
    }

    renderStatistics(data) {
        const stats = saveData.getStatistics();
        
        return `
            <div class="stat-item">
                <div class="stat-label">レベル</div>
                <div class="stat-value">Lv.${stats.level}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">総戦力</div>
                <div class="stat-value">${stats.totalPower}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">コイン</div>
                <div class="stat-value">${stats.coins}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">平均回答</div>
                <div class="stat-value">${stats.averageAnswerValue.toFixed(1)}</div>
            </div>
        `;
    }

    renderAnswerHistory(answers) {
        if (answers.length === 0) {
            return '<div class="no-history">回答履歴がありません</div>';
        }
        
        // 最新10件を表示
        const recent = answers.slice(-10).reverse();
        
        return recent.map((answer, index) => {
            const valueEmoji = ['😞', '🙁', '😐', '🙂', '😄'][answer.value - 1];
            
            return `
                <div class="history-item">
                    <div class="history-number">Q${answers.length - index}</div>
                    <div class="history-value">${valueEmoji} ${answer.value}/5</div>
                </div>
            `;
        }).join('');
    }

    calculateMBTI(scores) {
        let type = '';
        type += scores.E > scores.I ? 'E' : 'I';
        type += scores.S > scores.N ? 'S' : 'N';
        type += scores.T > scores.F ? 'T' : 'F';
        type += scores.J > scores.P ? 'J' : 'P';
        return type;
    }

    getMBTIInfo(type) {
        const mbtiTypes = {
            'INTJ': { name: '建築家', description: '独創的な戦略家' },
            'INTP': { name: '論理学者', description: '革新的な発明家' },
            'ENTJ': { name: '指揮官', description: '大胆な指導者' },
            'ENTP': { name: '討論者', description: '賢い好奇心旺盛な思考家' },
            'INFJ': { name: '提唱者', description: '静かで神秘的な理想主義者' },
            'INFP': { name: '仲介者', description: '詩的で親切な利他主義者' },
            'ENFJ': { name: '主人公', description: 'カリスマ的な指導者' },
            'ENFP': { name: '運動家', description: '情熱的な自由人' },
            'ISTJ': { name: '管理者', description: '実用的で事実を重視' },
            'ISFJ': { name: '擁護者', description: '献身的で温かい守護者' },
            'ESTJ': { name: '幹部', description: '優れた管理者' },
            'ESFJ': { name: '領事', description: '思いやりのある協力者' },
            'ISTP': { name: '巨匠', description: '大胆で実践的な実験者' },
            'ISFP': { name: '冒険家', description: '柔軟で魅力的な芸術家' },
            'ESTP': { name: '起業家', description: '賢くエネルギッシュ' },
            'ESFP': { name: 'エンターテイナー', description: '自発的で情熱的' }
        };
        
        return mbtiTypes[type] || { name: '探求者', description: '個性的な思考家' };
    }

    drawRadarChart(scores) {
        const canvas = document.getElementById('personality-radar');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const size = Math.min(canvas.parentElement.offsetWidth - 40, 300);
        canvas.width = size;
        canvas.height = size;
        
        const centerX = size / 2;
        const centerY = size / 2;
        const radius = size / 2 - 30;
        
        // データ準備
        const labels = ['E/I', 'S/N', 'T/F', 'J/P', '開放性', '誠実性'];
        const values = [
            scores.E - scores.I,
            scores.S - scores.N,
            scores.T - scores.F,
            scores.J - scores.P,
            scores.openness,
            scores.conscientiousness
        ];
        
        // 最大値で正規化
        const maxValue = 50;
        const normalizedValues = values.map(v => (v + maxValue) / (maxValue * 2));
        
        // 背景グリッド描画
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 1;
        
        for (let i = 1; i <= 5; i++) {
            ctx.beginPath();
            for (let j = 0; j < 6; j++) {
                const angle = (Math.PI * 2 / 6) * j - Math.PI / 2;
                const x = centerX + Math.cos(angle) * (radius * i / 5);
                const y = centerY + Math.sin(angle) * (radius * i / 5);
                
                if (j === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.closePath();
            ctx.stroke();
        }
        
        // データポリゴン描画
        ctx.fillStyle = 'rgba(102, 126, 234, 0.3)';
        ctx.strokeStyle = '#667eea';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * 2 / 6) * i - Math.PI / 2;
            const value = normalizedValues[i] || 0.5;
            const x = centerX + Math.cos(angle) * (radius * value);
            const y = centerY + Math.sin(angle) * (radius * value);
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // ラベル描画
        ctx.fillStyle = '#FFF';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * 2 / 6) * i - Math.PI / 2;
            const x = centerX + Math.cos(angle) * (radius + 20);
            const y = centerY + Math.sin(angle) * (radius + 20);
            ctx.fillText(labels[i], x, y);
        }
    }

    bindResultsEvents() {
        // 戻るボタン
        document.getElementById('results-back')?.addEventListener('click', () => {
            window.homeManager.returnToHome();
        });
        
        // エクスポートボタン
        document.getElementById('results-export')?.addEventListener('click', () => {
            saveData.exportData();
        });
        
        // 診断開始ボタン（データがない場合）
        document.getElementById('start-from-results')?.addEventListener('click', () => {
            window.homeManager.startTraining();
        });
    }
}

// エクスポート
export const resultsManager = new ResultsManager();