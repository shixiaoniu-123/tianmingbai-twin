import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const stages = [
  { id: 'emergence', name: '出苗', height: 0.52, density: 0.56, color: '#82a86b' },
  { id: 'tillering', name: '分蘖', height: 0.76, density: 0.82, color: '#397653' },
  { id: 'overwintering', name: '越冬', height: 0.64, density: 0.72, color: '#567254' },
  { id: 'regreening', name: '返青', height: 0.94, density: 1, color: '#4f8d5d' },
  { id: 'jointing', name: '拔节', height: 1.02, density: 0.96, color: '#60945a' },
  { id: 'mature', name: '成熟', height: 1.08, density: 1, color: '#c39a45' }
];

const cropProfiles = {
  wheat: {
    name: '冬小麦',
    short: '小麦',
    stageLabels: ['出苗', '分蘖', '越冬', '返青', '拔节', '成熟'],
    stageDays: [12, 45, 120, 160, 205, Infinity],
    heightScale: 1,
    densityScale: 1,
    color: '#397653',
    guidance: '冬小麦先看苗情、墒情和天气窗口，具体水肥管理按品种、播期和当地农技指导。'
  },
  rice: {
    name: '水稻',
    short: '水稻',
    stageLabels: ['出苗', '分蘖', '拔节', '抽穗', '灌浆', '成熟'],
    stageDays: [10, 35, 60, 85, 115, Infinity],
    heightScale: 0.78,
    densityScale: 0.88,
    color: '#4b8a57',
    paddy: true,
    guidance: '水稻先看水层、田埂和排水口，具体晒田、灌水时间按栽培方式和当地农技指导。'
  },
  corn: {
    name: '夏玉米',
    short: '玉米',
    stageLabels: ['出苗', '苗期', '拔节', '抽雄', '灌浆', '成熟'],
    stageDays: [10, 30, 55, 75, 105, Infinity],
    heightScale: 1.34,
    densityScale: 0.62,
    color: '#5f934d',
    guidance: '玉米先看苗齐、倒伏和根区墒情，大风后不要只看叶片，还要看根和茎。'
  },
  soybean: {
    name: '大豆',
    short: '大豆',
    stageLabels: ['出苗', '分枝', '开花', '结荚', '鼓粒', '成熟'],
    stageDays: [10, 30, 52, 76, 102, Infinity],
    heightScale: 0.68,
    densityScale: 0.78,
    color: '#3e8055',
    guidance: '大豆先看出苗均匀度、花期长势和结荚情况，异常持续时拍照并联系农技员。'
  },
  cotton: {
    name: '棉花',
    short: '棉花',
    stageLabels: ['出苗', '苗期', '现蕾', '花铃', '吐絮', '采收'],
    stageDays: [12, 35, 58, 88, 125, Infinity],
    heightScale: 1.08,
    densityScale: 0.7,
    color: '#517f50',
    guidance: '棉花先看苗情、蕾铃和风后倒伏，具体化控与水肥安排按当地种植模式执行。'
  },
  other: {
    name: '其他作物',
    short: '作物',
    stageLabels: ['出苗', '苗期', '旺长', '关键期', '成熟前', '成熟'],
    stageDays: [12, 35, 60, 90, 120, Infinity],
    heightScale: 0.88,
    densityScale: 0.8,
    color: '#4d8758',
    guidance: '请先核对作物和播期。缺少作物资料时，系统只做通用巡田提示，不提供诊断和用药建议。'
  }
};

const zoneTagProfiles = {
  weak: { role: 'north-weak', label: '苗情偏弱', short: '弱苗', note: '苗情偏弱，降温和风后优先查看。', vigor: '偏弱', moisture: '正常' },
  low: { role: 'east-low', label: '地势低洼', short: '低洼', note: '地势偏低，降雨时优先检查排水。', vigor: '正常', moisture: '偏湿' },
  canal: { role: 'south-field', label: '靠近渠边', short: '近渠', note: '靠近灌渠，关注渠水倒灌和地头作业安全。', vigor: '正常', moisture: '正常' },
  dry: { role: 'center-normal', label: '容易偏干', short: '易旱', note: '容易出现表土偏干，补水前先挖土确认墒情。', vigor: '正常', moisture: '偏干' },
  control: { role: 'north-east', label: '正常对照', short: '对照', note: '作为正常对照区，与问题区域一起比较。', vigor: '正常', moisture: '正常' },
  general: { role: 'west-normal', label: '一般管理', short: '一般', note: '按普通巡田顺序管理，出现异常再重点查看。', vigor: '正常', moisture: '正常' }
};

const weathers = {
  normal: {
    name: '雨前巡查',
    temp: '14~22℃',
    wind: '3级',
    seal: '预报有雨',
    sky: ['#c8ddd9', '#e6ead5', '#d5c5a4'],
    fog: 0xd5dfd2,
    sun: 2.7,
    hemi: 1.75,
    water: 0.62,
    health: '低洼区先看排水',
    summary: '演示将“未来短时降雨”作为判断条件，不表示已接入实时气象站。',
    level: '先查看',
    title: '先看东侧低洼区',
    reason: '未来 24 小时有短时降雨。东侧地块偏低，先确认排水沟通畅，再安排其他农事。',
    evidence: '天气预报 + 地块低洼标记 + 当前分蘖期。用于业务演示，实际以现场和农技员判断为准。',
    risks: { 'east-low': 'watch', 'north-weak': 'watch' },
    zoneHints: {
      'east-low': '雨前先看地头排水口，雨后回来复查是否积水。',
      'north-weak': '苗情偏弱，降雨前后都建议顺路看一眼叶片和根系。'
    },
    actions: [
      ['先看', '东侧地块是否已经积水'],
      ['再做', '清理地头排水口，拍一张沟渠照片'],
      ['不急着', '全田灌水，雨后再看墒情']
    ]
  },
  cold: {
    name: '强降温',
    temp: '2~9℃',
    wind: '4级',
    seal: '降温',
    sky: ['#b8cdd9', '#dfe5e2', '#d5cbb8'],
    fog: 0xcbd7dc,
    sun: 1.8,
    hemi: 1.55,
    water: 0.62,
    health: '北侧弱苗重点复核',
    summary: '降温只改变演示状态，不代表已监测真实叶温。',
    level: '重点看',
    title: '傍晚前看北侧弱苗',
    reason: '弱苗抗寒能力更差。傍晚前到北侧看叶片是否发紫、发黄，避免只凭天气温度做判断。',
    evidence: '降温预报 + 北侧苗情偏弱 + 分蘖期参考。异常持续时请拍照并联系当地农技员。',
    risks: { 'north-weak': 'risk', 'west-normal': 'watch' },
    zoneHints: {
      'north-weak': '傍晚前重点看叶片颜色、贴地长势和土壤是否过湿。',
      'west-normal': '靠近气象站周边，作为全田对照区域一起查看。'
    },
    actions: [
      ['先看', '北侧弱苗叶片是否发紫、发黄'],
      ['暂缓', '降温前后的喷施和大量灌水'],
      ['拍照记录', '持续异常时联系当地农技员']
    ]
  },
  rain: {
    name: '连续降雨',
    temp: '12~16℃',
    wind: '3级',
    seal: '连雨',
    sky: ['#aebfc7', '#d8e1df', '#c9c0ad'],
    fog: 0xbecbd0,
    sun: 1.5,
    hemi: 1.55,
    water: 0.9,
    health: '先查排水与渠水',
    summary: '连雨会放大低洼区风险，水渠和地表仅用于说明空间关系。',
    level: '优先处置',
    title: '雨停后先查排水沟',
    reason: '东侧低洼区与南侧灌渠距离近。先确认沟渠通畅，再判断是否需要人工排水。',
    evidence: '连续降雨场景 + 东侧低洼标记 + 灌渠空间关系。演示数据不代替现场水位判断。',
    risks: { 'east-low': 'risk', 'south-field': 'risk', 'north-weak': 'watch' },
    zoneHints: {
      'east-low': '低洼区优先检查积水深度和排水口是否被秸秆、泥土堵住。',
      'south-field': '靠近灌渠，需同时查看渠水高度和地头是否倒灌。',
      'north-weak': '弱苗区受渍害后恢复慢，雨后一起复查。'
    },
    actions: [
      ['先看', '东侧地头排水口是否堵塞'],
      ['再查', '南侧灌渠水位是否接近田面'],
      ['记录', '拍下积水位置和沟渠状态']
    ]
  },
  wind: {
    name: '大风',
    temp: '8~17℃',
    wind: '6级',
    seal: '大风',
    sky: ['#dddccf', '#eee8d8', '#d8c8aa'],
    fog: 0xd8d6c9,
    sun: 2.4,
    hemi: 1.9,
    water: 0.52,
    health: '地头作业先顺延',
    summary: '大风天气先保证人和作业安全，再查看弱苗和倒伏。',
    level: '避开风口',
    title: '先停喷施，再查地头',
    reason: '当前演示风力 6 级。喷施容易漂移，地头和高秆区域也更需要检查。',
    evidence: '大风预报 + 弱苗区位置 + 地头作业区。实际操作请服从当地安全提示。',
    risks: { 'north-weak': 'watch', 'south-field': 'watch' },
    zoneHints: {
      'north-weak': '风后检查叶片折损和根系松动，弱苗优先。',
      'south-field': '地头是进出风口，查看是否有倒伏或覆盖物被吹散。'
    },
    actions: [
      ['暂停', '喷施等容易漂移的农事作业'],
      ['顺路看', '北侧弱苗和南侧地头'],
      ['记下来', '倒伏位置与发生时间']
    ]
  },
  drought: {
    name: '干旱',
    temp: '20~31℃',
    wind: '2级',
    seal: '偏干',
    sky: ['#e8dec7', '#f2ead7', '#d8c5a2'],
    fog: 0xe4dcc7,
    sun: 3.25,
    hemi: 1.75,
    water: 0.2,
    health: '先查墒情再补水',
    summary: '表层干不等于整块地缺水，建议挖开土层确认。',
    level: '先查墒情',
    title: '挖开 5 厘米再判断',
    reason: '演示天气偏干。先看根系附近土壤，而不是只看地表发白，避免无效灌溉。',
    evidence: '偏干天气 + 壤土地块 + 分蘖期需水参考。实际墒情以田间查看为准。',
    risks: { 'center-normal': 'risk', 'north-east': 'watch' },
    zoneHints: {
      'center-normal': '中部先挖开 5 厘米看土壤能否握成团。',
      'north-east': '与中部对照查看，避免只凭一个点决定全田灌水。'
    },
    actions: [
      ['先挖', '中部与东北部各看 5 厘米土层'],
      ['再定', '是否需要分区补水'],
      ['记录', '查看时间和土壤状态']
    ]
  }
};

const spokenWeathers = {
  normal: {
    health: '低洼地儿先看排水',
    level: '先瞅一眼',
    title: '今儿个先瞅东边低洼那块',
    reason: '预报说有雨，东边地势低，先把排水口理顺溜，再忙别的。',
    evidence: '看的是天气、地块高低和当前苗情，只帮你排先后；心里没底就问农技员。',
    actions: [
      ['先瞅', '东边地头有没有积水'],
      ['顺手', '把排水口的秸秆、泥巴清清'],
      ['先别', '全田浇水，雨停后看墒再定']
    ]
  },
  cold: {
    health: '北边弱苗得多瞅瞅',
    level: '重点瞅',
    title: '赶天黑前瞅瞅北边弱苗',
    reason: '这回降温不轻，弱苗更怕冷。叶子发紫、发黄，先拍下来，别自个儿乱下药。',
    evidence: '降温预报加上北边苗情偏弱，是个查看顺序；真拿不准就找农技员。',
    actions: [
      ['先瞅', '北边苗叶色和贴地长势'],
      ['先别', '降温前后喷药、猛浇水'],
      ['记下来', '不放心就拍照问农技员']
    ]
  },
  rain: {
    health: '连着下，先顾排水',
    level: '赶紧处置',
    title: '雨一停，先蹚到东边看沟',
    reason: '东边低、南边又挨着渠，水下去得慢。先看沟堵没堵，再琢磨要不要排水。',
    evidence: '这是连雨情形加地块位置做的提醒，水到底多深还得人下地看。',
    actions: [
      ['先瞅', '东边地头积没积水'],
      ['再查', '南边渠水有没有漫上来'],
      ['拍下来', '积水在哪儿、沟通不通']
    ]
  },
  wind: {
    health: '风大，地头活儿先缓缓',
    level: '避着风口',
    title: '先停喷药，再去地头瞅瞅',
    reason: '这会儿风硬，药一喷容易飘。人先站稳当，再去看看弱苗和地头有没有倒伏。',
    evidence: '大风情形下先顾人和作业安全，现场风势比页面更要紧。',
    actions: [
      ['先停', '喷药、撒肥这些怕风的活儿'],
      ['顺路瞅', '北边弱苗和南边地头'],
      ['记下来', '哪儿倒了、啥时候倒的']
    ]
  },
  drought: {
    health: '看着干，先挖土看墒',
    level: '先看墒',
    title: '别光看地皮白，挖 5 厘米再说',
    reason: '地皮发白不等于整块地渴。挖开根边土看看，能攥成团就先别急着浇。',
    evidence: '这是偏干情形的查看建议，墒情要按自家地块和土层亲手判断。',
    actions: [
      ['先挖', '中间和东北边各看 5 厘米土'],
      ['再定', '是一块补水还是全田补'],
      ['记下来', '啥时候看的、土是啥样']
    ]
  }
};

const weekPatterns = {
  normal: [
    { offset: 0, tag: '雨前', weather: 'normal', zone: 'east-low', tone: 'watch', title: '先看低洼排水', note: '雨没下，先把地头理顺。' },
    { offset: 1, tag: '备雨', weather: 'normal', zone: 'east-low', tone: 'watch', title: '清理排水口', note: '秸秆、泥巴别堵沟。' },
    { offset: 2, tag: '有雨', weather: 'rain', zone: 'east-low', tone: 'risk', title: '雨后看积水', note: '先低洼，再查近渠。' },
    { offset: 3, tag: '有雨', weather: 'rain', zone: 'south-field', tone: 'risk', title: '复查渠水', note: '看地头有没有倒灌。' },
    { offset: 4, tag: '转晴', weather: 'normal', zone: 'center-normal', tone: 'calm', title: '挖土看墒', note: '雨后不急全田灌水。' },
    { offset: 5, tag: '稳态', weather: 'normal', zone: 'north-east', tone: 'calm', title: '对照苗情', note: '正常区与弱苗区比一比。' },
    { offset: 6, tag: '整理', weather: 'normal', zone: 'north-weak', tone: 'calm', title: '补全巡田记录', note: '照片、位置、时间留档。' }
  ],
  cold: [
    { offset: 0, tag: '降温前', weather: 'cold', zone: 'north-weak', tone: 'risk', title: '傍晚看弱苗', note: '叶色、贴地长势先看。' },
    { offset: 1, tag: '降温', weather: 'cold', zone: 'north-weak', tone: 'risk', title: '缓喷施与灌水', note: '低温时别给苗添负担。' },
    { offset: 2, tag: '低温', weather: 'cold', zone: 'west-normal', tone: 'watch', title: '对照区复看', note: '正常苗与弱苗做对照。' },
    { offset: 3, tag: '转晴', weather: 'normal', zone: 'north-weak', tone: 'watch', title: '复看冻害迹象', note: '异常持续就拍照求助。' },
    { offset: 4, tag: '回稳', weather: 'normal', zone: 'north-east', tone: 'calm', title: '再比苗情', note: '看恢复得匀不匀。' },
    { offset: 5, tag: '回稳', weather: 'normal', zone: 'center-normal', tone: 'calm', title: '补查墒情', note: '低温后别只看地皮。' },
    { offset: 6, tag: '整理', weather: 'normal', zone: 'north-weak', tone: 'calm', title: '留好照片', note: '为后续判断留证据。' }
  ],
  rain: [
    { offset: 0, tag: '连雨', weather: 'rain', zone: 'east-low', tone: 'risk', title: '先看东侧积水', note: '地头排水口先查通不通。' },
    { offset: 1, tag: '连雨', weather: 'rain', zone: 'south-field', tone: 'risk', title: '再看渠水高度', note: '防倒灌，防人下渠。' },
    { offset: 2, tag: '连雨', weather: 'rain', zone: 'north-weak', tone: 'watch', title: '弱苗一起复查', note: '受渍后恢复更慢。' },
    { offset: 3, tag: '间歇', weather: 'normal', zone: 'east-low', tone: 'watch', title: '抓住雨歇排水', note: '先通沟，再判断。' },
    { offset: 4, tag: '间歇', weather: 'normal', zone: 'east-low', tone: 'watch', title: '复看是否返水', note: '别只看表层水退。' },
    { offset: 5, tag: '转晴', weather: 'normal', zone: 'center-normal', tone: 'calm', title: '查墒别急灌', note: '土还湿就先缓一缓。' },
    { offset: 6, tag: '整理', weather: 'normal', zone: 'south-field', tone: 'calm', title: '归档积水照片', note: '下次雨前能对照。' }
  ],
  wind: [
    { offset: 0, tag: '大风', weather: 'wind', zone: 'south-field', tone: 'risk', title: '暂停地头喷施', note: '先保证人和作业安全。' },
    { offset: 1, tag: '大风', weather: 'wind', zone: 'north-weak', tone: 'watch', title: '看弱苗是否折叶', note: '弱苗抗风更差。' },
    { offset: 2, tag: '风减', weather: 'normal', zone: 'south-field', tone: 'watch', title: '看地头覆盖物', note: '防吹散，防刮到渠。' },
    { offset: 3, tag: '风后', weather: 'normal', zone: 'north-weak', tone: 'watch', title: '复看倒伏与根', note: '不要只扶苗不看根。' },
    { offset: 4, tag: '平稳', weather: 'normal', zone: 'north-east', tone: 'calm', title: '对照区复查', note: '判断影响范围。' },
    { offset: 5, tag: '平稳', weather: 'normal', zone: 'center-normal', tone: 'calm', title: '恢复常规巡查', note: '确认全田状态。' },
    { offset: 6, tag: '整理', weather: 'normal', zone: 'north-weak', tone: 'calm', title: '记录风后变化', note: '留位置和照片。' }
  ],
  drought: [
    { offset: 0, tag: '偏干', weather: 'drought', zone: 'center-normal', tone: 'risk', title: '挖土看根边墒', note: '地表白不等于缺水。' },
    { offset: 1, tag: '对照', weather: 'drought', zone: 'north-east', tone: 'watch', title: '再挖一处对照', note: '不同位置各看一铲。' },
    { offset: 2, tag: '看墒', weather: 'drought', zone: 'east-low', tone: 'watch', title: '低洼区也复查', note: '别按地势想当然。' },
    { offset: 3, tag: '决策', weather: 'normal', zone: 'center-normal', tone: 'watch', title: '决定分区补水', note: '先小范围验证。' },
    { offset: 4, tag: '回看', weather: 'normal', zone: 'center-normal', tone: 'calm', title: '复查补水效果', note: '看土，不只看叶。' },
    { offset: 5, tag: '对照', weather: 'normal', zone: 'north-east', tone: 'calm', title: '与未补水区比', note: '避免无效灌溉。' },
    { offset: 6, tag: '整理', weather: 'normal', zone: 'north-weak', tone: 'calm', title: '记录墒情照片', note: '形成自己的地块档案。' }
  ]
};

