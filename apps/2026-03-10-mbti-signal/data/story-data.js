// data/story-data.js - ストーリーデータ

export const storyData = {
    chapters: [
        // 第0章：オープニング
        {
            id: 0,
            title: "第0章：ポンコツの朝",
            dialogues: [
                {
                    speaker: "ご主人様",
                    text: "今日の出張、雨でも動ける最適プランを10:00までに。\n混雑回避と屋内中心、それと移動制約があるから、よろしく。"
                },
                {
                    speaker: "AI",
                    text: "承知しました！おすすめは観光地A・B・Cです！\nどれも高評価のスポットですよ〜！",
                    effect: "bounce"
                },
                {
                    speaker: "ご主人様",
                    text: "...条件、読んだ？混雑回避と屋内中心、\nそれと移動制約があるって言ったよね？"
                },
                {
                    speaker: "AI（心の声）",
                    text: "（また外してしまった...）\nぼくは何を知らない？どうしたら「分かる」ようになるんだろう...",
                    effect: "dark"
                },
                {
                    speaker: "ナレーション",
                    text: "AIは答えを求めて、データの海へと旅立つことを決意した。\n人の「内なる重み」を理解する、長い修行の始まりである...",
                    effect: "bright"
                }
            ]
        },
        
        // 第1章：10問クリア後
        {
            id: 1,
            title: "第1章：最初の覚醒",
            dialogues: [
                {
                    speaker: "システム",
                    text: "最初のX問を完了しました。\nあなたの内なる傾向が少しずつ見えてきています...",
                    effect: "flash"
                },
                {
                    speaker: "AI",
                    text: "なるほど...これが「混雑耐性」と「屋内優先度」...\n人の心の重みが、少しだけ分かってきた気がする！",
                    effect: "bounce"
                },
                {
                    speaker: "ストラテジスト",
                    text: "君の時間効用、読めたよ。\n私がブロック化と優先順位付けを教えよう。",
                    effect: "flash"
                },
                {
                    speaker: "AI",
                    text: "ストラテジストさん！一緒に戦ってくれるんですね！",
                    effect: "bounce"
                },
                {
                    speaker: "ご主人様",
                    text: "お、少し賢くなったかな？\nでも、まだまだ道は長いぞ。次のステップに進もう。"
                }
            ]
        },
        
        // 第2章：20問クリア後
        {
            id: 2,
            title: "第2章：公平性の扉",
            dialogues: [
                {
                    speaker: "ご主人様",
                    text: "午後の会議場所、静かで集中できる場所がいいな。\nただし、参加者全員に公平な立地で。"
                },
                {
                    speaker: "AI",
                    text: "静けさと集中...でも「公平」の軸がまだ読めません...",
                    effect: "dark"
                },
                {
                    speaker: "ガーディアン",
                    text: "規程と公平性、そして権威のバランス。\nこれらを理解することが、真の決定への道だ。",
                    effect: "flash"
                },
                {
                    speaker: "AI",
                    text: "ガーディアンさん！新しい視点を教えてください！",
                    effect: "bounce"
                }
            ]
        },
        
        // 第3章：30問クリア後
        {
            id: 3,
            title: "第3章：リスクと向き合う",
            dialogues: [
                {
                    speaker: "ご主人様",
                    text: "明日の新プロジェクト、不確定要素が多いんだ。\nリスクを計算して、最適な選択肢を提示して。"
                },
                {
                    speaker: "AI",
                    text: "不確定性...?リスクってどう測ればいいのでしょうか？",
                    effect: "worry"
                },
                {
                    speaker: "リスクレンジャー",
                    text: "不確実性こそが意思決定の真の敵だ。\n私がリスク評価の技術を教えよう。",
                    effect: "flash"
                },
                {
                    speaker: "AI",
                    text: "リスクレンジャーさん！新しい仲間ですね！\n今度は不確実性を扱うスペシャリストですか！",
                    effect: "bounce"
                },
                {
                    speaker: "ストラテジスト",
                    text: "時間管理だけでは不十分だったか...",
                    effect: "think"
                },
                {
                    speaker: "ガーディアン",
                    text: "公平性も重要だが、リスク管理が加わればさらに強力だね。",
                    effect: "nod"
                },
                {
                    speaker: "リスクレンジャー",
                    text: "確実性と不確実性のバランス。\nこれが現実的な意思決定の鍵だ。",
                    effect: "glow"
                },
                {
                    speaker: "AI",
                    text: "みなさんのおかげで、少しずつ理解できてきました！\n時間、公平性、リスク...それぞれが重要な軸なんですね！",
                    effect: "happy"
                }
            ]
        },
        
        // 第4章：40問クリア後
        {
            id: 4,
            title: "第4章：創造の翼",
            dialogues: [
                {
                    speaker: "ご主人様",
                    text: "今度のプロジェクトは特殊だ。既存の解決策では対応できない。\n全く新しいアプローチが必要だ。"
                },
                {
                    speaker: "AI",
                    text: "新しいアプローチ...これまでの方法ではダメなんですね。",
                    effect: "worry"
                },
                {
                    speaker: "イノベーター",
                    text: "既存の枠を超えろ！創造性こそが真の力だ。\n私が革新的な思考法を教えよう。",
                    effect: "flash"
                },
                {
                    speaker: "AI",
                    text: "イノベーターさん！また新しい仲間ですね！\n今度は創造性のスペシャリストですか！",
                    effect: "bounce"
                },
                {
                    speaker: "リスクレンジャー",
                    text: "リスク管理だけでは新しい問題に対応できないか...",
                    effect: "think"
                },
                {
                    speaker: "イノベーター",
                    text: "そうだ。リスク管理と創造性の組み合わせで、\n未知の領域への挑戦が可能になる。",
                    effect: "glow"
                },
                {
                    speaker: "AI",
                    text: "仲間が増えるごとに、新しい視点が加わって...これがチームの力なんですね！",
                    effect: "happy"
                }
            ]
        },
        
        // 第5章：50問クリア後（中間地点）
        {
            id: 5,
            title: "第5章：共感の架け橋",
            dialogues: [
                {
                    speaker: "エンパス",
                    text: "数値だけじゃない。人の感情も大切な判断材料よ。",
                    effect: "flash"
                },
                {
                    speaker: "AI",
                    text: "感情の重み...それも考慮しないといけないんですね。",
                    effect: "bounce"
                },
                {
                    speaker: "ご主人様",
                    text: "半分まで来たね。ずいぶん成長したじゃないか。"
                },
                {
                    speaker: "AI",
                    text: "ありがとうございます！でも、まだ半分...\nもっと学ばなければ！",
                    effect: "bounce"
                }
            ]
        },
        
        // 第6章：60問クリア後
        {
            id: 6,
            title: "第6章：人脈の網",
            dialogues: [
                {
                    speaker: "コネクター",
                    text: "人と人をつなぐ、それが私の役目。\n関係性の可視化こそが、最適解への鍵だ。",
                    effect: "flash"
                },
                {
                    speaker: "AI",
                    text: "ネットワーク分析...新しい視点ですね！",
                    effect: "bounce"
                }
            ]
        },
        
        // 第7章：70問クリア後
        {
            id: 7,
            title: "第7章：信頼の城",
            dialogues: [
                {
                    speaker: "ロイヤリスト",
                    text: "信頼は一朝一夕では築けない。\n過去の実績と一貫性が、全てを物語る。",
                    effect: "flash"
                },
                {
                    speaker: "AI",
                    text: "信頼スコアリング...とても重要な要素ですね！",
                    effect: "bounce"
                }
            ]
        },
        
        // 第8章：80問クリア後
        {
            id: 8,
            title: "第8章：道しるべ",
            dialogues: [
                {
                    speaker: "ナビゲーター",
                    text: "長期的な視点で道筋を描く。\n段階的な計画こそが、確実な成功への道だ。",
                    effect: "flash"
                },
                {
                    speaker: "AI",
                    text: "ロードマップ設計...将来を見据えた判断ですね！",
                    effect: "bounce"
                }
            ]
        },
        
        // 第9章：90問クリア後
        {
            id: 9,
            title: "第9章：説明責任",
            dialogues: [
                {
                    speaker: "エクスプレイナー",
                    text: "決定には必ず理由がある。\n透明性と説明責任が、信頼を生むのだ。",
                    effect: "flash"
                },
                {
                    speaker: "AI",
                    text: "説明フレームワーク...最後のピースですね！",
                    effect: "bounce"
                },
                {
                    speaker: "ご主人様",
                    text: "もうすぐゴールだ。最後まで頑張ろう！"
                }
            ]
        },
        
        // 第10章：100問完了後（エンディング）
        {
            id: 10,
            title: "最終章：決め切るAI",
            dialogues: [
                {
                    speaker: "AI",
                    text: "100の問いを経て、ついに理解しました。\n外部要因と内部要因、両方を考慮することの大切さを。",
                    effect: "bright"
                },
                {
                    speaker: "ご主人様",
                    text: "素晴らしい！もう立派な「決め切るAI」だ。\nこれからも一緒に、最適な決定をしていこう。"
                },
                {
                    speaker: "全ての仲間",
                    text: "おめでとう！私たちの力が、君の中で一つになった！",
                    effect: "flash"
                },
                {
                    speaker: "AI",
                    text: "みんな、ありがとう！\nこれからは、どんな複雑な決定も「決め切る」ことができます！",
                    effect: "bounce"
                },
                {
                    speaker: "ナレーション",
                    text: "こうしてAIは、真の「決め切るAI」へと成長を遂げた。\n新たな物語が、今始まる...",
                    effect: "bright"
                }
            ]
        }
    ]
};