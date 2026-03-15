// data/save-data.js - セーブデータ管理

class SaveDataManager {
    constructor() {
        this.storageKey = 'kimekiru-ai-save';
        this.defaultData = {
            // プレイヤー基本情報
            answeredQuestions: 0,
            totalQuestions: 100,
            currentStage: 1,
            
            // ゲーム進行状態（削除済み項目）
            
            // 回答履歴
            answers: [],
            
            // 獲得した仲間
            partyMembers: [],
            
            // 性格スコア
            personalityScores: {
                E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0,
                openness: 0,
                conscientiousness: 0,
                extraversion: 0,
                agreeableness: 0,
                neuroticism: 0,
                leadership: 0,
                teamwork: 0,
                creativity: 0,
                analytical: 0,
                adaptability: 0
            },
            
            // MBTI結果
            mbtiType: null,
            mbtiCalculated: false,
            
            // 学習したプロンプト
            unlockedPrompts: [],
            
            // Stepごとの生成プロンプト
            stepPrompts: [],
            
            // アチーブメント
            achievements: [],
            
            // タイムスタンプ
            createdAt: Date.now(),
            lastPlayedAt: Date.now(),
            totalPlayTime: 0,
            
            // ゲーム設定
            settings: {
                soundEnabled: true,
                vibrationEnabled: true,
                autoSave: true,
                textSpeed: 'normal'
            }
        };
    }

    // データ保存
    save(data) {
        try {
            const saveData = {
                ...this.load(),
                ...data,
                lastPlayedAt: Date.now()
            };
            
            localStorage.setItem(this.storageKey, JSON.stringify(saveData));
            
            // 自動バックアップ
            this.createBackup();
            
            return true;
        } catch (error) {
            console.error('セーブデータの保存に失敗しました:', error);
            return false;
        }
    }

    // データ読み込み
    load() {
        try {
            const savedData = localStorage.getItem(this.storageKey);
            
            if (!savedData) {
                return { ...this.defaultData };
            }
            
            const data = JSON.parse(savedData);
            
            // データ整合性チェック
            return this.validateData(data);
        } catch (error) {
            console.error('セーブデータの読み込みに失敗しました:', error);
            return { ...this.defaultData };
        }
    }

    // データ検証
    validateData(data) {
        // 必須フィールドの確認
        const validated = { ...this.defaultData };
        
        Object.keys(validated).forEach(key => {
            if (data.hasOwnProperty(key)) {
                validated[key] = data[key];
            }
        });
        
        return validated;
    }

    // データリセット
    reset() {
        if (confirm('すべてのデータを削除しますか？\nこの操作は取り消せません。')) {
            localStorage.removeItem(this.storageKey);
            return true;
        }
        return false;
    }

    // バックアップ作成
    createBackup() {
        const backupKey = `${this.storageKey}-backup-${Date.now()}`;
        const currentData = this.load();
        
        try {
            // 最新3つのバックアップのみ保持
            const backups = this.getBackupKeys();
            if (backups.length >= 3) {
                localStorage.removeItem(backups[0]);
            }
            
            localStorage.setItem(backupKey, JSON.stringify(currentData));
        } catch (error) {
            console.error('バックアップの作成に失敗しました:', error);
        }
    }