const regionProfiles = {
  睢阳区: { code: 'SY', hint: '城郊周边地块，出发前核对边界和排水去向。' },
  梁园区: { code: 'LY', hint: '出发前核对地块边界，沿路作业注意机具安全。' },
  永城市: { code: 'YC', hint: '地块相距可能较远，先确认本次要到哪一块。' },
  民权县: { code: 'MQ', hint: '先核对村组地块边界和周边沟渠方向。' },
  睢县: { code: 'SX', hint: '查看前先确认地头出入口，雨天少走软路。' },
  宁陵县: { code: 'NL', hint: '先核对本地块排水方向，再做全田安排。' },
  柘城县: { code: 'ZC', hint: '巡田先定查看顺序，避免来回绕路。' },
  虞城县: { code: 'YC', hint: '地头近路时注意机具和行人，先看排水口。' },
  夏邑县: { code: 'XY', hint: '不同地块分开记录，别把一处情况推给全田。' }
};

let regions = [
  {
    id: 'north-weak',
    tag: 'weak',
    role: 'north-weak',
    index: '01',
    name: '北侧弱苗区',
    short: '北侧弱苗',
    x: -2.25,
    z: -4.05,
    w: 4.2,
    d: 1.85,
    note: '苗情偏弱，降温与大风天气优先查看。',
    vigor: '偏弱',
    moisture: '正常'
  },
  {
    id: 'north-east',
    tag: 'control',
    role: 'north-east',
    index: '02',
    name: '东北正常区',
    short: '东北区',
    x: 2.25,
    z: -4.05,
    w: 4.2,
    d: 1.85,
    note: '当前苗情较均匀，可作全田对照区。',
    vigor: '正常',
    moisture: '正常'
  },
  {
    id: 'west-normal',
    tag: 'general',
    role: 'west-normal',
    index: '03',
    name: '西侧正常区',
    short: '西侧区',
    x: -3.45,
    z: -1.1,
    w: 2,
    d: 3.55,
    note: '靠近气象站，适合作为田间对照。',
    vigor: '正常',
    moisture: '正常'
  },
  {
    id: 'center-normal',
    tag: 'dry',
    role: 'center-normal',
    index: '04',
    name: '中部正常区',
    short: '中部区',
    x: 0,
    z: -1.1,
    w: 4.3,
    d: 3.55,
    note: '关注群体长势是否均匀。',
    vigor: '正常',
    moisture: '偏干'
  },
  {
    id: 'east-low',
    tag: 'low',
    role: 'east-low',
    index: '05',
    name: '东侧低洼区',
    short: '东侧低洼',
    x: 3.45,
    z: -1.1,
    w: 2,
    d: 3.55,
    note: '地势偏低，降雨时优先检查排水。',
    vigor: '正常',
    moisture: '偏湿'
  },
  {
    id: 'south-field',
    tag: 'canal',
    role: 'south-field',
    index: '06',
    name: '南侧近渠区',
    short: '南侧近渠',
    x: 0,
    z: 2.15,
    w: 9.15,
    d: 1.85,
    note: '靠近灌渠与机耕道，关注倒灌和作业安全。',
    vigor: '正常',
    moisture: '正常'
  }
];

const standardZoneGeometry = regions.map((zone) => ({
  x: zone.x,
  z: zone.z,
  w: zone.w,
  d: zone.d,
  tag: zone.tag
}));

function inferredTag(x, z, index, count) {
  if (x < -1.7 && z < -1.2) return 'weak';
  if (x > 2.15) return 'low';
  if (z > 1.7) return 'canal';
  if (Math.abs(x) < 1.8 && z < 1.7) return 'dry';
  if (index === 0 && count > 2) return 'weak';
  return index % 3 === 1 ? 'control' : 'general';
}

function calculateLayout(count, layout = 'grid') {
  if (layout === 'standard' && count === 6) {
    return standardZoneGeometry.map((geometry, index) => ({ ...geometry, tag: standardZoneGeometry[index].tag }));
  }

  const totalW = 9.15;
  const totalD = 5.9;
  const gap = 0.17;
  const cols = layout === 'strip' || count === 1 ? 1 : count <= 4 ? 2 : count <= 9 ? 3 : 4;
  const rows = Math.ceil(count / cols);
  const cellW = (totalW - gap * (cols - 1)) / cols;
  const cellD = (totalD - gap * (rows - 1)) / rows;

  return Array.from({ length: count }, (_, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;
    const rowCount = Math.min(cols, count - row * cols);
    const usedWidth = rowCount * cellW + Math.max(0, rowCount - 1) * gap;
    const rowStartX = -usedWidth / 2;
    const x = rowStartX + col * (cellW + gap) + cellW / 2;
    const z = -totalD / 2 + row * (cellD + gap) + cellD / 2;
    return {
      x,
      z,
      w: cellW,
      d: cellD,
      tag: inferredTag(x, z, index, count)
    };
  });
}

function materializeFarmZones(farm) {
  const draftZones = cloneZones(farm.zones || []);
  const layout = farm.layout || 'grid';
  const geometry = calculateLayout(draftZones.length, layout);
  return draftZones.map((zone, index) => {
    const tag = zoneTagProfiles[zone.tag] ? zone.tag : geometry[index].tag;
    const tagProfile = zoneTagProfiles[tag];
    return {
      ...zone,
      ...geometry[index],
      index: String(index + 1).padStart(2, '0'),
      id: zone.id || `zone-${index + 1}`,
      name: zone.name || `管理区 ${index + 1}`,
      short: zone.name ? zone.name.slice(0, 5) : `管理区${index + 1}`,
      tag,
      role: tagProfile.role,
      note: tagProfile.note,
      vigor: tagProfile.vigor,
      moisture: tagProfile.moisture
    };
  });
}

const FARM_STORAGE_KEY = 'tianmingbai:farms-v1';
const ACTIVE_FARM_KEY = 'tianmingbai:active-farm-v1';
const DEFAULT_FARM_ID = 'farm-demo-east';

function cloneZones(zones) {
  return zones.map((zone, index) => ({ ...zone, index: String(index + 1).padStart(2, '0') }));
}

function defaultFarmRecord() {
  return {
    id: DEFAULT_FARM_ID,
    name: '村东三亩地',
    region: '睢阳区',
    area: 3.2,
    crop: 'wheat',
    soil: '壤土',
    irrigation: '渠灌',
    sowingDate: '2026-10-15',
    lastDate: formatISODate(new Date()),
    layout: 'standard',
    zones: cloneZones(regions),
    createdAt: '2026-11-08T00:00:00.000Z',
    demo: true
  };
}

function isValidFarm(farm) {
  return farm
    && typeof farm.id === 'string'
    && typeof farm.name === 'string'
    && cropProfiles[farm.crop]
    && Array.isArray(farm.zones)
    && farm.zones.length > 0;
}

function loadFarmRecords() {
  try {
    const saved = JSON.parse(localStorage.getItem(FARM_STORAGE_KEY) || 'null');
    if (Array.isArray(saved) && saved.length && saved.every(isValidFarm)) {
      return saved.map((farm) => ({
        ...farm,
        zones: cloneZones(farm.zones)
      }));
    }
  } catch (_) {
    // A blocked or malformed store falls back to the built-in demonstration farm.
  }
  return [defaultFarmRecord()];
}

let farmRecords = loadFarmRecords();
let activeFarmId = '';
try {
  const savedActiveFarm = localStorage.getItem(ACTIVE_FARM_KEY);
  if (farmRecords.some((farm) => farm.id === savedActiveFarm)) activeFarmId = savedActiveFarm;
} catch (_) {
  // Use the first farm when no active farm can be restored.
}
if (!activeFarmId) activeFarmId = farmRecords[0].id;

function activeFarm() {
  return farmRecords.find((farm) => farm.id === activeFarmId) || farmRecords[0];
}

function activeCrop() {
  return cropProfiles[activeFarm().crop] || cropProfiles.other;
}

const layerInfo = {
  risk: {
    caption: '风险图层：红橙色区域需要优先查看，颜色始终配合文字说明。',
    legend: [['risk', '重点查看'], ['watch', '持续留意'], ['normal', '状态平稳']]
  },
  vigor: {
    caption: '长势图层：偏弱地块用暖黄色提示，仅表示演示管理分组，不是遥感长势指数。',
    legend: [['watch', '长势偏弱'], ['normal', '长势正常'], ['risk', '需要复核']]
  },
  moisture: {
    caption: '墒情图层：蓝色表示演示中的偏湿分组，沙色表示偏干分组，实际墒情需田间查看。',
    legend: [['normal', '正常'], ['watch', '偏干'], ['risk', '偏湿']]
  }
};

const state = {
  region: activeFarm().region,
  date: activeFarm().lastDate || '2026-11-08',
  weekStart: activeFarm().lastDate || '2026-11-08',
  weather: 'normal',
  weekPattern: 'normal',
  stage: 'tillering',
  layer: 'risk',
  selected: activeFarm().zones[0]?.id || 'zone-01',
  scanning: false,
  scanFinding: false,
  scanFindingFarm: null,
  recorded: false,
  view: 'overview',
  dialect: false,
  weekIndex: 0,
  weekFocus: null
};

regions = materializeFarmZones(activeFarm());
if (!regions.some((region) => region.id === state.selected)) {
  state.selected = regions[0]?.id || 'zone-01';
}

const dateEl = document.getElementById('decisionDate');
const contextHint = document.getElementById('contextHint');
const decisionLevel = document.getElementById('decisionLevel');
const decisionTitle = document.getElementById('decisionTitle');
const decisionReason = document.getElementById('decisionReason');
const decisionEvidence = document.getElementById('decisionEvidence');
const actionList = document.getElementById('actionList');
const regionSelect = document.getElementById('regionSelect');
const dateInput = document.getElementById('dateInput');
const weatherSelect = document.getElementById('weatherSelect');
const dialectToggle = document.getElementById('dialectToggle');
const listenButton = document.getElementById('listenButton');
const recordAction = document.getElementById('recordAction');
const recordShortcut = document.getElementById('recordShortcut');
const recordCount = document.getElementById('recordCount');
const plotName = document.getElementById('plotName');
const plotLocation = document.getElementById('plotLocation');
const plotCrop = document.getElementById('plotCrop');
const plotStage = document.getElementById('plotStage');
const plotDays = document.getElementById('plotDays');
const scenePlotName = document.getElementById('scenePlotName');
const sceneContextLabel = document.getElementById('sceneContextLabel');
const localServiceLabel = document.getElementById('localServiceLabel');
const weekDays = document.getElementById('weekDays');
const weekRange = document.getElementById('weekRange');
const healthTitle = document.getElementById('healthTitle');
const healthSeal = document.getElementById('healthSeal');
const healthSummary = document.getElementById('healthSummary');
const riskMetric = document.getElementById('riskMetric');
const zoneMetric = document.getElementById('zoneMetric');
const actionMetric = document.getElementById('actionMetric');
const zoneSectionLabel = document.getElementById('zoneSectionLabel');
const zoneGrid = document.getElementById('zoneGrid');
const zoneDetailIndex = document.getElementById('zoneDetailIndex');
const zoneDetailTitle = document.getElementById('zoneDetailTitle');
const zoneDetailText = document.getElementById('zoneDetailText');
const zoneDetailTag = document.getElementById('zoneDetailTag');
const editSelectedZoneButton = document.getElementById('editSelectedZoneButton');
const routeList = document.getElementById('routeList');
const layerCaption = document.getElementById('layerCaption');
const layerLegend = document.getElementById('layerLegend');
const pinsRoot = document.getElementById('pins');
const infraLabelsRoot = document.getElementById('infraLabels');
const toast = document.getElementById('toast');
const scanButton = document.getElementById('scanButton');
const scanStatus = document.getElementById('scanStatus');
const scanStatusCopy = document.getElementById('scanStatusCopy');
const scanPercent = document.getElementById('scanPercent');
const scanProgressBar = document.getElementById('scanProgressBar');
const scanFindingPin = document.getElementById('scanFindingPin');
const scanFindingNote = document.getElementById('scanFindingNote');
const shareCardButton = document.getElementById('shareCardButton');
const aiChatPanel = document.getElementById('aiChatPanel');
const chatContext = document.getElementById('chatContext');
const chatMessages = document.getElementById('chatMessages');
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');
const chatSend = document.getElementById('chatSend');
const syncTime = document.getElementById('syncTime');
const farmManager = document.getElementById('farmManager');
const farmScrim = document.getElementById('farmScrim');
const farmClose = document.getElementById('farmClose');
const farmCancel = document.getElementById('farmCancel');
const farmList = document.getElementById('farmList');
const newFarmButton = document.getElementById('newFarmButton');
const farmForm = document.getElementById('farmForm');
const farmIdInput = document.getElementById('farmIdInput');
const farmNameInput = document.getElementById('farmNameInput');
const farmRegionInput = document.getElementById('farmRegionInput');
const farmAreaInput = document.getElementById('farmAreaInput');
const farmCropInput = document.getElementById('farmCropInput');
const farmSowingInput = document.getElementById('farmSowingInput');
const farmSoilInput = document.getElementById('farmSoilInput');
const farmIrrigationInput = document.getElementById('farmIrrigationInput');
const farmLayoutInput = document.getElementById('farmLayoutInput');
const farmZoneCountInput = document.getElementById('farmZoneCountInput');
const zoneEditor = document.getElementById('zoneEditor');
const farmPreview = document.getElementById('farmPreview');
const addZoneButton = document.getElementById('addZoneButton');
const deleteFarmButton = document.getElementById('deleteFarmButton');
const farmFormError = document.getElementById('farmFormError');
const farmFormHint = document.getElementById('farmFormHint');
const farmConfigSummary = document.getElementById('farmConfigSummary');

const REFERENCE_SOWING_DATE = '2026-10-15';
const CONTEXT_STORAGE_KEY = 'tianmingbai:plot-context-v1';

function parseLocalDate(value) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
}

function formatISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(value, amount) {
  const date = parseLocalDate(value);
  date.setDate(date.getDate() + amount);
  return formatISODate(date);
}

function getDaysAfterSowing(value) {
  const selected = parseLocalDate(value);
  const sowing = parseLocalDate(activeFarm().sowingDate || REFERENCE_SOWING_DATE);
  return Math.round((selected - sowing) / 86400000);
}

function cropStages() {
  const crop = activeCrop();
  return stages.map((stage, index) => ({
    ...stage,
    name: crop.stageLabels[index] || stage.name
  }));
}

function stageDefinition(stageId) {
  return cropStages().find((stage) => stage.id === stageId) || cropStages()[0];
}

function inferStage(days) {
  if (days < 1) return { id: 'emergence', name: '未到参考播期' };
  const crop = activeCrop();
  const cropStageList = cropStages();
  const stageIndex = crop.stageDays.findIndex((maxDays) => days <= maxDays);
  return cropStageList[Math.max(0, stageIndex)];
}

function getLunarLabel(value) {
  try {
    const parts = new Intl.DateTimeFormat('zh-CN-u-ca-chinese', {
      month: 'long',
      day: 'numeric'
    }).formatToParts(parseLocalDate(value));
    const month = parts.find((part) => part.type === 'month')?.value || '';
    const rawDay = parts.find((part) => part.type === 'day')?.value || '';
    const dayNumber = Number(rawDay.replace(/\D/g, ''));
    const numerals = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
    let day = rawDay;
    if (dayNumber && dayNumber <= 10) day = dayNumber === 10 ? '初十' : `初${numerals[dayNumber]}`;
    else if (dayNumber < 20) day = `十${numerals[dayNumber - 10]}`;
    else if (dayNumber === 20) day = '二十';
    else if (dayNumber < 30) day = `二十${numerals[dayNumber - 20]}`;
    else if (dayNumber === 30) day = '三十';
    return `${month}${day}`;
  } catch (_) {
    return '农历日期不可用';
  }
}

function formatDecisionDate(value) {
  const date = parseLocalDate(value);
  const solar = new Intl.DateTimeFormat('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'short'
  }).format(date);
  return `${solar} · ${getLunarLabel(value)}`;
}

function formatShortDate(value) {
  const date = parseLocalDate(value);
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'numeric',
    day: 'numeric'
  }).format(date);
}

function formatWeekday(value) {
  return new Intl.DateTimeFormat('zh-CN', { weekday: 'short' }).format(parseLocalDate(value));
}

function currentProfile() {
  return state.dialect
    ? { ...weathers[state.weather], ...spokenWeathers[state.weather] }
    : weathers[state.weather];
}

function saveContext() {
  try {
    localStorage.setItem(CONTEXT_STORAGE_KEY, JSON.stringify({
      region: state.region,
      date: state.date,
      weather: state.weather,
      dialect: state.dialect
    }));
  } catch (_) {
    // The page remains fully usable when storage is blocked.
  }
}

try {
  const saved = JSON.parse(localStorage.getItem(CONTEXT_STORAGE_KEY) || 'null');
  if (saved && typeof saved === 'object') {
    if (weathers[saved.weather]) {
      state.weather = saved.weather;
      state.weekPattern = saved.weather;
    }
    state.dialect = Boolean(saved.dialect);
  }
} catch (_) {
  // Invalid or unavailable saved settings fall back to safe defaults.
}
state.region = activeFarm().region || state.region;
state.date = activeFarm().lastDate || state.date;
state.weekStart = state.date;

const sceneHost = document.getElementById('scene');
const sceneFrame = sceneHost.closest('.scene-frame');

function canUseWebGL() {
  try {
    const probe = document.createElement('canvas');
    const context = window.WebGLRenderingContext
      ? probe.getContext('webgl2') || probe.getContext('webgl') || probe.getContext('experimental-webgl')
      : null;
    if (context && context.getExtension) context.getExtension('WEBGL_lose_context')?.loseContext();
    return Boolean(context);
  } catch (_) {
    return false;
  }
}

const force2D = new URLSearchParams(window.location.search).get('plot2d') === '1';
const webglAvailable = canUseWebGL();

if (force2D) {
  document.querySelector('.page').classList.add('is-2d');
  document.getElementById('webglFallback').hidden = false;
  sceneHost.style.display = 'none';
  pinsRoot.hidden = true;
  infraLabelsRoot.hidden = true;
  document.querySelector('.fallback-copy strong').textContent = '当前使用二维降级视图';
  document.querySelector('.fallback-copy > span:last-child').textContent = '天气、日期、农事判断和七日安排均可继续使用；三维按钮已停用。';
  document.querySelectorAll('.segmented button, .scan-button, .layer-switch button').forEach((button) => {
    button.disabled = true;
  });
}

if (!webglAvailable) {
  document.querySelector('.page').classList.add('is-2d');
  document.getElementById('webglFallback').hidden = false;
  document.querySelectorAll('.segmented button, .scan-button, .layer-switch button').forEach((button) => {
    button.disabled = true;
  });
  throw new Error('WebGL unavailable; 2D fallback enabled.');
}

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0xd5dfd2, 0.014);

