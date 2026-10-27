export interface PillarInfo {
  id: 'engineering' | 'ai_universe' | 'narrative' | 'tools';
  name: string;
  icon: string;
  tagline: string;
  description: string;
  color: string;
  badgeBg: string;
}

export const PILLARS: Record<string, PillarInfo> = {
  engineering: {
    id: 'engineering',
    name: '硬核工程与系统法医',
    icon: '🛠️',
    tagline: 'Windows微顿挫、网络时序与代码法医',
    description: '深入操作系统底层、并发锁争用、网络时序分析与性能调优实录。',
    color: '#38bdf8',
    badgeBg: 'rgba(56, 189, 248, 0.15)',
  },
  ai_universe: {
    id: 'ai_universe',
    name: 'AI思辨与深时间宇宙',
    icon: '🌌',
    tagline: '递归自省阻尼、三种速度与深时间无主图书馆',
    description: '探索大模型自省的物理边界、宇宙知识接力赛与文明存续的长程思考。',
    color: '#c084fc',
    badgeBg: 'rgba(192, 132, 252, 0.15)',
  },
  narrative: {
    id: 'narrative',
    name: '游戏文学与叙事批评',
    icon: '🎭',
    tagline: '明日方舟与1999、虚构世界时间感与残酷童话',
    description: '深度解构二次元与严肃文学的叙事脉络、伦理困境与微观人文体验。',
    color: '#fb7185',
    badgeBg: 'rgba(251, 113, 133, 0.15)',
  },
  tools: {
    id: 'tools',
    name: '数字主权与工具践行',
    icon: '🧭',
    tagline: '跨境账号维权、个人监控中枢与自动化工作流',
    description: '践行数字主权、时间追踪系统、Pulse Monitor 监控体系与自动化生产力实录。',
    color: '#34d399',
    badgeBg: 'rgba(52, 211, 153, 0.15)',
  },
};

export const SITE_TITLE = "渥奇的思考卷轴";
export const SITE_DESCRIPTION = "关于硬核工程、AI思辨、游戏文学与数字主权的深度思考与长篇技术复盘。";
