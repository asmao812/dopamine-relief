#!/usr/bin/env python3
"""Daily store rotation for Joyville — adds 1-2 new stores, shuffles ordering.
Runs at 2AM daily via cron. Idempotent — maintains total store count 20-30 per category."""
import json, random, os, sys, time

DATA_DIR = "/home/ubuntu/dopamine-app/dist/data"
MAX_STORES = 30
MIN_STORES = 15

# ---- SPA Pool (reserve stores) ----
SPA_POOL = [
  {"id":"spa-brew","name":"麒麟一番榨精酿工坊","desc":"东京·百年啤酒品牌·精酿体验·啤酒配餐","image":"https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=800","category":"spa","products":[
    {"id":"br1","name":"精酿品鉴套餐·6款","price":880,"desc":"6款不同风格的麒麟精酿啤酒品鉴，搭配日式下酒小食。酿造师讲解啤酒花与麦芽的故事。","specs":{"杯数":"6款","含":"下酒小食+酿造师讲解"},"image":"https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=800","tags":["精酿","啤酒","日式"]}
  ]},
  {"id":"spa-kendo","name":"正武馆·剑道体验","desc":"上海·日本剑道七段师范·身心修炼","image":"https://images.unsplash.com/photo-1555597673-b21d5c935865?w=800","category":"spa","products":[
    {"id":"kd1","name":"剑道入门·90分钟","price":1200,"desc":"日本剑道七段师范亲自指导。含剑道礼仪、基本姿势、打击练习、实战稽古。提供全套护具。","specs":{"时长":"90分钟","师范":"剑道七段","含":"全套护具"},"image":"https://images.unsplash.com/photo-1555597673-b21d5c935865?w=800","tags":["剑道","武术","日本"]}
  ]},
  {"id":"spa-tea","name":"隐庐茶舍·宋代点茶","desc":"杭州龙井·非遗传承人·宋代点茶复原","image":"https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800","category":"spa","products":[
    {"id":"tea1","name":"宋代点茶仪式·90分钟","price":1800,"desc":"非物质文化遗产传承人演示宋代点茶全流程。亲手体验击拂、调膏、注汤、斗茶。含顶级龙井品鉴。","specs":{"时长":"90分钟","传承":"非遗","含":"龙井品鉴"},"image":"https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800","tags":["茶道","宋代","非遗"]}
  ]},
  {"id":"spa-taiko","name":"鼓道·太鼓体验","desc":"东京·和太鼓团体·释放压力新方式","image":"https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?w=800","category":"spa","products":[
    {"id":"tk1","name":"太鼓入门·60分钟","price":880,"desc":"在专业鼓手带领下，用全身力量敲击太鼓。极佳的压力释放方式，零基础可学。含基础节奏和团体合奏。","specs":{"时长":"60分钟","含":"专业鼓手指导+合奏"},"image":"https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?w=800","tags":["太鼓","压力释放","日本"]}
  ]},
  {"id":"spa-paraglide","name":"飞鹰滑翔伞基地","desc":"浙江安吉·国家级教练·双人带飞","image":"https://images.unsplash.com/photo-1608236466195-80ef53ae2dfc?w=800","category":"spa","products":[
    {"id":"pg1","name":"双人滑翔伞体验·含GoPro拍摄","price":2800,"desc":"国家级教练带飞，从600米山顶起飞，俯瞰竹海和茶园。含GoPro全程拍摄、精修视频。","specs":{"时长":"约20分钟飞行","高度":"600米","含":"GoPro拍摄+视频"},"image":"https://images.unsplash.com/photo-1608236466195-80ef53ae2dfc?w=800","tags":["滑翔伞","飞行","极限运动"]}
  ]},
  {"id":"spa-skydive","name":"天际跳伞俱乐部","desc":"海南博鳌·USPA认证·4000米高空跳伞","image":"https://images.unsplash.com/photo-1520923642038-b4259acecbd7?w=800","category":"spa","products":[
    {"id":"sd1","name":"双人跳伞·4000米高空","price":5800,"desc":"USPA认证教练带跳，4000米高空出舱。自由落体约50秒，感受真正的飞行。含全程视频和证书。","specs":{"高度":"4000米","时长":"自由落体50秒","含":"全程视频+证书"},"image":"https://images.unsplash.com/photo-1520923642038-b4259acecbd7?w=800","tags":["跳伞","极限","高空"]}
  ]},
  {"id":"spa-bonsai","name":"盆景艺术馆","desc":"苏州·百年盆景世家·国家级盆景大师","image":"https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=800","category":"spa","products":[
    {"id":"bn1","name":"盆景制作体验·3小时","price":2800,"desc":"国家级盆景大师一对一指导，亲手制作一盆属于自己的微型盆景。含百年盆景园参观、茶席、带回作品。","specs":{"时长":"3小时","大师":"国家级","含":"带回作品+茶席"},"image":"https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=800","tags":["盆景","艺术","苏州"]}
  ]},
  {"id":"spa-zero","name":"零重力漂浮舱体验中心","desc":"上海·NASA技术·极致放松·感官剥夺","image":"https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800","category":"spa","products":[
    {"id":"fl1","name":"零重力漂浮·90分钟","price":1680,"desc":"高浓度硫酸镁溶液模拟死海，水温与体温同步。黑暗中漂浮90分钟，彻底消除重力对脊柱的压力。NASA宇航员训练同款。","specs":{"时长":"90分钟","原理":"高浓度镁盐溶液","功效":"脊柱减压+深度放松"},"image":"https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800","tags":["漂浮","NASA","减压"]}
  ]},
  {"id":"spa-cooking","name":"蓝带厨艺学院·体验课","desc":"上海·法国蓝带·世界顶级厨艺学校","image":"https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800","category":"spa","products":[
    {"id":"cb1","name":"法式甜点体验课·4小时","price":3800,"desc":"蓝带主厨指导，学习制作经典法式甜点：马卡龙、歌剧院蛋糕、可露丽。含所有食材和工具。","specs":{"时长":"4小时","含":"食材+工具+带走成品"},"image":"https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800","tags":["蓝带","甜点","法式"]}
  ]},
  {"id":"spa-bank","name":"瑞士私人银行VIP体验","desc":"苏黎世/日内瓦·200年历史私人银行·家族办公室","image":"https://images.unsplash.com/photo-1559526324-593bc073d938?w=800","category":"spa","products":[
    {"id":"bk1","name":"家族财富管理咨询·半天","price":28000,"desc":"瑞士200年历史私人银行高级顾问提供一对一财富规划。含全球资产配置、信托架构、税务优化建议。","specs":{"时长":"半天","顾问":"高级私人银行家","含":"资产配置+信托+税务"},"image":"https://images.unsplash.com/photo-1559526324-593bc073d938?w=800","tags":["私人银行","瑞士","财富管理"]}
  ]}
]