const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
camera.position.set(7.4, 13.2, 9.4);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true,
  powerPreference: 'high-performance'
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
renderer.setClearColor(0x000000, 0);
renderer.domElement.setAttribute('aria-hidden', 'true');
sceneHost.appendChild(renderer.domElement);
renderer.domElement.addEventListener('webglcontextlost', (event) => {
  event.preventDefault();
  document.getElementById('webglFallback').hidden = false;
  showToast('三维渲染已降级，二维地块图和今日农事任务仍可使用。');
});

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.enablePan = false;
controls.minDistance = 7;
controls.maxDistance = 24;
controls.minPolarAngle = 0.12;
controls.maxPolarAngle = 1.38;
controls.target.set(0, 0.15, 0.3);

const hemi = new THREE.HemisphereLight(0xfff5d8, 0x304c39, 1.75);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xffedc8, 2.7);
sun.position.set(-8, 13, 7);
scene.add(sun);

const fill = new THREE.DirectionalLight(0xafd1df, 0.9);
fill.position.set(9, 5, -7);
scene.add(fill);

const rim = new THREE.DirectionalLight(0xf0b966, 0.45);
rim.position.set(3, 6, 9);
scene.add(rim);

const world = new THREE.Group();
world.rotation.y = -0.06;
scene.add(world);

const shared = {
  berm: new THREE.MeshStandardMaterial({ color: 0xcbb998, roughness: 1 }),
  dirt: new THREE.MeshStandardMaterial({ color: 0xb49d76, roughness: 1 }),
  soil: new THREE.MeshStandardMaterial({ color: 0x786449, roughness: 1 }),
  trunk: new THREE.MeshStandardMaterial({ color: 0x6e5537, roughness: 1 }),
  white: new THREE.MeshStandardMaterial({ color: 0xe9e7db, roughness: 0.76 }),
  dark: new THREE.MeshStandardMaterial({ color: 0x283d30, roughness: 0.7 }),
  metal: new THREE.MeshStandardMaterial({ color: 0x58706d, roughness: 0.5, metalness: 0.18 })
};

function seeded(seed) {
  let value = seed >>> 0;
  return () => {
    value = (1664525 * value + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function makeFieldTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  context.fillStyle = '#d2c7ae';
  context.fillRect(0, 0, 128, 128);

  for (let row = 5; row < 128; row += 13) {
    context.fillStyle = 'rgba(48, 65, 42, 0.16)';
    context.fillRect(0, row, 128, 2);
    context.fillStyle = 'rgba(255, 249, 225, 0.08)';
    context.fillRect(0, row + 3, 128, 1);
  }

  const spots = seeded(771);
  for (let i = 0; i < 160; i++) {
    context.fillStyle = `rgba(62, 72, 48, ${0.025 + spots() * 0.05})`;
    context.fillRect(spots() * 128, spots() * 128, 1 + spots() * 2, 1 + spots() * 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3.2, 3.6);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

const fieldTexture = makeFieldTexture();

function createGround() {
  const geometry = new THREE.PlaneGeometry(38, 28, 40, 30);
  geometry.rotateX(-Math.PI / 2);
  const position = geometry.attributes.position;
  const colors = [];
  const palette = [
    new THREE.Color('#7d8c68'),
    new THREE.Color('#88936e'),
    new THREE.Color('#758669'),
    new THREE.Color('#929371')
  ];
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const z = position.getZ(i);
    const mix = (Math.sin(x * 0.65) + Math.cos(z * 0.52) + Math.sin((x + z) * 0.31) + 3) / 6;
    const base = palette[Math.min(palette.length - 1, Math.floor(mix * palette.length))];
    const color = base.clone().multiplyScalar(0.94 + ((Math.sin(x * 4.1 + z * 2.7) + 1) * 0.035));
    colors.push(color.r, color.g, color.b);
  }
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 1,
    metalness: 0
  });
  const ground = new THREE.Mesh(geometry, material);
  ground.position.y = -0.14;
  world.add(ground);
}
createGround();

function addDistantHills() {
  const material = new THREE.MeshStandardMaterial({
    color: 0x6f8067,
    roughness: 1,
    flatShading: true
  });
  [
    [-12, -15.8, 8.5, 1.25, 2.8],
    [-1.5, -17.2, 10.5, 1.55, 3.3],
    [10.5, -15.9, 8.4, 1.15, 2.7]
  ].forEach(([x, z, sx, sy, sz]) => {
    const hill = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 8), material);
    hill.position.set(x, -0.75, z);
    hill.scale.set(sx, sy, sz);
    world.add(hill);
  });
}
addDistantHills();

function addNeighbourFields() {
  const fields = [
    { x: -11.8, z: -3.5, w: 7.0, d: 7.3, color: 0x76835e, rot: -0.08 },
    { x: 12.0, z: -3.6, w: 7.4, d: 7.1, color: 0x8f8c67, rot: 0.09 },
    { x: -10.1, z: 7.7, w: 7.2, d: 4.3, color: 0x7c8a64, rot: 0.04 },
    { x: 10.2, z: 7.5, w: 7.0, d: 4.4, color: 0x8f835f, rot: -0.06 },
    { x: -3.4, z: -9.4, w: 7.0, d: 3.2, color: 0x798663, rot: -0.03 },
    { x: 3.8, z: -9.5, w: 6.1, d: 3.0, color: 0x8b8a64, rot: 0.02 }
  ];
  fields.forEach((field) => {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(field.w, field.d),
      new THREE.MeshStandardMaterial({ color: field.color, map: fieldTexture, roughness: 1 })
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.rotation.z = field.rot;
    mesh.position.set(field.x, -0.08, field.z);
    world.add(mesh);

    const border = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-field.w / 2, 0.02, -field.d / 2),
        new THREE.Vector3(field.w / 2, 0.02, -field.d / 2),
        new THREE.Vector3(field.w / 2, 0.02, field.d / 2),
        new THREE.Vector3(-field.w / 2, 0.02, field.d / 2)
      ]),
      new THREE.LineBasicMaterial({ color: 0xb4a683, transparent: true, opacity: 0.45 })
    );
    border.position.copy(mesh.position);
    border.position.y += 0.08;
    border.rotation.y = field.rot;
    world.add(border);
  });
}
addNeighbourFields();

const fieldPad = new THREE.Mesh(
  new THREE.BoxGeometry(11.35, 0.11, 11.1),
  new THREE.MeshStandardMaterial({ color: 0x9b896a, roughness: 1 })
);
fieldPad.position.set(0, -0.02, 0.02);
world.add(fieldPad);

function addBox(w, h, d, x, y, z, material, parent = world) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}

addBox(10.85, 0.13, 0.14, 0, 0.06, -5.15, shared.berm);
addBox(10.85, 0.13, 0.14, 0, 0.06, 5.12, shared.berm);
addBox(0.14, 0.13, 10.4, -5.35, 0.06, -0.02, shared.berm);
addBox(0.14, 0.13, 10.4, 5.35, 0.06, -0.02, shared.berm);

addBox(11.4, 0.035, 0.64, 0, 0.06, 5.7, shared.dirt);
addBox(0.64, 0.035, 11.2, 5.78, 0.06, 0.2, shared.dirt);

const outerBoundary = new THREE.LineLoop(
  new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-5.31, 0.16, -5.11),
    new THREE.Vector3(5.31, 0.16, -5.11),
    new THREE.Vector3(5.31, 0.16, 5.08),
    new THREE.Vector3(-5.31, 0.16, 5.08)
  ]),
  new THREE.LineBasicMaterial({ color: 0x2b8e80, transparent: true, opacity: 0.72 })
);
world.add(outerBoundary);

const bermGeo = new THREE.BoxGeometry(0.28, 0.09, 0.85);
[[-2.18, -2.2], [2.18, -2.2], [-2.18, 1.2], [2.18, 1.2]].forEach(([x, z]) => {
  const berm = new THREE.Mesh(bermGeo, shared.berm);
  berm.position.set(x, 0.07, z);
  world.add(berm);
});

const canalBank = new THREE.MeshStandardMaterial({ color: 0x8e8069, roughness: 1 });
addBox(9.85, 0.18, 0.16, 0, 0.05, 3.44, canalBank);
addBox(9.85, 0.18, 0.16, 0, 0.05, 4.1, canalBank);
addBox(9.8, 0.04, 0.52, 0, -0.09, 3.77, new THREE.MeshStandardMaterial({ color: 0x736b5a, roughness: 1 }));

const waterMaterial = new THREE.MeshStandardMaterial({
  color: 0x527d82,
  roughness: 0.24,
  metalness: 0.04,
  transparent: true,
  opacity: 0.62,
  depthWrite: false
});
const water = new THREE.Mesh(new THREE.PlaneGeometry(9.62, 0.5), waterMaterial);
water.rotation.x = -Math.PI / 2;
water.position.set(0, -0.02, 3.77);
world.add(water);

const waterGlints = [];
for (let i = 0; i < 5; i++) {
  const glint = new THREE.Mesh(
    new THREE.PlaneGeometry(0.38 + i * 0.12, 0.014),
    new THREE.MeshBasicMaterial({ color: 0xd9ece7, transparent: true, opacity: 0.6, depthWrite: false })
  );
  glint.rotation.x = -Math.PI / 2;
  glint.position.set(-4 + i * 2.05, 0.014, 3.75 + (i % 2) * 0.09);
  world.add(glint);
  waterGlints.push(glint);
}

const eastDitchBed = new THREE.Mesh(
  new THREE.BoxGeometry(0.34, 0.06, 5.6),
  new THREE.MeshStandardMaterial({ color: 0x635e50, roughness: 1 })
);
eastDitchBed.position.set(5.47, 0.02, -0.55);
world.add(eastDitchBed);

const eastDitchWaterMaterial = new THREE.MeshStandardMaterial({
  color: 0x537d79,
  roughness: 0.3,
  transparent: true,
  opacity: 0.12,
  depthWrite: false
});
const eastDitchWater = new THREE.Mesh(
  new THREE.PlaneGeometry(0.23, 5.42),
  eastDitchWaterMaterial
);
eastDitchWater.rotation.x = -Math.PI / 2;
eastDitchWater.position.set(5.47, 0.061, -0.55);
world.add(eastDitchWater);

const drainPipe = new THREE.Mesh(
  new THREE.CylinderGeometry(0.075, 0.075, 0.78, 12, 1, true),
  new THREE.MeshStandardMaterial({ color: 0x77786d, roughness: 0.7, metalness: 0.16 })
);
drainPipe.rotation.z = Math.PI / 2;
drainPipe.position.set(4.92, 0.1, -1.15);
world.add(drainPipe);

const farmPondMaterial = new THREE.MeshStandardMaterial({
  color: 0x3f7477,
  roughness: 0.26,
  metalness: 0.04,
  transparent: true,
  opacity: 0.82,
  depthWrite: false
});
const farmPond = new THREE.Mesh(new THREE.PlaneGeometry(3.1, 2.25), farmPondMaterial);
farmPond.rotation.x = -Math.PI / 2;
farmPond.position.set(-7.35, -0.035, 4.55);
world.add(farmPond);
const pondRimMat = new THREE.MeshStandardMaterial({ color: 0xb5a384, roughness: 1 });
addBox(3.42, 0.12, 0.16, -7.35, 0.01, 3.36, pondRimMat);
addBox(3.42, 0.12, 0.16, -7.35, 0.01, 5.74, pondRimMat);
addBox(0.16, 0.12, 2.45, -9.01, 0.01, 4.55, pondRimMat);
addBox(0.16, 0.12, 2.45, -5.69, 0.01, 4.55, pondRimMat);

function makeWeatherStation(x, z) {
  const group = new THREE.Group();
  group.position.set(x, 0.08, z);

  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.04, 1.62, 7), shared.white);
  mast.position.y = 0.81;
  group.add(mast);

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.19, 0.09, 12), shared.metal);
  base.position.y = 0.04;
  group.add(base);

  const box = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.25, 0.18), shared.white);
  box.position.set(0, 0.93, 0.04);
  group.add(box);

  const shield = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.12, 10), shared.metal);
  shield.position.set(-0.23, 1.34, 0);
  group.add(shield);

  const panel = new THREE.Mesh(
    new THREE.BoxGeometry(0.72, 0.04, 0.38),
    new THREE.MeshStandardMaterial({ color: 0x294f62, roughness: 0.4, metalness: 0.2 })
  );
  panel.position.set(0.2, 1.62, 0);
  panel.rotation.z = -0.3;
  group.add(panel);

  const cupHub = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), shared.dark);
  cupHub.position.set(0, 1.72, 0);
  group.add(cupHub);
  for (let i = 0; i < 3; i++) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.012, 0.012), shared.dark);
    arm.rotation.y = (i / 3) * Math.PI * 2;
    arm.position.set(0.1 * Math.cos(arm.rotation.y), 1.72, -0.1 * Math.sin(arm.rotation.y));
    group.add(arm);
    const cup = new THREE.Mesh(new THREE.SphereGeometry(0.038, 8, 6), shared.white);
    cup.position.set(0.21 * Math.cos(arm.rotation.y), 1.72, -0.21 * Math.sin(arm.rotation.y));
    group.add(cup);
  }
  world.add(group);
}
makeWeatherStation(-4.78, -4.75);

function makePumpStation(x, z) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(0.44, 0.48, 0.38),
    new THREE.MeshStandardMaterial({ color: 0x3d716b, roughness: 0.72 })
  );
  base.position.y = 0.24;
  group.add(base);
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.62, 8), shared.metal);
  pipe.position.set(0, 0.39, -0.28);
  group.add(pipe);
  const cap = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.08, 0.12), shared.white);
  cap.position.set(0.08, 0.38, 0);
  group.add(cap);
  world.add(group);
}
makePumpStation(4.65, 3.44);

function makeTractor(x, z, rotation = 0) {
  const group = new THREE.Group();
  const red = new THREE.MeshStandardMaterial({ color: 0xa74632, roughness: 0.7, metalness: 0.12 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x9db9b4, roughness: 0.28, metalness: 0.12 });
  const tire = new THREE.MeshStandardMaterial({ color: 0x252b27, roughness: 0.9 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.24, 0.25), red);
  body.position.set(0, 0.22, 0);
  group.add(body);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.23, 0.3, 0.22), glass);
  cabin.position.set(-0.06, 0.46, 0);
  group.add(cabin);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(0.29, 0.035, 0.26), shared.white);
  roof.position.set(-0.06, 0.63, 0);
  group.add(roof);
  [[-0.18, 0.13, 0.14], [0.17, 0.13, 0.16]].forEach(([wx, wy, wr]) => {
    [-1, 1].forEach((side) => {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(wr, wr, 0.08, 12), tire);
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(wx, wy, side * 0.16);
      group.add(wheel);
    });
  });
  group.scale.setScalar(0.72);
  group.position.set(x, 0.03, z);
  group.rotation.y = rotation;
  world.add(group);
}
makeTractor(-6.8, 5.73, 0.08);

function addTree(x, z, scale = 1, variation = 0) {
  const group = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.1, 0.72, 6), shared.trunk);
  trunk.position.y = 0.35;
  group.add(trunk);

  const leafColors = [0x416c4c, 0x4c7851, 0x376145, 0x567d55];
  const leafMaterial = new THREE.MeshStandardMaterial({
    color: leafColors[variation % leafColors.length],
    roughness: 1,
    flatShading: true
  });

  const crowns = [
    [0, 1.02, 0, 0.52],
    [-0.29, 0.94, 0.08, 0.37],
    [0.27, 1.17, -0.05, 0.4],
    [0.08, 1.36, 0.08, 0.32]
  ];
  crowns.forEach(([cx, cy, cz, size]) => {
    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(size, 1), leafMaterial);
    crown.position.set(cx, cy, cz);
    crown.scale.y = 0.82;
    group.add(crown);
  });
  group.scale.setScalar(scale);
  group.position.set(x, 0, z);
  world.add(group);
}

[
  [-6.55, -4.55, 0.95, 0], [-6.8, -2.1, 0.9, 1], [-6.9, 0.8, 1.05, 2],
  [6.95, -4.0, 1, 1], [7.05, -1.1, 0.88, 0], [6.95, 1.2, 1.06, 3],
  [-4.9, 7.0, 0.72, 2], [-1.8, 7.3, 0.62, 0], [1.9, 7.2, 0.7, 1], [4.8, 6.7, 0.62, 3],
  [-8.8, -7.6, 0.72, 1], [-6.9, -7.8, 0.7, 3], [-3.1, -7.9, 0.66, 0],
  [2.7, -7.8, 0.7, 2], [5.5, -7.9, 0.67, 1], [8.1, -7.6, 0.72, 3],
  [-11.2, 2.2, 0.7, 2], [11.2, 3.3, 0.72, 0]
].forEach((args) => addTree(...args));

function addFarmHouse(x, z, scale = 1) {
  const group = new THREE.Group();
  const wall = new THREE.Mesh(
    new THREE.BoxGeometry(1.25, 0.72, 0.86),
    new THREE.MeshStandardMaterial({ color: 0xd4c3a5, roughness: 1 })
  );
  wall.position.y = 0.36;
  group.add(wall);

  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(1.46, 0.16, 1.02),
    new THREE.MeshStandardMaterial({ color: 0x994a36, roughness: 0.92 })
  );
  roof.position.set(0, 0.83, 0);
  roof.rotation.z = 0.04;
  group.add(roof);

  const door = new THREE.Mesh(
    new THREE.BoxGeometry(0.21, 0.37, 0.025),
    new THREE.MeshStandardMaterial({ color: 0x3c3b32, roughness: 1 })
  );
  door.position.set(0, 0.2, 0.443);
  group.add(door);
  group.scale.setScalar(scale);
  group.position.set(x, 0, z);
  group.rotation.y = -0.18;
  world.add(group);
}
// 村舍放入远景，保持“地块是主角、房屋只是空间锚点”的尺度关系。
addFarmHouse(-7.5, -8.8, 0.5);
addFarmHouse(-5.9, -9.4, 0.6);
addFarmHouse(-9.1, -10.2, 0.43);
addFarmHouse(6.7, -9.1, 0.48);
addFarmHouse(8.2, -9.7, 0.58);
addFarmHouse(9.7, -10.5, 0.42);
addFarmHouse(-1.0, -11.2, 0.46);

const cloudMaterial = new THREE.MeshBasicMaterial({
  color: 0xfaf8ed,
  transparent: true,
  opacity: 0.28,
  depthWrite: false
});
const clouds = new THREE.Group();
[
  [-4.5, 5.4, -7.8, 1.5],
  [4.8, 5.8, -8.2, 1.2],
  [1.4, 6.1, -9.0, 1]
].forEach(([x, y, z, scale]) => {
  const cloud = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const puff = new THREE.Mesh(new THREE.IcosahedronGeometry(0.75, 1), cloudMaterial);
    puff.position.set((i - 2) * 0.6, Math.sin(i * 1.7) * 0.18, Math.cos(i * 1.2) * 0.25);
    puff.scale.set(1.2, 0.45, 0.7);
    cloud.add(puff);
  }
  cloud.position.set(x, y, z);
  cloud.scale.setScalar(scale);
  clouds.add(cloud);
});
world.add(clouds);

