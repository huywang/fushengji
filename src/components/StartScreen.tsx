interface StartScreenProps {
  hasSave: boolean;
  onStart: () => void;
  onContinue: () => void;
}

export function StartScreen({ hasSave, onStart, onContinue }: StartScreenProps) {
  return (
    <main className="start-screen">
      <section className="start-copy">
        <p className="eyebrow">60 天文字策略生存游戏</p>
        <h1>北京浮生记：中年优化</h1>
        <p className="subtitle">
          39 岁，望京被裁。房贷 23800，孩子四年级，社保不能断。
          你住在回龙观，面试在西二旗，机会在中关村，焦虑在每个月 15 号准时扣款。
        </p>
        <div className="start-actions">
          <button className="primary" onClick={onStart}>开始新游戏</button>
          <button onClick={onContinue} disabled={!hasSave}>继续游戏</button>
        </div>
      </section>
      <section className="developer-note">
        <h2>开发者说明</h2>
        <p>
          游戏使用北京真实地名增强代入感，但人物、公司、金额、房贷、工资、房价和事件均为虚构与戏剧化调参。
          不代表现实数据，也不构成法律或金融建议。
        </p>
      </section>
    </main>
  );
}