# ---- DutyFree Pool (reserve stores) ----
PRODUCTS_POOL = [
  {"id":"moet","name":"酩悦香槟旗舰店","desc":"法国Moët & Chandon·270年历史·全球最畅销香槟","image":"https://images.unsplash.com/photo-1594144432582-6c5c81fc2a1f?w=800","category":"dutyfree","products":[
    {"id":"mt1","name":"Moët Impérial 750ml","price":680,"desc":"酩悦经典的Brut Impérial，霞多丽+黑皮诺+莫尼耶三种葡萄调配。柑橘和青苹果的清新感。","specs":{"容量":"750ml","葡萄":"霞多丽+黑皮诺+莫尼耶"},"image":"https://images.unsplash.com/photo-1594144432582-6c5c81fc2a1f?w=800","tags":["香槟","酩悦","经典"]}
  ]},
  {"id":"glenfi","name":"格兰菲迪旗舰店","desc":"苏格兰格兰菲迪·单一麦芽威士忌销量第一","image":"https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=800","category":"dutyfree","products":[
    {"id":"gf1","name":"Glenfiddich 21年 Gran Reserva 700ml","price":3800,"desc":"在加勒比朗姆酒桶中完成最后4个月陈酿。香蕉、无花果和太妃糖的甜美风味。","specs":{"年份":"21年","容量":"700ml","桶型":"朗姆酒桶收尾"},"image":"https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=800","tags":["威士忌","21年","朗姆桶"]}
  ]},
  {"id":"ballant","name":"百龄坛旗舰店","desc":"苏格兰百龄坛·1827年创立·调和威士忌王者","image":"https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=800","category":"dutyfree","products":[
    {"id":"bl1","name":"Ballantine's 30年 700ml","price":5800,"desc":"30年顶级调和威士忌。由超过50种麦芽和谷物威士忌调配，雪莉桶为主。","specs":{"年份":"30年","容量":"700ml","类型":"调和威士忌"},"image":"https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=800","tags":["威士忌","30年","调和"]}
  ]},
  {"id":"courvoi","name":"拿破仑干邑旗舰店","desc":"法国拿破仑干邑·1811年宫廷御用","image":"https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800","category":"dutyfree","products":[
    {"id":"cv1","name":"Courvoisier XO 700ml","price":2800,"desc":"由大小香槟区和边林区的陈年生命之水调配。杏干、蜂蜜和肉桂的温暖风味。","specs":{"容量":"700ml","类型":"XO干邑"},"image":"https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800","tags":["干邑","XO","拿破仑"]}
  ]},
  {"id":"montecristo","name":"蒙特克里斯托旗舰店","desc":"古巴蒙特克里斯托·1935年创立·最畅销古巴雪茄","image":"https://images.unsplash.com/photo-1527856263669-12c3a0af2fd6?w=800","category":"dutyfree","products":[
    {"id":"mc1","name":"Montecristo No.2 鱼雷 25支","price":8800,"desc":"古巴最经典的鱼雷雪茄。中等浓郁，可可、咖啡和雪松木的优雅风味。","specs":{"支数":"25支","形状":"鱼雷","风味":"可可/咖啡/雪松"},"image":"https://images.unsplash.com/photo-1527856263669-12c3a0af2fd6?w=800","tags":["雪茄","古巴","鱼雷"]}
  ]},
  {"id":"vs","name":"维多利亚的秘密旗舰店","desc":"美国Victoria's Secret·全球最知名内衣品牌","image":"https://images.unsplash.com/photo-1571513722275-4b41940f54b8?w=800","category":"dutyfree","products":[
    {"id":"vs1","name":"Very Sexy 蕾丝系列套装","price":1280,"desc":"标志性VS蕾丝设计，Push-Up聚拢效果。每年限量发布新配色。","specs":{"材质":"蕾丝+弹性面料","特点":"Push-Up聚拢"},"image":"https://images.unsplash.com/photo-1571513722275-4b41940f54b8?w=800","tags":["VS","蕾丝","聚拢"]}
  ]},
  {"id":"adidas","name":"Adidas旗舰店","desc":"德国阿迪达斯·Impossible Is Nothing·1949年创立","image":"https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800","category":"dutyfree","products":[
    {"id":"ad1","name":"Ultraboost Light 跑鞋","price":1499,"desc":"Light BOOST中底，比上一代轻30%。Primeknit+编织鞋面。日常跑步和穿搭两不误。","specs":{"中底":"Light BOOST","鞋面":"Primeknit+","特点":"轻量30%"},"image":"https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800","tags":["Adidas","BOOST","跑鞋"]}
  ]},
  {"id":"lg","name":"LG旗舰店","desc":"韩国LG·Life's Good·OLED显示技术领导者","image":"https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=800","category":"dutyfree","products":[
    {"id":"lg1","name":"LG Signature OLED R 可卷曲电视 65\"","price":688000,"desc":"全球首款可卷曲OLED电视。按下按钮，屏幕从底座缓缓升起。不用时完全隐藏。","specs":{"尺寸":"65英寸","技术":"可卷曲OLED","分辨率":"4K"},"image":"https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=800","tags":["LG","OLED","可卷曲"]}
  ]},
  {"id":"canon","name":"Canon佳能旗舰店","desc":"日本佳能·影像创新·1937年创立","image":"https://images.unsplash.com/photo-1516724562728-afc824a36e84?w=800","category":"dutyfree","products":[
    {"id":"cn1","name":"EOS R1 全画幅旗舰微单","price":48000,"desc":"2400万像素堆栈式CMOS，DIGIC X处理器。AI对焦系统，可识别30种主体。120fps连拍。","specs":{"像素":"2400万","处理器":"DIGIC X","连拍":"120fps","对焦":"AI 30种主体"},"image":"https://images.unsplash.com/photo-1516724562728-afc824a36e84?w=800","tags":["佳能","旗舰相机","AI对焦"]}
  ]},
  {"id":"hasselblad","name":"哈苏旗舰店","desc":"瑞典哈苏·1941年创立·登月相机·中画幅之王","image":"https://images.unsplash.com/photo-1516724562728-afc824a36e84?w=800","category":"dutyfree","products":[
    {"id":"hb1","name":"Hasselblad X2D 100C 中画幅","price":68000,"desc":"1亿像素44×33mm中画幅CMOS，16bit色彩深度。哈苏自然色彩解决方案HNCS。","specs":{"像素":"1亿","传感器":"44×33mm中画幅","色彩":"16bit"},"image":"https://images.unsplash.com/photo-1516724562728-afc824a36e84?w=800","tags":["哈苏","中画幅","1亿像素"]}
  ]},
  {"id":"porsche","name":"Porsche Design旗舰店","desc":"德国保时捷设计·Functional·Timeless·Purist","image":"https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800","category":"dutyfree","products":[
    {"id":"pd1","name":"Porsche Design 1919 Chronotimer","price":88000,"desc":"钛金属表壳，Porsche Design自有WERK 01.200自动机芯。灵感来自911仪表盘。","specs":{"材质":"钛金属","机芯":"WERK 01.200","灵感":"911仪表盘"},"image":"https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800","tags":["保时捷设计","钛金属","计时码表"]}
  ]},
  {"id":"tagheuer","name":"泰格豪雅旗舰店","desc":"瑞士TAG Heuer·Don't Crack Under Pressure·赛车计时先锋","image":"https://images.unsplash.com/photo-1619946794135-d2b3ff63afeb?w=800","category":"dutyfree","products":[
    {"id":"th1","name":"Monaco CAW211P 摩纳哥系列","price":58000,"desc":"39mm方形表壳，Calibre 11自动计时机芯。Steve McQueen《勒芒》电影同款。","specs":{"尺寸":"39mm方形","机芯":"Calibre 11自动","致敬":"Steve McQueen"},"image":"https://images.unsplash.com/photo-1619946794135-d2b3ff63afeb?w=800","tags":["泰格豪雅","摩纳哥","赛车"]}
  ]}
]