function createTuftGeometry() {
  const positions = [];
  const indices = [];
  const random = seeded(4711);
  const bladeCount = 7;
  const segments = 3;

  for (let blade = 0; blade < bladeCount; blade++) {
    const angle = (blade / bladeCount) * Math.PI * 2 + (random() - 0.5) * 0.45;
    const dx = Math.cos(angle);
    const dz = Math.sin(angle);
    const px = -dz;
    const pz = dx;
    const radius = 0.012 + random() * 0.035;
    const height = 0.52 + random() * 0.28;
    const bend = 0.06 + random() * 0.09;
    const baseWidth = 0.012 + random() * 0.007;
    const startIndex = positions.length / 3;

    for (let segment = 0; segment <= segments; segment++) {
      const t = segment / segments;
      const width = baseWidth * (1 - t * 0.88);
      const along = radius + bend * t * t;
      const cx = dx * along;
      const cz = dz * along;
      const y = t * height;
      positions.push(cx + px * width, y, cz + pz * width);
      positions.push(cx - px * width, y, cz - pz * width);
    }

    for (let segment = 0; segment < segments; segment++) {
      const a = startIndex + segment * 2;
      const b = a + 1;
      const c = a + 2;
      const d = a + 3;
      indices.push(a, c, b, b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

const tuftGeometry = createTuftGeometry();
const regionObjects = [];
const regionRoot = new THREE.Group();
world.add(regionRoot);
const dummy = new THREE.Object3D();
const colorScratch = new THREE.Color();
const cropColorScratch = new THREE.Color();
const baseStageColor = new THREE.Color();

function makeRegionMesh(def, index) {
  const group = new THREE.Group();
  group.position.set(def.x, 0, def.z);
  regionRoot.add(group);

  const soilMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#786449'),
    map: fieldTexture,
    roughness: 1
  });
  const soil = new THREE.Mesh(new THREE.BoxGeometry(def.w, 0.1, def.d), soilMaterial);
  soil.position.y = -0.015;
  soil.userData.regionId = def.id;
  group.add(soil);

  const paddyMaterial = new THREE.MeshStandardMaterial({
    color: 0x6b9d91,
    transparent: true,
    opacity: 0.42,
    roughness: 0.3,
    metalness: 0.02,
    depthWrite: false
  });
  const paddy = new THREE.Mesh(new THREE.PlaneGeometry(def.w - 0.1, def.d - 0.1), paddyMaterial);
  paddy.rotation.x = -Math.PI / 2;
  paddy.position.y = 0.052;
  paddy.visible = false;
  group.add(paddy);

  const cropMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.92,
    side: THREE.DoubleSide,
    vertexColors: false
  });
  const random = seeded(8100 + index * 101);
  const plants = [];
  const cols = Math.max(5, Math.floor((def.w - 0.22) / 0.135));
  const rows = Math.max(6, Math.floor((def.d - 0.2) / 0.17));
  for (let ix = 0; ix < cols; ix++) {
    for (let iz = 0; iz < rows; iz++) {
      const stagger = (iz % 2) * 0.035;
      plants.push({
        x: -def.w / 2 + 0.12 + ix * ((def.w - 0.24) / Math.max(1, cols - 1)) + stagger,
        z: -def.d / 2 + 0.11 + iz * ((def.d - 0.2) / Math.max(1, rows - 1)),
        scale: 0.82 + random() * 0.3,
        rotation: random() * Math.PI * 2,
        color: 0.94 + random() * 0.11
      });
    }
  }

  const crops = new THREE.InstancedMesh(tuftGeometry, cropMaterial, plants.length);
  crops.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  crops.frustumCulled = false;
  crops.userData.regionId = def.id;
  group.add(crops);

  const overlayMaterial = new THREE.MeshBasicMaterial({
    color: 0x2f8e7c,
    transparent: true,
    opacity: 0.12,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const overlay = new THREE.Mesh(new THREE.PlaneGeometry(def.w - 0.08, def.d - 0.08), overlayMaterial);
  overlay.rotation.x = -Math.PI / 2;
  overlay.position.y = 0.069;
  group.add(overlay);

  const edgeMaterial = new THREE.LineBasicMaterial({
    color: 0x2b8e80,
    transparent: true,
    opacity: 0.32
  });
  const edge = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-def.w / 2, 0.078, -def.d / 2),
      new THREE.Vector3(def.w / 2, 0.078, -def.d / 2),
      new THREE.Vector3(def.w / 2, 0.078, def.d / 2),
      new THREE.Vector3(-def.w / 2, 0.078, def.d / 2)
    ]),
    edgeMaterial
  );
  group.add(edge);

  const marker = new THREE.Group();
  marker.position.y = 0.08;
  marker.visible = false;
  const beacon = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.09, 0.72, 12, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0xb34935,
      transparent: true,
      opacity: 0.62,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );
  beacon.position.y = 0.36;
  marker.add(beacon);
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.17, 0.24, 36),
    new THREE.MeshBasicMaterial({
      color: 0xb34935,
      transparent: true,
      opacity: 0.72,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.012;
  marker.add(ring);

  const selectedCorner = new THREE.Mesh(
    new THREE.RingGeometry(Math.min(def.w, def.d) * 0.28, Math.min(def.w, def.d) * 0.31, 4),
    new THREE.MeshBasicMaterial({
      color: 0xf5ede0,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );
  selectedCorner.rotation.x = -Math.PI / 2;
  selectedCorner.rotation.z = Math.PI / 4;
  selectedCorner.position.y = 0.075;
  selectedCorner.visible = false;
  group.add(selectedCorner);
  group.add(marker);

  return {
    id: def.id,
    def,
    group,
    soil,
    soilMaterial,
    paddy,
    paddyMaterial,
    cropMaterial,
    crops,
    plants,
    overlay,
    overlayMaterial,
    edge,
    edgeMaterial,
    marker,
    beacon,
    ring,
    selectedCorner,
    center: new THREE.Vector3(def.x, 0.52, def.z)
  };
}

function disposeRegionObjects() {
  regionObjects.forEach((region) => {
    region.group.traverse((child) => {
      if (child.geometry && child.geometry !== tuftGeometry) child.geometry.dispose();
      if (child.material) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((material) => material.dispose());
      }
    });
    regionRoot.remove(region.group);
  });
  regionObjects.length = 0;
  pinElements.clear();
  pinsRoot.innerHTML = '';
  zoneGrid.innerHTML = '';
}

function rebuildRegionObjects() {
  disposeRegionObjects();
  regions.forEach((def, index) => {
    regionObjects.push(makeRegionMesh(def, index));
  });
  buildPins();
  buildZoneButtons();
}

const pinElements = new Map();
const infraElements = [];
function buildPins() {
  pinsRoot.innerHTML = '';
  pinElements.clear();
  regions.forEach((def) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'field-pin';
    button.dataset.region = def.id;
    button.innerHTML = `<span class="pin-dot"></span><span class="pin-label">${def.short}</span>`;
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      selectRegion(def.id);
    });
    pinsRoot.appendChild(button);
    pinElements.set(def.id, button);
  });
}

function buildInfraLabels() {
  infraLabelsRoot.innerHTML = '';
  infraElements.length = 0;
  [
    { label: '气象站 · 演示', position: new THREE.Vector3(-4.78, 0.8, -4.75) },
    { label: '南侧灌渠', position: new THREE.Vector3(0.4, 0.35, 3.8) },
    { label: '西侧蓄水池', position: new THREE.Vector3(-7.35, 0.38, 4.55) }
  ].forEach((item) => {
    const label = document.createElement('span');
    label.className = 'infra-label';
    label.textContent = item.label;
    infraLabelsRoot.appendChild(label);
    infraElements.push({ element: label, position: item.position });
  });
}

function buildZoneButtons() {
  zoneGrid.innerHTML = '';
  regions.forEach((def) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'zone-button';
    button.dataset.zone = def.id;
    button.innerHTML = `<b>${def.index}</b><span>${def.name}</span><i></i>`;
    button.addEventListener('click', () => selectRegion(def.id));
    zoneGrid.appendChild(button);
  });
}

buildInfraLabels();
rebuildRegionObjects();