    // バックアップキー取得
    getBackupKeys() {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(`${this.storageKey}-backup-`)) {
                keys.push(key);
            }
        }
        return keys.sort();
    }

    // バックアップから復元
    restoreFromBackup(backupKey) {
        try {
            const backupData = localStorage.getItem(backupKey);
            if (backupData) {
                localStorage.setItem(this.storageKey, backupData);
                return true;
            }
        } catch (error) {
            console.error('バックアップからの復元に失敗しました:', error);
        }
        return false;
    }

    // 回答を追加
    addAnswer(questionId, value, type, traits) {
        const data = this.load();
        
        data.answers.push({
            questionId,
            value,
            type,
            traits,
            timestamp: Date.now()
        });
        
        data.answeredQuestions = data.answers.length;
        
        // 性格スコア更新
        if (type) {
            this.updatePersonalityScores(data, type, value);
        }
        
        if (traits) {
            traits.forEach(trait => {
                const score = (value - 3) * trait.weight;
                if (data.personalityScores[trait.name] !== undefined) {
                    data.personalityScores[trait.name] += score;
                }
            });
        }
        
        this.save(data);
    }

    // 性格スコア更新
    updatePersonalityScores(data, type, value) {
        const types = type.split('/');
        const score = (value - 3) * 2;
        
        if (score > 0) {
            data.personalityScores[types[0]] += Math.abs(score);
        } else if (score < 0) {
            data.personalityScores[types[1]] += Math.abs(score);
        }
    }

    // 仲間追加
    addPartyMember(character) {
        const data = this.load();
        
        data.partyMembers.push({
            ...character,
            acquiredAt: Date.now()
        });
        
        // totalPower削除済み
        
        this.save(data);
    }

    // プロンプト解放
    unlockPrompt(promptId, promptData) {
        const data = this.load();
        
        if (!data.unlockedPrompts.find(p => p.id === promptId)) {
            data.unlockedPrompts.push({
                id: promptId,
                ...promptData,
                unlockedAt: Date.now()
            });
            
            this.save(data);
        }
    }

    // アチーブメント達成
    unlockAchievement(achievementId, achievementData) {
        const data = this.load();
        
        if (!data.achievements.find(a => a.id === achievementId)) {
            data.achievements.push({
                id: achievementId,
                ...achievementData,
                unlockedAt: Date.now()
            });
            
            this.save(data);
            return true;
        }
        return false;
    }

    // MBTI計算と保存
    calculateAndSaveMBTI() {
        const data = this.load();
        const scores = data.personalityScores;
        
        let type = '';
        type += scores.E > scores.I ? 'E' : 'I';
        type += scores.S > scores.N ? 'S' : 'N';
        type += scores.T > scores.F ? 'T' : 'F';
        type += scores.J > scores.P ? 'J' : 'P';
        
        data.mbtiType = type;
        data.mbtiCalculated = true;
        
        this.save(data);
        return type;
    }

    // 統計情報取得
    getStatistics() {
        const data = this.load();
        
        return {
            progress: (data.answeredQuestions / data.totalQuestions) * 100,
            level: data.answeredQuestions + 1,
            totalPlayTime: data.totalPlayTime,
            averageAnswerValue: data.answers.length > 0 
                ? data.answers.reduce((sum, a) => sum + a.value, 0) / data.answers.length 
                : 0,
            strongestTrait: this.getStrongestTrait(data.personalityScores),
            partySize: data.partyMembers.length,
            // totalPowerとcoins削除済み
        };
    }

    // 最も強い特性を取得
    getStrongestTrait(scores) {
        let maxScore = 0;
        let strongestTrait = null;
        
        Object.entries(scores).forEach(([trait, score]) => {
            if (score > maxScore) {
                maxScore = score;
                strongestTrait = trait;
            }
        });
        
        return strongestTrait;
    }

    // データエクスポート（JSON形式）
    exportData() {
        const data = this.load();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `kimekiru-ai-save-${Date.now()}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
    }

    // データインポート
    importData(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    const validated = this.validateData(data);
                    this.save(validated);
                    resolve(true);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    // Stepプロンプト保存
    saveStepPrompt(stepNumber, promptData) {
        const data = this.load();
        if (!data.stepPrompts) {
            data.stepPrompts = [];
        }
        
        const existing = data.stepPrompts.find(p => p.stepNumber === stepNumber);
        if (existing) {
            Object.assign(existing, promptData);
        } else {
            data.stepPrompts.push({
                stepNumber,
                ...promptData,
                createdAt: Date.now()
            });
        }
        this.save(data);
    }

    // Stepプロンプト取得
    getStepPrompts() {
        const data = this.load();
        return data.stepPrompts || [];
    }
}

// シングルトンインスタンス
export const saveData = new SaveDataManager();