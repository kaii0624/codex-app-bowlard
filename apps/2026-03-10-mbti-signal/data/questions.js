// data/questions.js - 100問の性格診断質問

export const questions = [
    // Stage 1: 自己認識の門 (1-10)
    { id: 1, text: "大勢の人がいるパーティーでは、エネルギーを得る", type: "E/I", category: "社交性" },
    { id: 2, text: "予定は事前に詳細に計画することを好む", type: "J/P", category: "計画性" },
    { id: 3, text: "理論や概念よりも、具体的な事実を重視する", type: "S/N", category: "思考" },
    { id: 4, text: "決定を下す際は、論理よりも感情を優先する", type: "T/F", category: "判断" },
    { id: 5, text: "新しい環境や状況に素早く適応できる", type: "P/J", traits: [{name: "adaptability", weight: 1}] },
    { id: 6, text: "一人で過ごす時間が必要だと感じる", type: "I/E", category: "社交性" },
    { id: 7, text: "締切直前まで物事を先延ばしにすることがある", type: "P/J", category: "計画性" },
    { id: 8, text: "直感や第六感を信じて行動することが多い", type: "N/S", category: "思考" },
    { id: 9, text: "他人の感情に共感しやすい", type: "F/T", traits: [{name: "agreeableness", weight: 1}] },
    { id: 10, text: "リーダーシップを取ることに抵抗がない", type: "E/I", traits: [{name: "leadership", weight: 1}] },
    
    // Stage 2: 価値観の試練 (11-20)
    { id: 11, text: "ルールや規則を守ることは重要だと思う", type: "J/P", traits: [{name: "conscientiousness", weight: 1}] },
    { id: 12, text: "議論や討論を楽しむことができる", type: "T/F", category: "コミュニケーション" },
    { id: 13, text: "芸術や創造的な活動に興味がある", type: "N/S", traits: [{name: "creativity", weight: 1}] },
    { id: 14, text: "グループでの作業よりも個人作業を好む", type: "I/E", category: "協働" },
    { id: 15, text: "変化や新しいことにワクワクする", type: "P/J", traits: [{name: "openness", weight: 1}] },
    { id: 16, text: "人との対立を避ける傾向がある", type: "F/T", category: "対人関係" },
    { id: 17, text: "詳細よりも全体像を把握することを重視する", type: "N/S", category: "認知" },
    { id: 18, text: "人前で話すことに自信がある", type: "E/I", traits: [{name: "extraversion", weight: 1}] },
    { id: 19, text: "タスクリストを作って管理することが多い", type: "J/P", category: "組織力" },
    { id: 20, text: "チームの和を保つことを重視する", type: "F/T", traits: [{name: "teamwork", weight: 1}] },
    
    // Stage 3: 決断の岐路 (21-30)
    { id: 21, text: "リスクを取ることを恐れない", type: "P/J", traits: [{name: "openness", weight: 0.8}] },
    { id: 22, text: "データや証拠に基づいて判断する", type: "T/F", traits: [{name: "analytical", weight: 1}] },
    { id: 23, text: "未来の可能性について考えることが好き", type: "N/S", category: "視点" },
    { id: 24, text: "静かな環境で集中して作業することを好む", type: "I/E", category: "環境" },
    { id: 25, text: "柔軟性を持って対応することが得意", type: "P/J", traits: [{name: "adaptability", weight: 0.8}] },
    { id: 26, text: "公平性や正義を重要視する", type: "T/F", category: "価値観" },
    { id: 27, text: "実用的な解決策を見つけることが得意", type: "S/N", category: "問題解決" },
    { id: 28, text: "新しい人と出会うことを楽しむ", type: "E/I", traits: [{name: "extraversion", weight: 0.8}] },
    { id: 29, text: "期限を守ることにストレスを感じない", type: "J/P", traits: [{name: "conscientiousness", weight: 0.8}] },
    { id: 30, text: "他人の意見を尊重し、取り入れる", type: "F/T", traits: [{name: "agreeableness", weight: 0.8}] },
    
    // Stage 4: 創造の泉 (31-40)
    { id: 31, text: "アイデアを形にすることが得意", type: "N/S", traits: [{name: "creativity", weight: 1.2}] },
    { id: 32, text: "独創的な解決策を思いつくことが多い", type: "N/S", traits: [{name: "creativity", weight: 1}] },
    { id: 33, text: "既存の方法を改善することを好む", type: "S/N", category: "イノベーション" },
    { id: 34, text: "ブレインストーミングが好き", type: "E/I", traits: [{name: "creativity", weight: 0.6}] },
    { id: 35, text: "実験的なアプローチを取ることがある", type: "P/J", traits: [{name: "openness", weight: 0.7}] },
    { id: 36, text: "論理的な一貫性を重視する", type: "T/F", traits: [{name: "analytical", weight: 0.8}] },
    { id: 37, text: "抽象的な概念を理解するのが得意", type: "N/S", category: "認知" },
    { id: 38, text: "グループディスカッションで活発に発言する", type: "E/I", category: "コミュニケーション" },
    { id: 39, text: "プロジェクトを最後まで完遂する", type: "J/P", traits: [{name: "conscientiousness", weight: 1}] },
    { id: 40, text: "感情的な知性が高いと思う", type: "F/T", traits: [{name: "agreeableness", weight: 0.7}] },
    
    // Stage 5: 共感の橋 (41-50)
    { id: 41, text: "他人の立場に立って考えることができる", type: "F/T", traits: [{name: "agreeableness", weight: 1.2}] },
    { id: 42, text: "感情を言葉で表現することが得意", type: "F/T", category: "感情表現" },
    { id: 43, text: "人の微妙な感情の変化に気づく", type: "F/T", traits: [{name: "agreeableness", weight: 1}] },
    { id: 44, text: "深い人間関係を築くことを重視する", type: "I/E", category: "関係性" },
    { id: 45, text: "状況に応じて柔軟に対応できる", type: "P/J", traits: [{name: "adaptability", weight: 1}] },
    { id: 46, text: "客観的な分析を重視する", type: "T/F", traits: [{name: "analytical", weight: 1}] },
    { id: 47, text: "パターンや関連性を見つけるのが得意", type: "N/S", category: "パターン認識" },
    { id: 48, text: "社交的なイベントを企画することが好き", type: "E/I", traits: [{name: "extraversion", weight: 1}] },
    { id: 49, text: "長期的な計画を立てることが得意", type: "J/P", category: "計画" },
    { id: 50, text: "チーム内の調和を保つ役割を担う", type: "F/T", traits: [{name: "teamwork", weight: 1.2}] },
    
    // Stage 6: 繋がりの網 (51-60)
    { id: 51, text: "ネットワーキングが得意", type: "E/I", traits: [{name: "extraversion", weight: 1.2}] },
    { id: 52, text: "人と人を繋げることが好き", type: "E/I", traits: [{name: "teamwork", weight: 1}] },
    { id: 53, text: "コラボレーションを重視する", type: "F/T", traits: [{name: "teamwork", weight: 1}] },
    { id: 54, text: "一対一の深い会話を好む", type: "I/E", category: "コミュニケーション" },
    { id: 55, text: "新しい出会いや経験に開かれている", type: "P/J", traits: [{name: "openness", weight: 1}] },
    { id: 56, text: "効率性を最優先に考える", type: "T/F", traits: [{name: "analytical", weight: 0.8}] },
    { id: 57, text: "ビジョンや理想を追求する", type: "N/S", category: "志向" },
    { id: 58, text: "グループの中心にいることが多い", type: "E/I", traits: [{name: "leadership", weight: 0.8}] },
    { id: 59, text: "整理整頓が得意", type: "J/P", traits: [{name: "conscientiousness", weight: 0.8}] },
    { id: 60, text: "人間関係の維持に努力する", type: "F/T", traits: [{name: "agreeableness", weight: 0.8}] },
    
    // Stage 7: 信頼の砦 (61-70)
    { id: 61, text: "約束を守ることを最重要視する", traits: [{name: "conscientiousness", weight: 1.5}] },
    { id: 62, text: "長期的な関係を大切にする", type: "J/P", category: "関係性" },
    { id: 63, text: "信頼関係の構築に時間をかける", type: "I/E", category: "信頼" },
    { id: 64, text: "一貫性のある行動を心がける", type: "J/P", traits: [{name: "conscientiousness", weight: 1}] },
    { id: 65, text: "変化を受け入れることができる", type: "P/J", traits: [{name: "adaptability", weight: 0.8}] },
    { id: 66, text: "論理的な議論を好む", type: "T/F", traits: [{name: "analytical", weight: 0.8}] },
    { id: 67, text: "将来の可能性を探求する", type: "N/S", category: "探求" },
    { id: 68, text: "人前でのプレゼンテーションが得意", type: "E/I", traits: [{name: "extraversion", weight: 0.8}] },
    { id: 69, text: "目標達成に向けて着実に進む", type: "J/P", traits: [{name: "conscientiousness", weight: 1}] },
    { id: 70, text: "他者への配慮を忘れない", type: "F/T", traits: [{name: "agreeableness", weight: 0.8}] },
    
    // Stage 8: 導きの星 (71-80)
    { id: 71, text: "方向性を示すことが得意", traits: [{name: "leadership", weight: 1.5}] },
    { id: 72, text: "長期的なビジョンを持っている", type: "N/S", traits: [{name: "leadership", weight: 1}] },
    { id: 73, text: "段階的なアプローチを好む", type: "J/P", category: "戦略" },
    { id: 74, text: "メンターとしての役割を楽しむ", type: "E/I", traits: [{name: "leadership", weight: 0.8}] },
    { id: 75, text: "柔軟な計画変更ができる", type: "P/J", traits: [{name: "adaptability", weight: 1}] },
    { id: 76, text: "データに基づいた決定を下す", type: "T/F", traits: [{name: "analytical", weight: 1}] },
    { id: 77, text: "革新的なアイデアを生み出す", type: "N/S", traits: [{name: "creativity", weight: 0.8}] },
    { id: 78, text: "チームを鼓舞することができる", type: "E/I", traits: [{name: "leadership", weight: 1}] },
    { id: 79, text: "プロセスを重視する", type: "J/P", category: "アプローチ" },
    { id: 80, text: "共感的なリーダーシップを発揮する", type: "F/T", traits: [{name: "leadership", weight: 0.8}] },
    
    // Stage 9: 透明性の鏡 (81-90)
    { id: 81, text: "自分の考えを明確に説明できる", traits: [{name: "analytical", weight: 1}] },
    { id: 82, text: "フィードバックを積極的に求める", type: "E/I", category: "成長" },
    { id: 83, text: "透明性を重視する", type: "T/F", category: "価値観" },
    { id: 84, text: "自己反省を定期的に行う", type: "I/E", category: "内省" },
    { id: 85, text: "新しい視点を取り入れる", type: "P/J", traits: [{name: "openness", weight: 1}] },
    { id: 86, text: "根拠に基づいた主張をする", type: "T/F", traits: [{name: "analytical", weight: 1}] },
    { id: 87, text: "大局的な視点を持つ", type: "N/S", category: "視野" },
    { id: 88, text: "オープンなコミュニケーションを好む", type: "E/I", category: "コミュニケーション" },
    { id: 89, text: "計画的に物事を進める", type: "J/P", traits: [{name: "conscientiousness", weight: 0.8}] },
    { id: 90, text: "他者の成長を支援する", type: "F/T", traits: [{name: "agreeableness", weight: 1}] },
    
    // Stage 10: 統合の頂 (91-100)
    { id: 91, text: "複雑な問題を単純化できる", traits: [{name: "analytical", weight: 1.2}] },
    { id: 92, text: "多様な視点を統合できる", traits: [{name: "leadership", weight: 1}] },
    { id: 93, text: "バランスの取れた判断ができる", type: "T/F", category: "判断" },
    { id: 94, text: "内省と行動のバランスが取れている", type: "I/E", category: "バランス" },
    { id: 95, text: "状況に応じて柔軟に対応する", type: "P/J", traits: [{name: "adaptability", weight: 1.2}] },
    { id: 96, text: "論理と感情のバランスを保つ", type: "T/F", category: "バランス" },
    { id: 97, text: "ビジョンと実行力を兼ね備える", type: "N/S", traits: [{name: "leadership", weight: 1}] },
    { id: 98, text: "個人とチームの両方で成果を出せる", type: "E/I", traits: [{name: "teamwork", weight: 1}] },
    { id: 99, text: "長期と短期の目標を両立させる", type: "J/P", traits: [{name: "conscientiousness", weight: 1}] },
    { id: 100, text: "自己成長と他者支援を両立する", type: "F/T", traits: [{name: "agreeableness", weight: 1}] }
];