let draftZones = [];

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function zoneId() {
  return `zone-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function defaultZoneName(tag, number) {
  const names = {
    weak: '苗情观察区',
    low: '低洼排水区',
    canal: '近渠检查区',
    dry: '墒情观察区',
    control: '正常对照区',
    general: '常规管理区'
  };
  return `${names[tag] || '管理区'}${number > 1 ? ` ${number}` : ''}`;
}

function createDraftZones(count, layout, previous = []) {
  const geometry = calculateLayout(count, layout);
  const tagUsage = {};
  return geometry.map((item, index) => {
    const existing = previous[index];
    const tag = existing?.tag || item.tag;
    tagUsage[tag] = (tagUsage[tag] || 0) + 1;
    return {
      id: existing?.id || zoneId(),
      name: existing?.name || defaultZoneName(tag, tagUsage[tag]),
      tag
    };
  });
}

function populateFarmRegions() {
  farmRegionInput.innerHTML = Object.keys(regionProfiles)
    .map((region) => `<option value="${region}">${region}</option>`)
    .join('');
}

function renderFarmList() {
  farmList.innerHTML = '';
  farmRecords.forEach((farm) => {
    const crop = cropProfiles[farm.crop] || cropProfiles.other;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'farm-list-item';
    button.dataset.farmId = farm.id;
    button.setAttribute('aria-pressed', String(farm.id === farmIdInput.value));
    button.innerHTML = `
      <span class="farm-list-mark">${escapeHtml(crop.short.slice(0, 1))}</span>
      <span class="farm-list-copy">
        <strong>${escapeHtml(farm.name)}</strong>
        <small>${escapeHtml(farm.region)} · ${farm.area} 亩 · ${escapeHtml(crop.name)}</small>
      </span>
      <em>${farm.id === activeFarmId ? '当前' : `${farm.zones.length} 区`}</em>
    `;
    button.addEventListener('click', () => loadFarmIntoForm(farm));
    farmList.appendChild(button);
  });
}

function tagOptions(selected) {
  return Object.entries(zoneTagProfiles)
    .map(([tag, profile]) => `<option value="${tag}" ${tag === selected ? 'selected' : ''}>${profile.label}</option>`)
    .join('');
}

function renderZoneEditor() {
  zoneEditor.innerHTML = draftZones.map((zone, index) => `
    <div class="zone-config-row" data-index="${index}">
      <span class="zone-config-index">${String(index + 1).padStart(2, '0')}</span>
      <input type="text" maxlength="18" value="${escapeHtml(zone.name)}" data-zone-name aria-label="第 ${index + 1} 个区块名称">
      <select data-zone-tag aria-label="第 ${index + 1} 个区块关注类型">${tagOptions(zone.tag)}</select>
      <button type="button" class="zone-remove" data-remove-zone aria-label="删除第 ${index + 1} 个区块">移除</button>
    </div>
  `).join('');
  renderFarmPreview();
}

function renderFarmPreview() {
  const layout = farmLayoutInput.value;
  const count = draftZones.length;
  const cols = layout === 'strip' || count === 1 ? 1 : count <= 4 ? 2 : count <= 9 ? 3 : 4;
  farmPreview.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
  farmPreview.innerHTML = draftZones.map((zone) => {
    const tag = zoneTagProfiles[zone.tag] || zoneTagProfiles.general;
    return `
      <div class="farm-preview-zone" data-tag="${zone.tag}">
        <strong>${escapeHtml(zone.name || '未命名区块')}</strong>
        <span>${tag.label}</span>
      </div>
    `;
  }).join('');
  renderFarmSummary();
}

function renderFarmSummary() {
  const crop = cropProfiles[farmCropInput.value] || cropProfiles.other;
  const layoutName = farmLayoutInput.selectedOptions[0]?.textContent || '分区';
  const area = farmAreaInput.value || '未填';
  const soil = farmSoilInput.value || '土壤待定';
  const irrigation = farmIrrigationInput.value || '灌溉待定';
  farmConfigSummary.innerHTML = `
    <b>配置摘要</b>
    <span>${escapeHtml(crop.name)}</span>
    <span>${escapeHtml(area)} 亩</span>
    <span>${escapeHtml(soil)}</span>
    <span>${escapeHtml(irrigation)}</span>
    <span>${escapeHtml(layoutName)}</span>
    <span>${draftZones.length} 个场地</span>
    <em>保存后立即重建三维</em>
  `;
}

function readDraftZones() {
  return [...zoneEditor.querySelectorAll('.zone-config-row')].map((row, index) => ({
    id: draftZones[index]?.id || zoneId(),
    name: row.querySelector('[data-zone-name]').value.trim() || `管理区 ${index + 1}`,
    tag: row.querySelector('[data-zone-tag]').value
  }));
}

function syncDraftFromEditor() {
  draftZones = readDraftZones();
  renderFarmPreview();
}

function setFarmDraft(farm) {
  farmIdInput.value = farm.id;
  farmNameInput.value = farm.name;
  farmRegionInput.value = farm.region;
  farmAreaInput.value = farm.area;
  farmCropInput.value = farm.crop;
  farmSowingInput.value = farm.sowingDate;
  farmSoilInput.value = farm.soil;
  farmIrrigationInput.value = farm.irrigation;
  farmLayoutInput.value = farm.layout || 'standard';
  farmZoneCountInput.value = String(farm.zones.length);
  draftZones = farm.zones.map((zone) => ({ id: zone.id, name: zone.name, tag: zone.tag }));
  farmFormError.textContent = '';
  deleteFarmButton.disabled = false;
  renderZoneEditor();
  renderFarmList();
}

function loadFarmIntoForm(farm) {
  setFarmDraft(farm);
  farmFormHint.textContent = `${farm.name} 已载入。修改后点击“保存并查看三维”。`;
  farmForm.scrollTop = 0;
}

function startNewFarmDraft() {
  const count = 6;
  const today = state.date || formatISODate(new Date());
  setFarmDraft({
    id: `farm-${Date.now()}`,
    name: '新农田',
    region: state.region,
    area: 3,
    crop: 'wheat',
    sowingDate: addDays(today, -23),
    soil: '壤土',
    irrigation: '渠灌',
    layout: 'grid',
    zones: createDraftZones(count, 'grid')
  });
  deleteFarmButton.disabled = true;
  farmNameInput.focus();
  farmNameInput.select();
  farmFormHint.textContent = '这是一块尚未保存的新农田。设置作物和分区后，点击“保存并查看三维”。';
}

function openFarmManager(focusZoneId = null) {
  stopSpeaking();
  populateFarmRegions();
  setFarmDraft(activeFarm());
  farmManager.hidden = false;
  document.body.classList.add('farm-open');
  farmForm.scrollTop = 0;
  farmClose.focus();
  if (focusZoneId) {
    requestAnimationFrame(() => {
      const index = draftZones.findIndex((zone) => zone.id === focusZoneId);
      const row = zoneEditor.querySelectorAll('.zone-config-row')[index];
      if (!row) return;
      row.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' });
      row.classList.add('zone-row-focus');
      row.querySelector('[data-zone-name]')?.focus({ preventScroll: true });
      window.setTimeout(() => row.classList.remove('zone-row-focus'), 1600);
    });
  }
}

function closeFarmManager() {
  farmManager.hidden = true;
  document.body.classList.remove('farm-open');
}

function saveFarmRecords() {
  try {
    localStorage.setItem(FARM_STORAGE_KEY, JSON.stringify(farmRecords));
    localStorage.setItem(ACTIVE_FARM_KEY, activeFarmId);
  } catch (_) {
    showToast('浏览器未允许本地保存，当前农田只在本次打开期间有效。');
  }
}

function activateFarm(id, options = {}) {
  const farm = farmRecords.find((item) => item.id === id);
  if (!farm) return;
  activeFarmId = farm.id;
  farm.region = regionProfiles[farm.region] ? farm.region : '睢阳区';
  farm.lastDate = farm.lastDate || state.date;
  state.region = farm.region;
  state.date = farm.lastDate;
  state.weekStart = state.date;
  state.recorded = false;
  state.weekFocus = null;
  regions = materializeFarmZones(farm);
  state.selected = regions[0]?.id || 'zone-01';
  const referenceStage = inferStage(getDaysAfterSowing(state.date));
  if (referenceStage.id) state.stage = referenceStage.id;
  rebuildRegionObjects();
  renderContext();
  renderDateContext();
  updateCropMatrices();
  updateCropColors();
  applyWeather();
  renderDecision();
  renderWeek();
  renderZoneState();
  renderLayer();
  renderSceneMarkers();
  document.querySelectorAll('#stageControls button').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.stage === state.stage));
  });
  setCameraView('overview', true);
  saveFarmRecords();
  saveContext();
  if (options.close !== false) closeFarmManager();
  showToast(`已切换到“${farm.name}”：${activeCrop().name}，${regions.length} 个管理区块。`);
}

function saveFarmFromForm(event) {
  event.preventDefault();
  syncDraftFromEditor();
  const name = farmNameInput.value.trim();
  const area = Number(farmAreaInput.value);
  if (!name) {
    farmFormError.textContent = '请填写农田名称。';
    farmNameInput.focus();
    return;
  }
  if (!Number.isFinite(area) || area < 0.1 || area > 1000) {
    farmFormError.textContent = '面积应在 0.1 到 1000 亩之间。';
    farmAreaInput.focus();
    return;
  }
  if (!draftZones.length) {
    farmFormError.textContent = '至少保留一个管理区块。';
    return;
  }
  if (draftZones.some((zone) => !zone.name.trim())) {
    farmFormError.textContent = '每个管理区块都需要名称。';
    return;
  }
  if (!farmSowingInput.value) {
    farmFormError.textContent = '请选择播种日期。';
    farmSowingInput.focus();
    return;
  }

  const existing = farmRecords.find((farm) => farm.id === farmIdInput.value);
  const farm = {
    id: farmIdInput.value || `farm-${Date.now()}`,
    name,
    region: farmRegionInput.value,
    area,
    crop: farmCropInput.value,
    sowingDate: farmSowingInput.value,
    soil: farmSoilInput.value,
    irrigation: farmIrrigationInput.value,
    layout: farmLayoutInput.value,
    zones: draftZones.map((zone) => ({ ...zone })),
    createdAt: existing?.createdAt || new Date().toISOString(),
    lastDate: existing?.lastDate || state.date,
    demo: false
  };
  farm.zones = materializeFarmZones(farm);
  if (existing) {
    farmRecords = farmRecords.map((item) => item.id === farm.id ? farm : item);
  } else {
    farmRecords.push(farm);
  }
  activeFarmId = farm.id;
  saveFarmRecords();
  activateFarm(farm.id, { close: true });
}

newFarmButton.addEventListener('click', startNewFarmDraft);
farmForm.addEventListener('submit', saveFarmFromForm);
farmForm.addEventListener('input', () => {
  farmFormError.textContent = '';
  renderFarmSummary();
});
farmForm.addEventListener('change', () => {
  farmFormError.textContent = '';
  renderFarmSummary();
});
document.querySelectorAll('[data-open-farm]').forEach((button) => button.addEventListener('click', () => openFarmManager()));
editSelectedZoneButton.addEventListener('click', () => openFarmManager(state.selected));
farmClose.addEventListener('click', closeFarmManager);
farmCancel.addEventListener('click', closeFarmManager);
farmScrim.addEventListener('click', closeFarmManager);
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !farmManager.hidden) closeFarmManager();
});
zoneEditor.addEventListener('input', (event) => {
  if (event.target.matches('[data-zone-name]')) {
    const index = Number(event.target.closest('.zone-config-row').dataset.index);
    if (draftZones[index]) draftZones[index].name = event.target.value;
    renderFarmPreview();
  }
});
zoneEditor.addEventListener('change', (event) => {
  if (event.target.matches('[data-zone-tag]')) {
    const index = Number(event.target.closest('.zone-config-row').dataset.index);
    if (draftZones[index]) draftZones[index].tag = event.target.value;
    renderFarmPreview();
  }
});
zoneEditor.addEventListener('click', (event) => {
  const remove = event.target.closest('[data-remove-zone]');
  if (!remove) return;
  if (draftZones.length <= 1) {
    farmFormError.textContent = '至少保留一个管理区块。';
    return;
  }
  syncDraftFromEditor();
  const index = Number(remove.closest('.zone-config-row').dataset.index);
  draftZones.splice(index, 1);
  farmZoneCountInput.value = String(draftZones.length);
  renderZoneEditor();
});
addZoneButton.addEventListener('click', () => {
  if (draftZones.length >= 12) {
    farmFormError.textContent = '最多支持 12 个管理区块。';
    return;
  }
  syncDraftFromEditor();
  const tag = 'general';
  draftZones.push({
    id: zoneId(),
    name: defaultZoneName(tag, draftZones.filter((zone) => zone.tag === tag).length + 1),
    tag
  });
  farmZoneCountInput.value = String(draftZones.length);
  renderZoneEditor();
});
farmZoneCountInput.addEventListener('change', () => {
  syncDraftFromEditor();
  draftZones = createDraftZones(Number(farmZoneCountInput.value), farmLayoutInput.value, draftZones);
  renderZoneEditor();
});
farmLayoutInput.addEventListener('change', () => {
  syncDraftFromEditor();
  draftZones = createDraftZones(draftZones.length, farmLayoutInput.value, draftZones);
  renderZoneEditor();
});
farmCropInput.addEventListener('change', () => {
  const crop = cropProfiles[farmCropInput.value];
  farmFormHint.textContent = crop.guidance;
});
deleteFarmButton.addEventListener('click', () => {
  const farm = farmRecords.find((item) => item.id === farmIdInput.value);
  if (!farm) return;
  if (farmRecords.length <= 1) {
    farmFormError.textContent = '至少保留一块农田；可以修改这块农田，不能全部删除。';
    return;
  }
  if (!window.confirm(`确定删除“${farm.name}”吗？本机保存的这块农田配置会被移除。`)) return;
  farmRecords = farmRecords.filter((item) => item.id !== farm.id);
  if (activeFarmId === farm.id) activeFarmId = farmRecords[0].id;
  saveFarmRecords();
  activateFarm(activeFarmId, { close: false });
  setFarmDraft(activeFarm());
  showToast(`已删除“${farm.name}”，当前切换到“${activeFarm().name}”。`);
});

function renderContext() {
  const region = regionProfiles[state.region] || regionProfiles['睢阳区'];
  const profile = weathers[state.weather];
  const farm = activeFarm();
  const crop = activeCrop();
  if (state.scanFinding && state.scanFindingFarm !== farm.id) {
    state.scanFinding = false;
    state.scanFindingFarm = null;
    scanFindingPin.hidden = true;
    scanFindingNote.hidden = true;
    scanFindingBeacon.visible = false;
    scanButton.querySelector('b').textContent = 'AI巡田示意';
  }
  regionSelect.value = state.region;
  dateInput.value = state.date;
  weatherSelect.value = state.weather;
  contextHint.textContent = `${state.region} · ${profile.name} · ${crop.name}`;
  plotName.textContent = farm.name;
  plotCrop.textContent = crop.name;
  plotLocation.textContent = `商丘市${state.region} · ${farm.area} 亩 · ${farm.soil} · ${farm.irrigation}`;
  scenePlotName.textContent = `${state.region} · ${farm.name}`;
  localServiceLabel.textContent = `${state.region} · 本地参考`;
  localServiceLabel.title = region.hint;
  cropStages().forEach((stage, index) => {
    const button = document.querySelectorAll('#stageControls button')[index];
    if (button) button.textContent = stage.name;
  });
}

function renderDateContext() {
  const days = getDaysAfterSowing(state.date);
  const referenceStage = inferStage(days);
  const farm = activeFarm();
  const crop = activeCrop();
  const displayStage = stageDefinition(state.stage);
  dateEl.textContent = formatDecisionDate(state.date);
  plotStage.textContent = days < 1 ? referenceStage.name : `${referenceStage.name}期`;
  plotDays.textContent = days < 1 ? '未到参考播期' : `${days} 天`;
  sceneContextLabel.textContent = `${weathers[state.weather].name} · ${crop.short}${displayStage.name}示意 · ${farm.area} 亩 · ${regions.length} 个管理区`;
  chatContext.textContent = `本次问答会带上：${state.region} · ${farm.name} · ${crop.name} · ${displayStage.name} · ${weathers[state.weather].name}`;
}

function renderWeek() {
  const pattern = weekPatterns[state.weekPattern] || weekPatterns.normal;
  weekRange.textContent = `${formatShortDate(state.weekStart)}—${formatShortDate(addDays(state.weekStart, 6))} · 演示情形`;
  weekDays.innerHTML = '';

  pattern.forEach((day, index) => {
    const dayDate = addDays(state.weekStart, day.offset);
    const dayWeather = weathers[day.weather];
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'week-day';
    button.dataset.tone = day.tone;
    button.dataset.index = String(index);
    button.dataset.date = dayDate;
    button.setAttribute('aria-pressed', String(dayDate === state.date));
    button.setAttribute('aria-label', `${formatShortDate(dayDate)} ${formatWeekday(dayDate)}，${day.tag}，${localizeZoneCopy(day.title)}，${localizeZoneCopy(day.note)}`);
    button.innerHTML = `
      <span class="week-day-top">
        <span>${formatShortDate(dayDate)} ${formatWeekday(dayDate)}</span>
        <em>${day.tag}</em>
      </span>
      <strong>${localizeZoneCopy(day.title)}</strong>
      <small>${localizeZoneCopy(day.note)}</small>
    `;
    button.addEventListener('click', () => selectWeekDay(day, dayDate));
    weekDays.appendChild(button);
  });
}

function selectWeekDay(day, dayDate) {
  state.date = dayDate;
  dateInput.value = dayDate;
  state.recorded = false;
  state.selected = regions.find((region) => region.role === day.zone)?.id || regions[0]?.id;
  activeFarm().lastDate = dayDate;
  state.weekFocus = { ...day, date: dayDate };
  const referenceDays = getDaysAfterSowing(dayDate);
  const referenceStage = inferStage(referenceDays);
  if (referenceStage.id) setStage(referenceStage.id, { announce: false, source: 'date' });
  setWeather(day.weather, { keepWeekPattern: true, keepWeekFocus: true, announce: false });
  renderDateContext();
  renderWeek();
  renderZoneState();
  renderLayer();
  saveContext();
  saveFarmRecords();
  showToast(`${formatShortDate(dayDate)} ${day.tag}：${localizeZoneCopy(day.title)}。${localizeZoneCopy(day.note)}`);
}

function riskFor(id) {
  const region = regions.find((item) => item.id === id);
  return weathers[state.weather].risks[region?.role] || 'normal';
}

function severityLabel(id) {
  return { risk: '重点查看', watch: '持续留意', normal: '状态平稳' }[riskFor(id)];
}

function regionHint(def) {
  return weathers[state.weather].zoneHints[def.role] || def.note;
}

function zoneByTag(tag) {
  return regions.find((region) => region.tag === tag);
}

function localizeZoneCopy(text) {
  const weak = zoneByTag('weak');
  const low = zoneByTag('low');
  const canal = zoneByTag('canal');
  const dry = zoneByTag('dry');
  const control = zoneByTag('control');
  const firstZone = regions[0]?.name || '当前管理区块';
  const replacements = [
    ['北侧弱苗区', weak?.name || firstZone],
    ['东侧低洼区', low?.name || firstZone],
    ['南侧近渠区', canal?.name || firstZone],
    ['东北正常区', control?.name || firstZone],
    ['中部正常区', dry?.name || firstZone],
    ['北侧弱苗叶片', `${weak?.short || regions[0]?.short || '当前区块'}叶片`],
    ['北侧弱苗和南侧地头', `${weak?.short || regions[0]?.short || '当前区块'}和${canal?.short || regions[1]?.short || '地头'}地头`],
    ['中部与东北部', `${dry?.short || regions[0]?.short || '当前区块'}与${control?.short || regions[1]?.short || '对照区'}`],
    ['北侧弱苗', weak?.short || regions[0]?.short || '当前区块'],
    ['东侧地块', low?.name || firstZone],
    ['东侧地头', `${low?.short || regions[0]?.short || '当前区块'}地头`],
    ['南侧地头', `${canal?.short || regions[1]?.short || '当前区块'}地头`],
    ['东北部', control?.short || regions[1]?.short || '当前区块'],
    ['中部', dry?.short || regions[0]?.short || '当前区块']
  ];
  return replacements.reduce((result, [from, to]) => result.replaceAll(from, to), text);
}

function localizedHealth(profile) {
  const first = regions[0]?.short || '当前区块';
  if (state.weather === 'cold') return `${zoneByTag('weak')?.short || first}重点复核`;
  if (state.weather === 'rain') return `${zoneByTag('low')?.short || first}先查排水`;
  if (state.weather === 'drought') return `${zoneByTag('dry')?.short || first}先查墒`;
  if (state.weather === 'normal') return `${zoneByTag('low')?.short || first}先看排水`;
  return profile.health;
}

function layerColor(id) {
  if (state.layer === 'risk') {
    return { risk: 0xb34935, watch: 0xd49a37, normal: 0x2f8e7c }[riskFor(id)];
  }
  if (state.layer === 'vigor') {
    const region = regions.find((item) => item.id === id);
    if (region?.tag === 'weak') return 0xd1a13d;
    if (riskFor(id) === 'risk') return 0xb86732;
    return region?.tag === 'dry' ? 0x5f9360 : 0x3f8b70;
  }
  const region = regions.find((item) => item.id === id);
  if (region?.tag === 'low' || region?.tag === 'canal') return 0x528b9e;
  if (region?.tag === 'dry') return 0xc9a65e;
  return 0x5b967d;
}

function updateCropColors() {
  const stage = stageDefinition(state.stage);
  const crop = activeCrop();
  baseStageColor.set(stage.color);
  cropColorScratch.set(crop.color || stage.color);
  regionObjects.forEach((region) => {
    region.crops.count = Math.max(1, Math.floor(region.plants.length * stage.density * crop.densityScale));
    for (let i = 0; i < region.plants.length; i++) {
      const plant = region.plants[i];
      colorScratch.copy(baseStageColor);
      if (region.def.tag === 'weak') colorScratch.multiplyScalar(0.9);
      if (state.stage !== 'mature') colorScratch.lerp(cropColorScratch, 0.22);
      colorScratch.multiplyScalar(plant.color);
      if (state.stage === 'mature') colorScratch.offsetHSL((plant.color - 1) * 0.012, 0.02, (plant.color - 1) * 0.05);
      region.crops.setColorAt(i, colorScratch);
    }
    if (region.crops.instanceColor) region.crops.instanceColor.needsUpdate = true;
  });
}

function updateCropMatrices() {
  const stage = stageDefinition(state.stage);
  const crop = activeCrop();
  regionObjects.forEach((region) => {
    region.crops.count = Math.max(1, Math.floor(region.plants.length * stage.density * crop.densityScale));
    region.plants.forEach((plant, index) => {
      dummy.position.set(plant.x, 0.045, plant.z);
      dummy.rotation.set(0, plant.rotation, 0);
      dummy.scale.set(1, stage.height * crop.heightScale * plant.scale, 1);
      dummy.updateMatrix();
      region.crops.setMatrixAt(index, dummy.matrix);
    });
    region.crops.instanceMatrix.needsUpdate = true;
    region.crops.computeBoundingSphere();
  });
}

function renderDecision() {
  const profile = currentProfile();
  const standardProfile = weathers[state.weather];
  const farm = activeFarm();
  const crop = activeCrop();
  const days = getDaysAfterSowing(state.date);
  const referenceStage = inferStage(days);
  const weekFocus = state.weekFocus && state.weekFocus.date === state.date ? state.weekFocus : null;
  decisionLevel.textContent = weekFocus ? weekFocus.tag : profile.level;
  decisionTitle.textContent = weekFocus ? localizeZoneCopy(weekFocus.title) : localizeZoneCopy(profile.title);
  decisionReason.textContent = weekFocus
    ? `今天先办：${localizeZoneCopy(weekFocus.note)} ${localizeZoneCopy(profile.reason)}`
    : localizeZoneCopy(profile.reason);
  const evidence = profile.evidence.replace(/当前分蘖期|分蘖期/g, `${referenceStage.name}期，作物${crop.name}`);
  decisionEvidence.textContent = `${localizeZoneCopy(evidence)} 当前农田：${farm.name}，作物${crop.name}，${days >= 1 ? `播后参考第 ${days} 天、${referenceStage.name}期` : '尚未到参考播期'}。`;
  actionList.innerHTML = profile.actions.map(([lead, text], index) => (
    `<li><span>${String(index + 1).padStart(2, '0')}</span><p><b>${lead}</b>${localizeZoneCopy(text)}</p></li>`
  )).join('');
  recordAction.disabled = state.recorded;
  recordAction.textContent = state.recorded ? '已记入今日农事' : '记入今日农事';
  recordCount.textContent = state.recorded ? '已记录 1 项' : '1 项待确认';
  healthTitle.textContent = localizedHealth(profile);
  healthSeal.textContent = standardProfile.seal;
  healthSummary.textContent = `${crop.guidance} ${state.dialect ? '这是田间话辅助，不是方言识别。' : ''}`;
  actionMetric.textContent = '1';
  dialectToggle.setAttribute('aria-pressed', String(state.dialect));
  dialectToggle.setAttribute('aria-label', state.dialect ? '切换为普通话版' : '切换为田间话辅助版');
}

function renderZoneState() {
  const riskCount = regions.filter((item) => riskFor(item.id) !== 'normal').length;
  riskMetric.textContent = String(riskCount + (state.scanFinding ? 1 : 0));
  zoneMetric.textContent = String(regions.length);
  zoneSectionLabel.textContent = `${regions.length} 个管理区块`;
  document.querySelectorAll('.zone-button').forEach((button) => {
    const id = button.dataset.zone;
    button.dataset.severity = riskFor(id);
    button.classList.toggle('active', id === state.selected);
    button.setAttribute('aria-pressed', String(id === state.selected));
    button.querySelector('i').title = severityLabel(id);
  });
  pinElements.forEach((pin, id) => {
    pin.dataset.severity = riskFor(id);
    pin.classList.toggle('selected', id === state.selected);
    pin.setAttribute('aria-pressed', String(id === state.selected));
  });

  const severityOrder = { risk: 0, watch: 1, normal: 2 };
  const route = [...regions]
    .sort((a, b) => severityOrder[riskFor(a.id)] - severityOrder[riskFor(b.id)])
    .slice(0, 3);
  routeList.innerHTML = route.map((region, index) => (
    `<li data-severity="${riskFor(region.id)}"><span>${index + 1}</span><b>${region.short}</b><em>${severityLabel(region.id)}</em></li>`
  )).join('') + (state.scanFinding
    ? '<li class="scan-watch" data-severity="watch"><span>AI</span><b>西北角</b><em>持续留意 · 轻微干旱</em></li>'
    : '');

  const selected = regions.find((item) => item.id === state.selected);
  if (selected) {
    zoneDetailIndex.textContent = selected.index;
    zoneDetailTitle.textContent = selected.name;
    zoneDetailText.textContent = regionHint(selected);
    zoneDetailTag.textContent = `${severityLabel(selected.id)} · 长势${selected.vigor} · 墒情${selected.moisture}`;
  }
}

function renderLayer() {
  const info = layerInfo[state.layer];
  layerCaption.textContent = info.caption;
  layerLegend.innerHTML = info.legend.map(([tone, label]) => (
    `<span><i class="legend-dot ${tone}"></i>${label}</span>`
  )).join('');
  document.querySelectorAll('.layer-switch button').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.layer === state.layer));
  });
  regionObjects.forEach((region) => {
    const severity = riskFor(region.id);
    region.overlayMaterial.color.setHex(layerColor(region.id));
    region.overlayMaterial.opacity = state.layer === 'risk'
      ? (severity === 'risk' ? 0.34 : severity === 'watch' ? 0.24 : 0.075)
      : 0.2;
    region.edgeMaterial.color.setHex(layerColor(region.id));
    region.edgeMaterial.opacity = state.selected === region.id ? 0.95 : severity === 'normal' ? 0.24 : 0.6;
    region.selectedCorner.visible = state.selected === region.id;
  });
}

function renderSceneMarkers() {
  regionObjects.forEach((region) => {
    const severity = riskFor(region.id);
    region.marker.visible = severity !== 'normal';
    const markerColor = severity === 'risk' ? 0xb34935 : 0xd49a37;
    region.beacon.material.color.setHex(markerColor);
    region.ring.material.color.setHex(markerColor);
    region.marker.scale.setScalar(severity === 'risk' ? 1 : 0.84);
  });
}

function applyWeather() {
  const profile = weathers[state.weather];
  sceneFrame.style.background = `
    radial-gradient(circle at 72% 16%, rgba(255, 250, 228, 0.92), transparent 34%),
    linear-gradient(180deg, ${profile.sky[0]} 0%, ${profile.sky[1]} 60%, ${profile.sky[2]} 100%)
  `;
  scene.fog.color.setHex(profile.fog);
  sun.intensity = profile.sun;
  hemi.intensity = profile.hemi;
  waterMaterial.opacity = profile.water;
  water.visible = state.weather !== 'drought';
  eastDitchWater.visible = state.weather !== 'drought';
  eastDitchWaterMaterial.opacity = state.weather === 'rain' ? 0.86 : state.weather === 'normal' ? 0.16 : 0.08;
  regionObjects.forEach((region) => {
    region.paddy.visible = Boolean(activeCrop().paddy);
    region.paddyMaterial.opacity = state.weather === 'rain' ? 0.62 : state.weather === 'drought' ? 0.24 : 0.42;
  });
  waterGlints.forEach((glint) => {
    glint.visible = state.weather !== 'drought';
    glint.material.opacity = state.weather === 'rain' ? 0.78 : 0.48;
  });
  cloudMaterial.opacity = state.weather === 'normal' ? 0.24 : state.weather === 'drought' ? 0.08 : 0.35;
  cloudMaterial.color.setHex(state.weather === 'cold' ? 0xd8e2e7 : 0xf8f5e9);
  rain.visible = state.weather === 'rain';
  windLines.visible = state.weather === 'wind';
  frostPoints.visible = state.weather === 'cold';
  crackLines.visible = state.weather === 'drought';
  syncTime.textContent = new Date().toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

function renderSelectedInScene() {
  regionObjects.forEach((region) => {
    region.selectedCorner.visible = state.selected === region.id;
  });
}

function selectRegion(id) {
  if (!regions.some((region) => region.id === id)) return;
  state.selected = id;
  renderZoneState();
  renderLayer();
  renderSelectedInScene();
  const region = regions.find((item) => item.id === id);
  showToast(`已定位 ${region.name}：${regionHint(region)}`);
}

function setWeather(id, options = {}) {
  if (!weathers[id]) return;
  stopSpeaking();
  state.weather = id;
  if (!options.keepWeekPattern) state.weekPattern = id;
  if (!options.keepWeekFocus) state.weekFocus = null;
  state.recorded = false;
  document.querySelectorAll('.weather-button').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.weather === id));
  });
  weatherSelect.value = id;
  applyWeather();
  renderContext();
  renderDateContext();
  renderDecision();
  renderZoneState();
  renderLayer();
  renderSceneMarkers();
  renderWeek();
  saveContext();
  if (options.announce !== false) {
    showToast(`已切换为“${weathers[id].name}”演示场景`);
  }
}

function setLayer(layer) {
  if (!layerInfo[layer]) return;
  state.layer = layer;
  renderLayer();
  showToast(`已切换到${layer === 'risk' ? '风险' : layer === 'vigor' ? '长势' : '墒情'}图层`);
}

function setStage(stageId, options = {}) {
  if (!stages.some((stage) => stage.id === stageId)) return;
  stopSpeaking();
  state.stage = stageId;
  document.querySelectorAll('#stageControls button').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.stage === stageId));
  });
  updateCropMatrices();
  updateCropColors();
  const stage = stageDefinition(stageId);
  renderDateContext();
  if (options.announce !== false) {
    showToast(`生育期示意：${stage.name}。只改变三维展示，参考阶段仍按所选日期计算。`);
  }
}

function setDate(value, options = {}) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return;
  stopSpeaking();
  state.date = value;
  if (!options.keepWeekStart) state.weekStart = value;
  activeFarm().lastDate = value;
  if (!options.keepWeekFocus) state.weekFocus = null;
  state.recorded = false;
  dateInput.value = value;
  const days = getDaysAfterSowing(value);
  const referenceStage = inferStage(days);
  if (referenceStage.id) setStage(referenceStage.id, { announce: false, source: 'date' });
  renderDateContext();
  renderDecision();
  renderWeek();
  saveContext();
  saveFarmRecords();
  if (options.announce !== false) {
    showToast(`参考日期已改为 ${formatShortDate(value)}，三维生育期同步为${referenceStage.name}示意。`);
  }
}

function setRegion(region) {
  if (!regionProfiles[region]) return;
  stopSpeaking();
  state.region = region;
  activeFarm().region = region;
  state.recorded = false;
  renderContext();
  renderDecision();
  saveContext();
  saveFarmRecords();
  showToast(`${region}：${regionProfiles[region].hint}`);
}

function setDialect(enabled) {
  stopSpeaking();
  state.dialect = Boolean(enabled);
  renderDecision();
  saveContext();
  showToast(state.dialect
    ? '已切换为田间话辅助。只换说法，不改变风险判断，也不会冒充方言识别。'
    : '已切换为普通话说明。');
}

function speechText() {
  const title = decisionTitle.textContent;
  const reason = decisionReason.textContent;
  const actions = [...actionList.querySelectorAll('li')]
    .map((item, index) => `第${index + 1}件事，${item.textContent.trim()}。`)
    .join('');
  return `${formatDecisionDate(state.date)}，${state.region}。${title}。${reason}${actions}判断依据：${decisionEvidence.textContent}。这是农事参考，不替代现场判断。`;
}

function stopSpeaking() {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  listenButton.setAttribute('aria-pressed', 'false');
  listenButton.querySelector('b').textContent = '听今天';
}

function speakToday() {
  if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
    listenButton.setAttribute('aria-pressed', 'false');
    listenButton.querySelector('b').textContent = '听今天';
    showToast('当前浏览器不支持语音朗读，完整判断文字仍可正常查看。');
    return;
  }

  if (listenButton.getAttribute('aria-pressed') === 'true') {
    stopSpeaking();
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(speechText());
  const voices = window.speechSynthesis.getVoices();
  const chineseVoice = voices.find((voice) => /^zh(-|_)/i.test(voice.lang));
  if (chineseVoice) utterance.voice = chineseVoice;
  utterance.lang = 'zh-CN';
  utterance.rate = 0.88;
  utterance.pitch = 0.98;
  utterance.onend = stopSpeaking;
  utterance.onerror = () => {
    stopSpeaking();
    showToast('语音朗读未完成，请继续查看页面文字。');
  };
  listenButton.setAttribute('aria-pressed', 'true');
  listenButton.querySelector('b').textContent = '■ 停一下';
  window.speechSynthesis.speak(utterance);
}

function saveFarmRecord() {
  const record = {
    id: `local-${Date.now()}`,
    date: state.date,
    region: state.region,
    farmId: activeFarm().id,
    farmName: activeFarm().name,
    crop: activeFarm().crop,
    weather: state.weather,
    title: currentProfile().title,
    zone: state.selected,
    createdAt: new Date().toISOString(),
    demo: true
  };
  try {
    const records = JSON.parse(localStorage.getItem('tianmingbai:records') || '[]');
    records.unshift(record);
    localStorage.setItem('tianmingbai:records', JSON.stringify(records.slice(0, 80)));
  } catch (_) {
    // Recording failure must not block the visible task state.
  }
}

const cameraViews = {
  overview: { pos: [7.4, 13.2, 9.4], target: [0, 0.12, 0.95] },
  top: { pos: [0.01, 17.2, 0.01], target: [0, 0, 0] },
  canal: { pos: [7.1, 4.1, 9.5], target: [0.3, 0.05, 3.3] },
  crop: { pos: [1.8, 5.2, 8.2], target: [-0.3, 0.1, -0.7] }
};
let cameraAnimation = null;

function cameraViewConfig(view) {
  const config = cameraViews[view];
  const mobile = window.matchMedia('(max-width: 720px)').matches;
  if (!mobile) return config;
  if (view === 'overview') return { pos: [9.4, 16.0, 12.0], target: [0, 0.1, 0.6] };
  if (view === 'top') return { pos: [0.01, 20.6, 0.01], target: [0, 0, 0] };
  if (view === 'canal') return { pos: [8.4, 5.2, 11.5], target: [0.2, 0, 3.2] };
  return { pos: [2.2, 6.2, 9.7], target: [-0.2, 0.08, -0.5] };
}

function setCameraView(view, immediate = false) {
  if (!cameraViews[view]) return;
  state.view = view;
  document.querySelectorAll('#cameraControls button').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.view === view));
  });
  const config = cameraViewConfig(view);
  const toPos = new THREE.Vector3(...config.pos);
  const toTarget = new THREE.Vector3(...config.target);
  if (immediate) {
    camera.position.copy(toPos);
    controls.target.copy(toTarget);
    controls.update();
    return;
  }
  cameraAnimation = {
    fromPos: camera.position.clone(),
    fromTarget: controls.target.clone(),
    toPos,
    toTarget,
    started: performance.now(),
    duration: 720
  };
}

const rainCount = 480;
const rainPositions = new Float32Array(rainCount * 3);
const rainRandom = seeded(9021);
for (let i = 0; i < rainCount; i++) {
  rainPositions[i * 3] = (rainRandom() - 0.5) * 24;
  rainPositions[i * 3 + 1] = rainRandom() * 8;
  rainPositions[i * 3 + 2] = (rainRandom() - 0.5) * 20;
}
const rainGeometry = new THREE.BufferGeometry();
rainGeometry.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
const rainMaterial = new THREE.PointsMaterial({
  color: 0xd8e9ea,
  size: 0.032,
  transparent: true,
  opacity: 0.7,
  depthWrite: false
});
const rain = new THREE.Points(rainGeometry, rainMaterial);
rain.visible = false;
world.add(rain);

const windCount = 34;
const windPositions = new Float32Array(windCount * 6);
for (let i = 0; i < windCount; i++) {
  const x = (rainRandom() - 0.5) * 22;
  const y = 0.5 + rainRandom() * 4.8;
  const z = (rainRandom() - 0.5) * 17;
  const length = 0.4 + rainRandom() * 0.9;
  windPositions.set([x, y, z, x + length, y + 0.04, z + 0.05], i * 6);
}
const windGeometry = new THREE.BufferGeometry();
windGeometry.setAttribute('position', new THREE.BufferAttribute(windPositions, 3));
const windMaterial = new THREE.LineBasicMaterial({
  color: 0xf5f0dc,
  transparent: true,
  opacity: 0.5
});
const windLines = new THREE.LineSegments(windGeometry, windMaterial);
windLines.visible = false;
world.add(windLines);

const frostCount = 140;
const frostPositions = new Float32Array(frostCount * 3);
for (let i = 0; i < frostCount; i++) {
  frostPositions[i * 3] = (rainRandom() - 0.5) * 9.5;
  frostPositions[i * 3 + 1] = 0.18 + rainRandom() * 0.7;
  frostPositions[i * 3 + 2] = (rainRandom() - 0.5) * 9.2;
}
const frostGeometry = new THREE.BufferGeometry();
frostGeometry.setAttribute('position', new THREE.BufferAttribute(frostPositions, 3));
const frostPoints = new THREE.Points(
  frostGeometry,
  new THREE.PointsMaterial({
    color: 0xe7f4f2,
    size: 0.045,
    transparent: true,
    opacity: 0.65,
    depthWrite: false
  })
);
frostPoints.visible = false;
world.add(frostPoints);

const crackPositions = [];
for (let i = 0; i < 28; i++) {
  const x = (rainRandom() - 0.5) * 8.8;
  const z = (rainRandom() - 0.5) * 8.7;
  crackPositions.push(
    new THREE.Vector3(x, 0.079, z),
    new THREE.Vector3(x + (rainRandom() - 0.5) * 0.9, 0.079, z + (rainRandom() - 0.5) * 0.9)
  );
}
const crackGeometry = new THREE.BufferGeometry().setFromPoints(crackPositions);
const crackLines = new THREE.LineSegments(
  crackGeometry,
  new THREE.LineBasicMaterial({ color: 0x8a6c45, transparent: true, opacity: 0.42 })
);
crackLines.visible = false;
world.add(crackLines);

const scanner = new THREE.Group();
const scanPlane = new THREE.Mesh(
  new THREE.PlaneGeometry(10.2, 2.25),
  new THREE.MeshBasicMaterial({
    color: 0x6bd7c3,
    transparent: true,
    opacity: 0.16,
    side: THREE.DoubleSide,
    depthWrite: false
  })
);
scanPlane.position.y = 1.13;
scanner.add(scanPlane);
const scanLine = new THREE.Mesh(
  new THREE.PlaneGeometry(10.2, 0.12),
  new THREE.MeshBasicMaterial({
    color: 0xc0f5e7,
    transparent: true,
    opacity: 0.8,
    side: THREE.DoubleSide,
    depthWrite: false
  })
);
scanLine.rotation.x = -Math.PI / 2;
scanLine.position.y = 0.11;
scanner.add(scanLine);

const scanRoute = new THREE.LineLoop(
  new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-4.75, 0.26, -4.7),
    new THREE.Vector3(4.75, 0.26, -4.7),
    new THREE.Vector3(4.75, 0.26, 4.6),
    new THREE.Vector3(-4.75, 0.26, 4.6)
  ]),
  new THREE.LineBasicMaterial({ color: 0x9cead9, transparent: true, opacity: 0.72 })
);
scanner.add(scanRoute);

const drone = new THREE.Group();
const droneBodyMaterial = new THREE.MeshStandardMaterial({ color: 0xf0eee3, roughness: 0.55, metalness: 0.18 });
const droneBody = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.07, 0.17), droneBodyMaterial);
droneBody.position.y = 2.35;
drone.add(droneBody);
[[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.018, 0.018), shared.dark);
  arm.position.set(sx * 0.15, 2.34, sz * 0.13);
  arm.rotation.y = Math.atan2(sz, sx);
  drone.add(arm);
  const rotor = new THREE.Mesh(new THREE.TorusGeometry(0.105, 0.009, 5, 20), shared.dark);
  rotor.rotation.x = Math.PI / 2;
  rotor.position.set(sx * 0.28, 2.37, sz * 0.24);
  drone.add(rotor);
});
drone.visible = false;
scanner.add(drone);
scanner.visible = false;
world.add(scanner);

const scanFindingWorld = new THREE.Vector3(-4.18, 0.5, -4.28);
const scanFindingBeacon = new THREE.Group();
scanFindingBeacon.position.set(scanFindingWorld.x, 0.08, scanFindingWorld.z);
const scanFindingHaloMaterial = new THREE.MeshBasicMaterial({
  color: 0xc89b3c,
  transparent: true,
  opacity: 0.7,
  side: THREE.DoubleSide,
  depthWrite: false
});
const scanFindingHalo = new THREE.Mesh(
  new THREE.RingGeometry(0.32, 0.47, 40),
  scanFindingHaloMaterial
);
scanFindingHalo.rotation.x = -Math.PI / 2;
scanFindingHalo.position.y = 0.05;
scanFindingBeacon.add(scanFindingHalo);
const scanFindingCore = new THREE.Mesh(
  new THREE.CylinderGeometry(0.025, 0.12, 0.72, 16, 1, true),
  new THREE.MeshBasicMaterial({
    color: 0xe6bd5d,
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide,
    depthWrite: false
  })
);
scanFindingCore.position.y = 0.4;
scanFindingBeacon.add(scanFindingCore);
scanFindingBeacon.visible = false;
world.add(scanFindingBeacon);

let scanStarted = 0;
let scanTimer = 0;
let scanFinishTimer = 0;
let scanProgressTimer = 0;
const SCAN_DURATION_MS = 4000;

function clearScanFinding() {
  state.scanFinding = false;
  state.scanFindingFarm = null;
  scanFindingPin.hidden = true;
  scanFindingNote.hidden = true;
  scanFindingBeacon.visible = false;
  scanButton.querySelector('b').textContent = 'AI巡田示意';
  renderZoneState();
}

function scanStageText(progress) {
  if (progress < 0.24) return '正在校准地块边界与方位';
  if (progress < 0.56) return '正在对比各分区作物长势';
  if (progress < 0.84) return '正在核查低洼区与土壤墒情';
  return '正在汇总巡田结论';
}

function startScan() {
  if (state.scanning) return;
  clearScanFinding();
  state.scanning = true;
  scanStarted = performance.now();
  scanner.visible = true;
  scanStatus.classList.add('show');
  scanStatusCopy.textContent = 'AI巡田示意 · 正在校准地块边界';
  scanPercent.textContent = '0%';
  scanProgressBar.style.width = '0%';
  scanButton.disabled = true;
  scanButton.querySelector('b').textContent = '识别中';
  showToast('AI巡田示意开始：正在按地块分组识别差异');
  clearInterval(scanProgressTimer);
  scanProgressTimer = window.setInterval(() => {
    const progress = Math.min(0.99, (performance.now() - scanStarted) / SCAN_DURATION_MS);
    scanStatusCopy.textContent = `AI巡田示意 · ${scanStageText(progress)}`;
    scanPercent.textContent = `${Math.round(progress * 100)}%`;
    scanProgressBar.style.width = `${Math.round(progress * 100)}%`;
  }, 50);
  clearTimeout(scanTimer);
  scanTimer = window.setTimeout(() => {
    completeScan(performance.now());
  }, SCAN_DURATION_MS);
}

function completeScan(now) {
  if (!state.scanning) return;
  state.scanning = false;
  clearTimeout(scanTimer);
  clearInterval(scanProgressTimer);
  scanner.visible = false;
  scanPercent.textContent = '100%';
  scanProgressBar.style.width = '100%';
  scanButton.disabled = false;
  scanButton.querySelector('b').textContent = '重新巡田';
  state.scanFinding = true;
  state.scanFindingFarm = activeFarm().id;
  scanFindingPin.hidden = false;
  scanFindingNote.hidden = false;
  scanFindingBeacon.visible = true;
  scanStatusCopy.textContent = '巡田完成 · 西北角发现墒情偏干趋势';
  const northwest = regions.find((region) => region.role === 'north-weak') || regions[0];
  if (northwest) selectRegion(northwest.id);
  renderZoneState();
  const riskCount = regions.filter((region) => riskFor(region.id) === 'risk').length;
  const watchCount = regions.filter((region) => riskFor(region.id) === 'watch').length;
  showToast(`巡田完成：新增西北角墒情偏干趋势；${riskCount} 个重点区、${watchCount + 1} 个留意项。`);
  clearTimeout(scanFinishTimer);
  scanFinishTimer = window.setTimeout(() => {
    scanStatus.classList.remove('show');
    scanStatusCopy.textContent = 'AI巡田示意 · 正在校准地块边界';
    scanPercent.textContent = '0%';
    scanProgressBar.style.width = '0%';
  }, 1250);
}

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let pointerDown = null;
let hoverFrame = null;

function setPointer(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  if (!rect.width || !rect.height) return false;
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  return true;
}

function regionAtPointer(event) {
  if (!setPointer(event)) return null;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(regionObjects.map((region) => region.soil), false);
  if (!hits.length) return null;
  return regionObjects.find((region) => region.id === hits[0].object.userData.regionId) || null;
}

renderer.domElement.addEventListener('pointerdown', (event) => {
  pointerDown = { x: event.clientX, y: event.clientY, id: event.pointerId };
  if (renderer.domElement.setPointerCapture) renderer.domElement.setPointerCapture(event.pointerId);
});

renderer.domElement.addEventListener('pointercancel', () => {
  pointerDown = null;
});

renderer.domElement.addEventListener('pointerup', (event) => {
  if (!pointerDown) return;
  const moved = Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y);
  const samePointer = pointerDown.id === event.pointerId;
  pointerDown = null;
  if (samePointer && moved < 7) {
    const region = regionAtPointer(event);
    if (region) selectRegion(region.id);
  }
});

renderer.domElement.addEventListener('pointermove', (event) => {
  if (!window.matchMedia('(pointer:fine)').matches) return;
  if (hoverFrame) cancelAnimationFrame(hoverFrame);
  hoverFrame = requestAnimationFrame(() => {
    const region = regionAtPointer(event);
    renderer.domElement.style.cursor = region ? 'pointer' : 'grab';
  });
});

function updatePins() {
  const projected = new THREE.Vector3();
  regionObjects.forEach((region) => {
    projected.copy(region.center).project(camera);
    const pin = pinElements.get(region.id);
    const visible = projected.z > -1 && projected.z < 1
      && projected.x > -1.12 && projected.x < 1.12
      && projected.y > -1.12 && projected.y < 1.12;
    pin.style.opacity = visible ? '1' : '0';
    pin.style.pointerEvents = visible ? 'auto' : 'none';
    pin.style.left = `${(projected.x * 0.5 + 0.5) * sceneHost.clientWidth}px`;
    pin.style.top = `${(-projected.y * 0.5 + 0.5) * sceneHost.clientHeight}px`;
  });
  infraElements.forEach((item) => {
    projected.copy(item.position).project(camera);
    const visible = projected.z > -1 && projected.z < 1
      && projected.x > -1.05 && projected.x < 1.05
      && projected.y > -1.05 && projected.y < 1.05;
    const px = (projected.x * 0.5 + 0.5) * sceneHost.clientWidth;
    const py = (-projected.y * 0.5 + 0.5) * sceneHost.clientHeight;
    item.element.style.opacity = visible ? '1' : '0';
    item.element.style.left = `${Math.max(54, Math.min(sceneHost.clientWidth - 54, px))}px`;
    item.element.style.top = `${Math.max(24, Math.min(sceneHost.clientHeight - 24, py))}px`;
  });
  if (!scanFindingPin.hidden) {
    projected.copy(scanFindingWorld).project(camera);
    const px = (projected.x * 0.5 + 0.5) * sceneHost.clientWidth;
    const py = (-projected.y * 0.5 + 0.5) * sceneHost.clientHeight;
    const visible = projected.z > -1 && projected.z < 1
      && px > 8 && px < sceneHost.clientWidth - 8
      && py > 8 && py < sceneHost.clientHeight - 8;
    scanFindingPin.style.opacity = visible ? '1' : '0';
    scanFindingPin.style.left = `${px}px`;
    scanFindingPin.style.top = `${py}px`;
  }
}

function resizeRenderer() {
  const rect = sceneHost.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  renderer.setSize(rect.width, rect.height, false);
  camera.aspect = rect.width / rect.height;
  camera.updateProjectionMatrix();
}

const resizeObserver = new ResizeObserver(resizeRenderer);
resizeObserver.observe(sceneHost);
resizeRenderer();

function tweenCamera(now) {
  if (!cameraAnimation) return;
  const raw = Math.min(1, (now - cameraAnimation.started) / cameraAnimation.duration);
  const eased = raw < 0.5
    ? 4 * raw * raw * raw
    : 1 - Math.pow(-2 * raw + 2, 3) / 2;
  camera.position.lerpVectors(cameraAnimation.fromPos, cameraAnimation.toPos, eased);
  controls.target.lerpVectors(cameraAnimation.fromTarget, cameraAnimation.toTarget, eased);
  if (raw >= 1) cameraAnimation = null;
}

let rendererActive = true;
let pageVisible = !document.hidden;
const intersectionObserver = new IntersectionObserver(([entry]) => {
  rendererActive = entry.isIntersecting;
}, { threshold: 0.04 });
intersectionObserver.observe(sceneHost);

document.addEventListener('visibilitychange', () => {
  pageVisible = !document.hidden;
});

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const clockStart = performance.now();
let lastFrame = 0;
let frameHandle = 0;

function updateWeatherParticles(now, delta) {
  if (rain.visible) {
    const array = rainGeometry.attributes.position.array;
    for (let i = 0; i < rainCount; i++) {
      array[i * 3 + 1] -= delta * 0.0045;
      if (array[i * 3 + 1] < -0.1) array[i * 3 + 1] = 8;
    }
    rainGeometry.attributes.position.needsUpdate = true;
  }
  if (windLines.visible) {
    const array = windGeometry.attributes.position.array;
    const shift = delta * 0.0035;
    for (let i = 0; i < windCount; i++) {
      array[i * 6] += shift;
      array[i * 6 + 3] += shift;
      if (array[i * 6] > 11) {
        array[i * 6] = -11;
        array[i * 6 + 3] = -11 + (array[i * 6 + 3] - array[i * 6]);
      }
    }
    windGeometry.attributes.position.needsUpdate = true;
  }
}

function animate(now) {
  frameHandle = requestAnimationFrame(animate);
  if (!rendererActive || !pageVisible) return;

  const delta = Math.min(50, now - (lastFrame || now));
  lastFrame = now;
  tweenCamera(now);
  controls.update();

  const t = (now - clockStart) / 1000;
  if (!reducedMotion) {
    clouds.children.forEach((cloud, index) => {
      cloud.position.x += Math.sin(t * 0.09 + index) * 0.0008;
    });
    waterGlints.forEach((glint, index) => {
      glint.position.x = -4 + ((t * 0.13 + index * 2.05) % 10.25);
      glint.material.opacity = (state.weather === 'rain' ? 0.68 : 0.42) + Math.sin(t * 1.1 + index) * 0.08;
    });
    regionObjects.forEach((region, index) => {
      const windStrength = state.weather === 'wind' ? 0.02 : 0.004;
      region.crops.position.x = Math.sin(t * 1.15 + index * 0.7) * windStrength;
      region.crops.position.z = Math.cos(t * 0.9 + index * 0.5) * windStrength * 0.55;
    });
    regionObjects.forEach((region, index) => {
      if (!region.marker.visible) return;
      const pulse = 1 + Math.sin(t * 2.25 + index) * 0.09;
      region.marker.scale.setScalar(pulse * (riskFor(region.id) === 'risk' ? 1 : 0.84));
      region.ring.material.opacity = 0.45 + (Math.sin(t * 2.25 + index) + 1) * 0.14;
    });
    if (scanFindingBeacon.visible) {
      const pulse = 1 + Math.sin(t * 2.6) * 0.12;
      scanFindingHalo.scale.setScalar(pulse);
      scanFindingHaloMaterial.opacity = 0.42 + (Math.sin(t * 2.6) + 1) * 0.16;
    }
  }

  updateWeatherParticles(now, delta);

  if (state.scanning) {
    const progress = Math.min(0.99, (now - scanStarted) / SCAN_DURATION_MS);
    const z = -5.1 + progress * 10.2;
    scanner.position.z = z;
    drone.position.set(Math.sin(progress * Math.PI * 2) * 2.2, 0, 0);
    scanPlane.material.opacity = 0.12 + Math.sin(t * 8) * 0.03;
  }

  updatePins();
  renderer.render(scene, camera);
}

function currentFieldContext() {
  const crop = activeCrop();
  const stage = stageDefinition(state.stage);
  const zoneContext = regions
    .map((zone) => {
      const tag = zoneTagProfiles[zone.tag]?.label || zone.tag;
      return `${zone.name}（${tag}，${severityLabel(zone.id)}，长势${zone.vigor}，墒情${zone.moisture}）`;
    })
    .join('；');
  return [
    `区县：${regionSelect.value || state.region}`,
    `农田：${activeFarm().name}`,
    `作物：${crop.name}`,
    `生育期：${stage.name}`,
    `天气场景：${weathers[state.weather].name}`,
    `参考日期：${state.date}`,
    `管理分区：${zoneContext}`
  ].join('；');
}

function appendChatMessage(text, role = 'assistant', className = '') {
  const bubble = document.createElement('div');
  bubble.className = `chat-message ${role}${className ? ` ${className}` : ''}`;
  bubble.textContent = text;
  chatMessages.appendChild(bubble);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return bubble;
}

function appendLocalDecisionFallback() {
  const firstAction = actionList.querySelector('li p')?.textContent?.trim()
    || '先按页面今日判断到地里核对。';
  appendChatMessage(
    `AI暂时没连上，先按本地规则办一条：${firstAction} 拿不准就打12316问当地农技员。`,
    'assistant',
    'local'
  );
}

function revealChatPanel() {
  requestAnimationFrame(() => {
    aiChatPanel.scrollIntoView({
      behavior: reducedMotion ? 'auto' : 'smooth',
      block: 'nearest'
    });
  });
}

function typeChatAnswer(text) {
  const bubble = appendChatMessage('', 'assistant');
  if (reducedMotion) {
    bubble.textContent = text;
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return bubble;
  }
  let index = 0;
  const timer = window.setInterval(() => {
    index = Math.min(text.length, index + 2);
    bubble.textContent = text.slice(0, index);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    if (index >= text.length) window.clearInterval(timer);
  }, 24);
  return bubble;
}

const AI_API_BASE = String(
  window.TIANMINGBAI_API_BASE
  || (() => { try { return localStorage.getItem('tianmingbai:api') || ''; } catch (_) { return ''; } })()
  || 'https://tqnog-180-184-45-117.run.pinggy-free.link'
).replace(/\/+$/, '');
const AI_HISTORY_KEY = 'tianmingbai:ai-history';
let aiHistory = [];
try {
  const saved = JSON.parse(localStorage.getItem(AI_HISTORY_KEY) || '[]');
  if (Array.isArray(saved)) aiHistory = saved.slice(-6).filter((t) => t && t.content);
} catch (_) {
  aiHistory = [];
}

function saveAiHistory() {
  aiHistory = aiHistory.slice(-6);
  try { localStorage.setItem(AI_HISTORY_KEY, JSON.stringify(aiHistory)); } catch (_) {}
}

function appendAiDecision(payload) {
  const bubble = document.createElement('div');
  bubble.className = 'chat-message assistant';
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;flex-direction:column;gap:5px;line-height:1.62';

  const addLine = (label, text, bold) => {
    const line = document.createElement('div');
    if (bold) line.style.cssText = 'font-weight:700';
    line.textContent = label ? `${label}${text}` : text;
    wrap.appendChild(line);
    return line;
  };

  addLine('', `${payload.verdict}　·　优先级${payload.priority}`, true);
  if (payload.reason) addLine('依据：', payload.reason);

  const actions = Array.isArray(payload.actions) ? payload.actions.filter(Boolean) : [];
  if (actions.length) {
    const label = document.createElement('div');
    label.textContent = payload.refuse ? '去核实：' : '今天先做：';
    wrap.appendChild(label);
    const list = document.createElement('ol');
    list.style.cssText = 'margin:0;padding-left:18px';
    actions.forEach((action) => {
      const item = document.createElement('li');
      item.textContent = action;
      list.appendChild(item);
    });
    wrap.appendChild(list);
  }

  if (payload.window) addLine('时间窗：', payload.window);
  if (payload.refuse && payload.refuse_reason) addLine('为什么不能替你定：', payload.refuse_reason);

  const meta = document.createElement('div');
  meta.style.cssText = 'opacity:.72;font-size:.92em';
  meta.textContent = `置信度${payload.confidence}　·　依据当前地块实时生成`;
  wrap.appendChild(meta);

  bubble.appendChild(wrap);
  chatMessages.appendChild(bubble);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return bubble;
}

async function sendChatQuestion(rawQuestion) {
  const question = String(rawQuestion || '').trim();
  if (!question || chatSend.disabled) return;
  aiChatPanel.open = true;
  revealChatPanel();
  appendChatMessage(question, 'user');
  chatInput.value = '';
  chatSend.disabled = true;
  chatSend.textContent = '发送中';
  const waiting = appendChatMessage('田明白正看着当前地块想…', 'assistant');
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 45000);

  try {
    if (!AI_API_BASE) throw new Error('未配置 AI 服务地址');
    const response = await fetch(`${AI_API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Pinggy-No-Screen': 'true' },
      body: JSON.stringify({
        question: question,
        field_context: currentFieldContext(),
        history: aiHistory.slice(-4)
      }),
      signal: controller.signal
    });
    const data = await response.json().catch(() => ({}));
    waiting.remove();
    if (!response.ok || data.error) {
      const message = data.code === 'rate_limited'
        ? '问得有点急，歇一分钟再问'
        : (data.message || 'AI 服务暂时连不上');
      appendChatMessage(message, 'assistant', 'error');
      appendLocalDecisionFallback();
      return;
    }
    if (!data.verdict) throw new Error('回答为空');
    appendAiDecision(data);
    aiHistory.push({ role: 'user', content: question });
    aiHistory.push({ role: 'assistant', content: `${data.verdict}；${data.reason || ''}` });
    saveAiHistory();
  } catch (_) {
    waiting.remove();
    appendChatMessage('AI 服务暂时连不上', 'assistant', 'error');
    appendLocalDecisionFallback();
  } finally {
    clearTimeout(timeoutId);
    chatSend.disabled = false;
    chatSend.textContent = '发送';
  }
}

