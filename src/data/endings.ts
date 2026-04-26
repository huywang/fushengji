import type { Ending, GameState } from "../engine/types";

export const endings: Ending[] = [
  {
    id: "ending_critical_collapse",
    title: "临界值崩溃",
    conditionDescription: "任一核心资源触碰临界值。",
    body: "某个核心指标触碰了临界值。北京没有突然变坏，只是你的缓冲区先耗尽了。",
    statsSummary: ["核心资源触线。", "游戏提前结束。"],
  },
  {
    id: "ending_collapse_dignity",
    title: "体面破产",
    conditionDescription: "持续隐瞒、家庭信任跌破 35、房贷压力高于 85。",
    body: "你继续假装一切正常。直到信用卡、房贷、补课费在同一周同时到来。你终于明白：体面不是免费的。它只是延期扣款。",
    statsSummary: ["体面没有消失，它变成了账单。", "家庭需要真相，不需要演技。"],
  },
  {
    id: "ending_financial_crash",
    title: "财务崩盘",
    conditionDescription: "可用现金小于 0，房贷压力高于 90。",
    body: "你把每一个能周转的按钮都按了一遍。最后系统没有骂你，只是冷静地显示：余额不足。成年人的崩盘，常常没有背景音乐。",
    statsSummary: ["现金流断裂。", "债务开始接管选择权。"],
  },
  {
    id: "ending_family_together",
    title: "家庭共同扛",
    conditionDescription: "伴侣知道失业、做过现金流会议、家庭信任不低于 65。",
    body: "你和伴侣列了一张表。停掉两个补课班，减少外卖，赎回亏损基金。那张表不好看。但它第一次不像谎言。",
    statsSummary: ["家庭信任成为缓冲垫。", "现金流难看，但透明。"],
  },
  {
    id: "ending_job_lower_salary",
    title: "降薪保房",
    conditionDescription: "求职路线不低于 35，职业自信不低于 35，房贷压力不高于 85。",
    body: "你接受了一份月薪低很多的工作。工资不体面。但房贷体面地扣上了。你不知道这是上岸，还是换了一种溺水姿势。",
    statsSummary: ["职业路径暂时延续。", "收入下降，风险下降得更慢。"],
  },
  {
    id: "ending_freelance_survive",
    title: "自由职业撑住",
    conditionDescription: "自由职业路线不低于 35，可用现金大于一个月房贷，健康高于 35。",
    body: "你没有重新属于任何公司。但你也没有立刻沉下去。三个外包，一个顾问单，两个还没付尾款的甲方。自由职业的重点不是自由，是职业。",
    statsSummary: ["现金流开始多点来源。", "健康和尾款都需要盯住。"],
  },
  {
    id: "ending_self_media",
    title: "流量人生开端",
    conditionDescription: "自媒体路线不低于 35，自媒体技能不低于 20。",
    body: "你靠一条《39岁被裁，我在13号线上想明白了》涨了第一波粉。有人说你懂中年人，有人说你卖惨。你开始怀疑：自己是在走出困境，还是在表演困境。",
    statsSummary: ["表达变成了入口。", "流量不能直接抵扣房贷，但可以换来机会。"],
  },
  {
    id: "ending_beijing_defense",
    title: "北京保卫战",
    conditionDescription: "默认兜底，可用现金大于 0，家庭信任不低于 40。",
    body: "你没有找到工作。但你找到了三个可能的机会。房贷还在。北京还在。你也还在。这不叫胜利。但叫没有被清退。",
    statsSummary: ["还没有上岸。", "但你仍在牌桌上。"],
  },
  {
    id: "ending_sell_house_countdown",
    title: "卖房倒计时",
    conditionDescription: "房贷压力高于 90，北京归属感低于 35，离京路线不低于 25。",
    body: "你把房子挂到了中介平台。挂牌价比买入价低了 90 万。中介说：“哥，现在市场就这样。”市场两个字，终于轮到你来承受。",
    statsSummary: ["北京归属感快速下降。", "房子从锚点变成问题。"],
  },
  {
    id: "ending_leave_beijing",
    title: "准备离京",
    conditionDescription: "离京路线不低于 35，北京归属感低于 30。",
    body: "你打开 12306，看着去老家的车次。每一个目的地都像一种人生备选方案。回老家不一定失败。但你还没准备好承认它是选项。",
    statsSummary: ["退路开始具体。", "离开不等于失败，留下也不等于胜利。"],
  },
];

export function evaluateEnding(state: GameState): Ending {
  const { player, routeScores, flags } = state;
  const has = (key: string) => Boolean(flags[key]);

  if (flags.collapse_reason) {
    return endings[0];
  }
  if (has("hiding_unemployment") && player.familyTrust < 35 && player.mortgagePressure > 85) {
    return endings[1];
  }
  if (player.availableCash < 0 && player.mortgagePressure > 90) {
    return endings[2];
  }
  if (has("spouse_knows_unemployed") && has("cashflow_meeting_done") && player.familyTrust >= 65) {
    return endings[3];
  }
  if (routeScores.job >= 35 && player.careerConfidence >= 35 && player.mortgagePressure <= 85) {
    return endings[4];
  }
  if (routeScores.freelance >= 35 && player.availableCash > player.monthlyMortgage && player.health > 35) {
    return endings[5];
  }
  if (routeScores.selfMedia >= 35 && player.skills.selfMedia >= 20) {
    return endings[6];
  }
  if (player.mortgagePressure > 90 && player.beijingBelonging < 35 && routeScores.leaveBeijing >= 25) {
    return endings[8];
  }
  if (routeScores.leaveBeijing >= 35 && player.beijingBelonging < 30) {
    return endings[9];
  }
  return endings[7];
}