def load_json(path):
    """Load JSON, return [] on error."""
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return []

def save_json(path, data):
    """Save JSON with backup."""
    backup = path + '.bak'
    if os.path.exists(path):
        os.rename(path, backup)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def rotate(active_path, pool_data, max_stores=MAX_STORES, min_stores=MIN_STORES):
    """Rotate stores: add 1-2 from pool, remove excess, shuffle order."""
    active = load_json(active_path)
    active_ids = {s['id'] for s in active}

    # Filter pool: only stores NOT currently active
    available = [s for s in pool_data if s['id'] not in active_ids]
    
    if not available:
        # All stores active, just shuffle
        random.shuffle(active)
        save_json(active_path, active)
        return f"shuffled {len(active)} stores (no new stores available)"

    # Pick 1-2 new stores
    add_count = random.randint(1, min(2, len(available)))
    new_stores = random.sample(available, add_count)
    
    # Add to active
    active.extend(new_stores)
    active_ids.update(s['id'] for s in new_stores)

    # If too many, remove some (oldest or random)
    removed = []
    while len(active) > max_stores:
        # Remove random stores (but keep the newly added ones)
        candidates = [s for s in active if s['id'] not in {ns['id'] for ns in new_stores}]
        if candidates:
            to_remove = random.choice(candidates)
            active.remove(to_remove)
            removed.append(to_remove['name'])

    # Shuffle for freshness
    random.shuffle(active)
    
    save_json(active_path, active)
    
    msg = f"+{add_count} new stores: "
    msg += ", ".join(s['name'] for s in new_stores)
    if removed:
        msg += f" | -{len(removed)} old"
    msg += f" | total: {len(active)}"
    return msg

def main():
    random.seed(time.time())
    results = []
    
    # Rotate SPA
    result = rotate(os.path.join(DATA_DIR, 'spa.json'), SPA_POOL)
    results.append(f"SPA: {result}")
    
    # Rotate Products (DutyFree)
    result = rotate(os.path.join(DATA_DIR, 'products.json'), PRODUCTS_POOL)
    results.append(f"DutyFree: {result}")
    
    # Rotate Restaurants (shuffle only, no pool for now)
    restaurants_path = os.path.join(DATA_DIR, 'restaurants.json')
    restaurants = load_json(restaurants_path)
    if restaurants:
        random.shuffle(restaurants)
        save_json(restaurants_path, restaurants)
        results.append(f"Restaurants: shuffled {len(restaurants)} stores")
    
    output = "🔄 Joyville Daily Rotation | " + time.strftime('%Y-%m-%d %H:%M') + "\n" + "\n".join(results)
    print(output)
    return output

if __name__ == '__main__':
    main()