let html2canvasPromise = null;
function ensureHtml2Canvas() {
  if (window.html2canvas) return Promise.resolve(window.html2canvas);
  if (html2canvasPromise) return html2canvasPromise;
  html2canvasPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    const timeout = window.setTimeout(() => {
      html2canvasPromise = null;
      reject(new Error('html2canvas 加载超时'));
    }, 5000);
    script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
    script.crossOrigin = 'anonymous';
    script.onload = () => {
      window.clearTimeout(timeout);
      window.html2canvas ? resolve(window.html2canvas) : reject(new Error('html2canvas 未加载'));
    };
    script.onerror = () => {
      window.clearTimeout(timeout);
      html2canvasPromise = null;
      reject(new Error('html2canvas 加载失败'));
    };
    document.head.appendChild(script);
  });
  return html2canvasPromise;
}

function drawWrappedText(context, text, x, y, maxWidth, lineHeight, maxLines = Infinity) {
  const chars = Array.from(String(text));
  let line = '';
  let lineIndex = 0;
  for (let index = 0; index < chars.length; index += 1) {
    const test = line + chars[index];
    if (context.measureText(test).width > maxWidth && line) {
      context.fillText(line, x, y + lineIndex * lineHeight);
      lineIndex += 1;
      line = chars[index];
      if (lineIndex >= maxLines) return;
    } else {
      line = test;
    }
  }
  if (line && lineIndex < maxLines) context.fillText(line, x, y + lineIndex * lineHeight);
}

function createFallbackDecisionCard() {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1350;
  const context = canvas.getContext('2d');
  const gradient = context.createLinearGradient(0, 0, 1080, 1350);
  gradient.addColorStop(0, '#fbf7eb');
  gradient.addColorStop(.58, '#efe7d3');
  gradient.addColorStop(1, '#d6dfca');
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#244c37';
  context.fillRect(0, 0, 1080, 18);
  context.fillStyle = '#173b2a';
  context.font = '700 46px "Microsoft YaHei", sans-serif';
  context.fillText('田明白 · 今日农事判断', 72, 102);
  context.fillStyle = '#7c6b45';
  context.font = '24px "Microsoft YaHei", sans-serif';
  context.fillText(`${dateEl.textContent} · ${state.region} · ${activeCrop().name}`, 74, 148);
  context.fillStyle = '#1d3f2d';
  context.font = '700 72px "Songti SC", "SimSun", serif';
  drawWrappedText(context, decisionTitle.textContent, 72, 260, 930, 88, 2);
  context.fillStyle = '#4d6255';
  context.font = '30px "Microsoft YaHei", sans-serif';
  drawWrappedText(context, decisionReason.textContent, 74, 390, 900, 48, 4);
  context.strokeStyle = 'rgba(49, 95, 69, .18)';
  context.beginPath();
  context.moveTo(72, 610);
  context.lineTo(1008, 610);
  context.stroke();
  context.fillStyle = '#1e4632';
  context.font = '700 30px "Microsoft YaHei", sans-serif';
  context.fillText('今天先做', 74, 668);
  context.font = '29px "Microsoft YaHei", sans-serif';
  let actionY = 730;
  actionList.querySelectorAll('li').forEach((item) => {
    context.fillStyle = '#c89b3c';
    context.fillText(item.querySelector('span')?.textContent || '·', 78, actionY);
    context.fillStyle = '#334c3d';
    drawWrappedText(context, item.querySelector('p')?.textContent || '', 142, actionY, 820, 42, 2);
    actionY += 108;
  });
  context.fillStyle = 'rgba(255, 252, 241, .76)';
  context.fillRect(72, 1050, 936, 156);
  context.fillStyle = '#6d5a34';
  context.font = '700 24px "Microsoft YaHei", sans-serif';
  context.fillText('判断依据', 96, 1093);
  context.fillStyle = '#506556';
  context.font = '23px "Microsoft YaHei", sans-serif';
  drawWrappedText(context, decisionEvidence.textContent, 96, 1138, 872, 34, 3);
  if (state.scanFinding) {
    context.fillStyle = '#7c5b20';
    context.font = '700 23px "Microsoft YaHei", sans-serif';
    context.fillText('AI巡田补充：西北角墒情偏干，3天后复查。', 74, 1242);
  }
  context.fillStyle = '#244c37';
  context.font = '700 25px "Microsoft YaHei", sans-serif';
  context.fillText('业务示意 · 实际以现场和农技员判断为准', 74, state.scanFinding ? 1300 : 1278);
  return canvas;
}

async function generateDecisionCard() {
  shareCardButton.disabled = true;
  shareCardButton.textContent = '正在生成…';
  let captureCard = null;
  try {
    let canvas;
    try {
      const renderCanvas = await ensureHtml2Canvas();
      const sourceCard = document.getElementById('decisionCard');
      captureCard = sourceCard.cloneNode(true);
      captureCard.removeAttribute('id');
      captureCard.classList.add('decision-card-capture');
      captureCard.style.width = '360px';
      const shareFooter = document.createElement('div');
      shareFooter.className = 'decision-card-share-footer';
      shareFooter.innerHTML = '<strong>田明白</strong><span>商丘小农户 AI 农事助手<br>把今天先做什么说明白</span>';
      captureCard.appendChild(shareFooter);
      document.body.appendChild(captureCard);
      await new Promise((resolve) => requestAnimationFrame(resolve));
      canvas = await renderCanvas(captureCard, {
        backgroundColor: '#f8f3e5',
        scale: 3,
        useCORS: true,
        logging: false
      });
    } catch (_) {
      canvas = createFallbackDecisionCard();
    }
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('图片生成失败');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `田明白_${state.date.replaceAll('-', '')}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    showToast('今日农事卡片已生成，可用于朋友圈分享。');
  } catch (_) {
    showToast('今日农事卡片生成失败，请稍后再试。');
  } finally {
    captureCard?.remove();
    shareCardButton.disabled = false;
    shareCardButton.textContent = '生成今日农事卡片';
  }
}

document.querySelectorAll('.layer-switch button').forEach((button) => {
  button.addEventListener('click', () => setLayer(button.dataset.layer));
});

document.querySelectorAll('#cameraControls button').forEach((button) => {
  button.addEventListener('click', () => setCameraView(button.dataset.view));
});

document.querySelectorAll('#stageControls button').forEach((button) => {
  button.addEventListener('click', () => setStage(button.dataset.stage));
});
document.querySelectorAll('.weather-button').forEach((button) => {
  button.addEventListener('click', () => setWeather(button.dataset.weather));
});

regionSelect.addEventListener('change', () => setRegion(regionSelect.value));
dateInput.addEventListener('change', () => setDate(dateInput.value));
weatherSelect.addEventListener('change', () => setWeather(weatherSelect.value));
dialectToggle.addEventListener('click', () => setDialect(dialectToggle.getAttribute('aria-pressed') !== 'true'));
listenButton.addEventListener('click', speakToday);
shareCardButton.addEventListener('click', generateDecisionCard);

chatForm.addEventListener('submit', (event) => {
  event.preventDefault();
  sendChatQuestion(chatInput.value);
});
document.querySelectorAll('#chatSuggestions [data-question]').forEach((button) => {
  button.addEventListener('click', () => sendChatQuestion(button.dataset.question));
});
aiChatPanel.addEventListener('toggle', () => {
  if (aiChatPanel.open) revealChatPanel();
});

scanButton.addEventListener('click', startScan);
recordAction.addEventListener('click', () => {
  if (state.recorded) return;
  state.recorded = true;
  saveFarmRecord();
  renderDecision();
  showToast(`已记录到本机演示档案：${state.region} · ${formatShortDate(state.date)} · ${currentProfile().title}。`);
});
recordShortcut.addEventListener('click', () => {
  recordAction.click();
});

document.getElementById('explainAction').addEventListener('click', () => {
  document.getElementById('decisionCard').scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
  showToast(`判断依据：${decisionEvidence.textContent}`);
});

const textToggle = document.getElementById('textToggle');
function setLargeText(enabled) {
  document.querySelector('.page').classList.toggle('large-text', enabled);
  textToggle.setAttribute('aria-pressed', String(enabled));
  textToggle.textContent = enabled ? '标准' : '大字';
  try { localStorage.setItem('tianmingbai-large-text', enabled ? '1' : '0'); } catch (_) {}
}
textToggle.addEventListener('click', () => {
  setLargeText(textToggle.getAttribute('aria-pressed') !== 'true');
});
try {
  setLargeText(localStorage.getItem('tianmingbai-large-text') === '1');
} catch (_) {
  setLargeText(false);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove('show'), 2600);
}

function initialRender() {
  const referenceStage = inferStage(getDaysAfterSowing(state.date));
  if (referenceStage.id) state.stage = referenceStage.id;
  document.querySelectorAll('.weather-button').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.weather === state.weather));
  });
  document.querySelectorAll('#stageControls button').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.stage === state.stage));
  });
  renderContext();
  renderDateContext();
  updateCropMatrices();
  updateCropColors();
  applyWeather();
  renderDecision();
  renderWeek();
  renderZoneState();
  renderLayer();
  renderSceneMarkers();
  dialectToggle.setAttribute('aria-pressed', String(state.dialect));
  setCameraView('overview', true);
}

initialRender();
frameHandle = requestAnimationFrame(animate);

window.addEventListener('resize', () => {
  if (!cameraAnimation) setCameraView(state.view, true);
});

function disposeScene() {
  cancelAnimationFrame(frameHandle);
  clearTimeout(scanTimer);
  clearTimeout(scanFinishTimer);
  clearInterval(scanProgressTimer);
  resizeObserver.disconnect();
  intersectionObserver.disconnect();
  controls.dispose();
  const geometries = new Set();
  const materials = new Set();
  const textures = new Set();
  scene.traverse((object) => {
    if (object.geometry) geometries.add(object.geometry);
    if (object.material) {
      const list = Array.isArray(object.material) ? object.material : [object.material];
      list.forEach((material) => {
        materials.add(material);
        Object.values(material).forEach((value) => {
          if (value && value.isTexture) textures.add(value);
        });
      });
    }
  });
  textures.forEach((texture) => texture.dispose());
  materials.forEach((material) => material.dispose());
  geometries.forEach((geometry) => geometry.dispose());
  renderer.dispose();
}

window.addEventListener('pagehide', (event) => {
  if (!event.persisted) disposeScene();
}, { once: true });

/* 问田明白 · 底部常驻问答条
   把原来的折叠面板换成一条始终可见的输入条，回答以卡片形式浮在它上方。 */
(function mountAskDock() {
  if (document.getElementById('askDockRoot')) return;

  const style = document.createElement('style');
  style.textContent = `
#aiChatPanel{display:none!important}
#askDockRoot{position:fixed;left:50%;transform:translateX(-50%);bottom:18px;width:min(880px,calc(100% - 32px));z-index:9998;font-family:inherit}
#askDockRoot .dock-body{background:linear-gradient(180deg,rgba(22,36,27,.97),rgba(13,22,17,.985));border:1px solid rgba(198,166,98,.34);border-radius:18px;box-shadow:0 22px 60px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.06);backdrop-filter:blur(16px);overflow:hidden}
#askDockRoot .dock-head{display:flex;align-items:center;gap:11px;padding:13px 16px 11px}
#askDockRoot .dock-badge{width:30px;height:30px;border-radius:9px;background:linear-gradient(150deg,#3f6b4a,#24402c);color:#e9dfbf;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:15px;letter-spacing:1px;box-shadow:inset 0 0 0 1px rgba(233,223,191,.28)}
#askDockRoot .dock-title{color:#f3efe1;font-size:15px;font-weight:700;letter-spacing:.4px}
#askDockRoot .dock-sub{color:rgba(243,239,225,.5);font-size:11.5px;margin-top:2px}
#askDockRoot .dock-live{margin-left:auto;display:flex;align-items:center;gap:6px;color:rgba(243,239,225,.62);font-size:11.5px}
#askDockRoot .dock-dot{width:7px;height:7px;border-radius:50%;background:#6fbf73;box-shadow:0 0 8px rgba(111,191,115,.8)}
#askDockRoot .dock-fold{background:none;border:0;color:rgba(243,239,225,.45);font-size:11.5px;cursor:pointer;padding:2px 4px}
#askDockRoot .dock-fold:hover{color:#e9dfbf}
#askDockRoot .dock-transcript{max-height:44vh;overflow-y:auto;padding:0 16px;display:flex;flex-direction:column;gap:10px}
#askDockRoot .dock-transcript:empty{display:none}
#askDockRoot .ask-q{color:rgba(243,239,225,.55);font-size:12.5px;padding:2px 0 0 2px}
#askDockRoot .ask-q::before{content:'你问：';color:rgba(198,166,98,.85)}
#askDockRoot .ask-card{background:rgba(255,255,255,.045);border-radius:13px;padding:13px 15px;border-left:3px solid #c9a227}
#askDockRoot .ask-card.p-high{border-left-color:#d98324}
#askDockRoot .ask-card.p-mid{border-left-color:#c9a227}
#askDockRoot .ask-card.p-low{border-left-color:#6f8f6a}
#askDockRoot .ask-card.refuse{border-left-color:#b45a4a;background:rgba(180,90,74,.09)}
#askDockRoot .ask-line1{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px}
#askDockRoot .ask-verdict{color:#f7f3e6;font-size:16.5px;font-weight:700;letter-spacing:.3px}
#askDockRoot .ask-pill{font-size:11px;padding:2px 8px;border-radius:999px;background:rgba(217,131,36,.16);color:#e2a86a;border:1px solid rgba(217,131,36,.34)}
#askDockRoot .ask-card.p-mid .ask-pill{background:rgba(201,162,39,.15);color:#dcc06a;border-color:rgba(201,162,39,.34)}
#askDockRoot .ask-card.p-low .ask-pill{background:rgba(111,143,106,.15);color:#93b48d;border-color:rgba(111,143,106,.34)}
#askDockRoot .ask-card.refuse .ask-pill{background:rgba(180,90,74,.16);color:#e09a8b;border-color:rgba(180,90,74,.34)}
#askDockRoot .ask-label{color:rgba(198,166,98,.9);font-size:12px;margin-top:9px}
#askDockRoot .ask-reason{color:rgba(243,239,225,.86);font-size:13px;line-height:1.72;margin-top:3px}
#askDockRoot .ask-actions{margin:5px 0 0;padding-left:19px;color:rgba(243,239,225,.9);font-size:13px;line-height:1.85}
#askDockRoot .ask-meta{color:rgba(243,239,225,.42);font-size:11.5px;margin-top:9px;letter-spacing:.2px}
#askDockRoot .dock-input-row{display:flex;gap:10px;padding:11px 16px 4px;align-items:center}
#askDockRoot .dock-input{flex:1;height:46px;border-radius:12px;border:1px solid rgba(255,255,255,.13);background:rgba(255,255,255,.055);color:#f3efe1;font-size:14px;padding:0 15px;outline:none;transition:border-color .18s,background .18s}
#askDockRoot .dock-input::placeholder{color:rgba(243,239,225,.38)}
#askDockRoot .dock-input:focus{border-color:rgba(198,166,98,.6);background:rgba(255,255,255,.08)}
#askDockRoot .dock-send{height:46px;padding:0 22px;border-radius:12px;border:0;cursor:pointer;color:#f4f8f2;font-size:14px;font-weight:600;letter-spacing:.5px;background:linear-gradient(160deg,#43724e,#2b4a35);box-shadow:0 6px 18px rgba(43,74,53,.45);transition:filter .18s,transform .1s}
#askDockRoot .dock-send:hover{filter:brightness(1.12)}
#askDockRoot .dock-send:active{transform:translateY(1px)}
#askDockRoot .dock-send[disabled]{opacity:.55;cursor:default}
#askDockRoot .dock-chips{display:flex;gap:8px;flex-wrap:wrap;padding:2px 16px 13px}
#askDockRoot .dock-chip{font-size:12px;color:rgba(243,239,225,.66);background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:999px;padding:5px 12px;cursor:pointer;transition:color .16s,border-color .16s}
#askDockRoot .dock-chip:hover{color:#e9dfbf;border-color:rgba(198,166,98,.45)}
#askDockRoot .dock-mini{position:fixed;left:50%;transform:translateX(-50%);bottom:18px;z-index:9998;display:none;align-items:center;gap:9px;padding:11px 18px;border-radius:999px;background:linear-gradient(160deg,#43724e,#2b4a35);color:#f4f8f2;font-size:13.5px;font-weight:600;cursor:pointer;box-shadow:0 12px 30px rgba(0,0,0,.45);border:1px solid rgba(233,223,191,.3)}
@media (max-width:640px){
  #askDockRoot{bottom:10px;width:calc(100% - 20px)}
  #askDockRoot .dock-chips{gap:6px}
  #askDockRoot .dock-send{padding:0 16px}
}
`;
  document.head.appendChild(style);

  const root = document.createElement('div');
  root.id = 'askDockRoot';
  root.innerHTML = `
<div class="dock-body">
  <div class="dock-head">
    <div class="dock-badge">田</div>
    <div>
      <div class="dock-title">问田明白</div>
      <div class="dock-sub">带着这块地的作物、生育期和天气来回答</div>
    </div>
    <div class="dock-live"><span class="dock-dot"></span>在线</div>
    <button class="dock-fold" type="button">收起</button>
  </div>
  <div class="dock-transcript" id="askTranscript"></div>
  <div class="dock-input-row">
    <input class="dock-input" id="askInput" type="text" maxlength="200" placeholder="比如：现在东边洼地要不要先排水？">
    <button class="dock-send" id="askSend" type="button">问一句</button>
  </div>
  <div class="dock-chips">
    <span class="dock-chip">今天该先干啥</span>
    <span class="dock-chip">东边洼地要不要排水</span>
    <span class="dock-chip">这场雨对麦子影响大吗</span>
    <span class="dock-chip">纹枯病打什么药</span>
  </div>
</div>`;
  document.body.appendChild(root);

  const mini = document.createElement('div');
  mini.className = 'dock-mini';
  mini.innerHTML = '<span>田</span><span>问田明白</span>';
  document.body.appendChild(mini);

  const transcript = root.querySelector('#askTranscript');
  const input = root.querySelector('#askInput');
  const sendBtn = root.querySelector('#askSend');
  const foldBtn = root.querySelector('.dock-fold');
  const body = root.querySelector('.dock-body');

  function weatherText() {
    let w = '';
    try { w = typeof state !== 'undefined' && state ? String(state.weather || '') : ''; } catch (_) {}
    const map = { rain: '雨天', sunny: '晴天', cloud: '多云', cloudy: '多云', overcast: '阴', snow: '雪', wind: '大风', drizzle: '小雨' };
    if (map[w]) return map[w];
    const pressed = document.querySelector('.weather-button[aria-pressed="true"]');
    if (pressed) return (pressed.textContent || '').trim() || '未标注';
    return w || '未标注';
  }

  function fieldContext() {
    const parts = [];
    try {
      if (typeof state !== 'undefined' && state) {
        const profile = typeof cropProfiles !== 'undefined' && cropProfiles[state.crop] ? cropProfiles[state.crop] : null;
        if (profile) {
          const idx = typeof stages !== 'undefined' ? stages.findIndex((s) => s.id === state.stage) : -1;
          const stageName = idx >= 0 ? profile.stageLabels[Math.min(idx, profile.stageLabels.length - 1)] : '';
          parts.push(`作物：${profile.name}${stageName ? `；生育期：${stageName}` : ''}`);
        }
        if (state.date) {
          try {
            const d = new Date(state.date);
            if (!Number.isNaN(d.getTime())) parts.push(`当前日期：${d.toLocaleDateString('zh-CN')}`);
          } catch (_) {}
        }
      }
    } catch (_) {}
    parts.push(`天气场景：${weatherText()}`);
    parts.push('地块：3.2 亩，分六块管理分区；东片为低洼地，历史上雨后易积水；北片长势偏旺');
    parts.push('当地：河南商丘，小农户，承包地，无企业统一管理');
    return parts.join('\n');
  }

  let history = [];
  try { history = JSON.parse(localStorage.getItem('tianmingbai:dock-history') || '[]'); } catch (_) { history = []; }

  function addQuestion(q) {
    const el = document.createElement('div');
    el.className = 'ask-q';
    el.style.cssText = 'color:rgba(243,239,225,.55);font-size:12.5px;padding:2px 0 0 2px';
    el.textContent = q;
    transcript.appendChild(el);
  }

  function addCard(payload) {
    const card = document.createElement('div');
    const level = payload.priority === '高' ? 'p-high' : payload.priority === '低' ? 'p-low' : 'p-mid';
    card.className = `ask-card ${level}${payload.refuse ? ' refuse' : ''}`;
    card.style.cssText = 'background:rgba(255,255,255,.045);border-radius:13px;padding:13px 15px';

    const line1 = document.createElement('div');
    line1.style.cssText = 'display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px';
    const verdict = document.createElement('span');
    verdict.style.cssText = 'color:#f7f3e6;font-size:16.5px;font-weight:700;letter-spacing:.3px';
    verdict.textContent = payload.verdict || '先到地里核对一遍';
    const pill = document.createElement('span');
    pill.style.cssText = 'font-size:11px;padding:2px 8px;border-radius:999px;background:rgba(217,131,36,.16);color:#e2a86a;border:1px solid rgba(217,131,36,.34)';
    pill.textContent = `优先级${payload.priority || '中'}`;
    line1.appendChild(verdict);
    line1.appendChild(pill);
    card.appendChild(line1);

    if (payload.reason) {
      const reason = document.createElement('div');
      reason.style.cssText = 'color:rgba(243,239,225,.86);font-size:13px;line-height:1.72;margin-top:3px';
      const tag = document.createElement('span');
      tag.textContent = '依据：';
      tag.style.color = 'rgba(198,166,98,.9)';
      reason.appendChild(tag);
      reason.appendChild(document.createTextNode(payload.reason));
      card.appendChild(reason);
    }

    const actions = Array.isArray(payload.actions) ? payload.actions.filter(Boolean) : [];
    if (actions.length) {
      const label = document.createElement('div');
      label.style.cssText = 'color:rgba(198,166,98,.9);font-size:12px;margin-top:9px';
      label.textContent = payload.refuse ? '去核实：' : '今天先做：';
      card.appendChild(label);
      const list = document.createElement('ol');
      list.style.cssText = 'margin:5px 0 0;padding-left:19px;color:rgba(243,239,225,.9);font-size:13px;line-height:1.85';
      actions.forEach((a) => {
        const li = document.createElement('li');
        li.textContent = a;
        list.appendChild(li);
      });
      card.appendChild(list);
    }

    if (payload.window) {
      const win = document.createElement('div');
      win.style.cssText = 'color:rgba(243,239,225,.82);font-size:12.5px;margin-top:7px';
      const tag = document.createElement('span');
      tag.textContent = '时间窗：';
      tag.style.color = 'rgba(198,166,98,.9)';
      win.appendChild(tag);
      win.appendChild(document.createTextNode(payload.window));
      card.appendChild(win);
    }

    if (payload.refuse && payload.refuse_reason) {
      const why = document.createElement('div');
      why.style.cssText = 'color:rgba(243,239,225,.82);font-size:12.5px;line-height:1.7;margin-top:7px';
      const tag = document.createElement('span');
      tag.textContent = '为什么不能替你定：';
      tag.style.color = 'rgba(224,154,139,.95)';
      why.appendChild(tag);
      why.appendChild(document.createTextNode(payload.refuse_reason));
      card.appendChild(why);
    }

    const meta = document.createElement('div');
    meta.style.cssText = 'color:rgba(243,239,225,.42);font-size:11.5px;margin-top:9px;letter-spacing:.2px';
    meta.textContent = `置信度${payload.confidence || '中'}　·　依据当前地块实时生成${payload.cached ? '（同问缓存）' : ''}`;
    card.appendChild(meta);

    transcript.appendChild(card);
    transcript.scrollTop = transcript.scrollHeight;
    return card;
  }

  function addError(text) {
    const card = document.createElement('div');
    card.className = 'ask-card refuse';
    card.style.cssText = 'background:rgba(180,90,74,.09);border-radius:13px;padding:13px 15px';
    const t = document.createElement('div');
    t.style.cssText = 'color:#f7f3e6;font-size:15px;font-weight:700';
    t.textContent = '这会儿没连上服务';
    const d = document.createElement('div');
    d.style.cssText = 'color:rgba(243,239,225,.8);font-size:12.5px;line-height:1.7;margin-top:6px';
    d.textContent = text;
    card.appendChild(t);
    card.appendChild(d);
    transcript.appendChild(card);
    transcript.scrollTop = transcript.scrollHeight;
  }

  async function ask(raw) {
    const q = String(raw || '').trim();
    if (!q || sendBtn.disabled) return;
    addQuestion(q);
    input.value = '';
    sendBtn.disabled = true;
    sendBtn.textContent = '问着…';

    try {
      if (typeof AI_API_BASE !== 'string' || !AI_API_BASE) throw new Error('页面没有配置 AI 服务地址');
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 45000);
      const response = await fetch(`${AI_API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Pinggy-No-Screen': 'true' },
        body: JSON.stringify({ question: q, field_context: fieldContext(), history: history.slice(-4) }),
        signal: controller.signal
      });
      clearTimeout(timer);
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload) {
        const msg = payload && payload.message ? payload.message : `服务返回 ${response.status}`;
        addError(msg);
        return;
      }
      addCard(payload);
      history.push({ role: 'user', content: q });
      history.push({ role: 'assistant', content: payload.verdict || '' });
      history = history.slice(-6);
      try { localStorage.setItem('tianmingbai:dock-history', JSON.stringify(history)); } catch (_) {}
    } catch (err) {
      const reason = err && err.name === 'AbortError' ? '等太久了，模型没有返回' : (err && err.message ? err.message : '网络异常');
      addError(`${reason}。稍等几秒再问一次。`);
    } finally {
      sendBtn.disabled = false;
      sendBtn.textContent = '问一句';
    }
  }

  sendBtn.addEventListener('click', () => ask(input.value));
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.isComposing) {
      event.preventDefault();
      ask(input.value);
    }
  });
  root.querySelectorAll('.dock-chip').forEach((chip) => {
    chip.addEventListener('click', () => ask(chip.textContent));
  });

  let folded = false;
  foldBtn.addEventListener('click', () => {
    folded = true;
    body.style.display = 'none';
    mini.style.display = 'flex';
  });
  mini.addEventListener('click', () => {
    folded = false;
    body.style.display = '';
    mini.style.display = 'none';
    input.focus();
  });

  if (typeof window !== 'undefined') window.__askDockReady = true;
})();
